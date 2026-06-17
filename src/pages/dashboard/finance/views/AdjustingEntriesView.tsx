import { useState, useEffect, useMemo } from 'react'
import { spreadsheetApi } from '@/lib/spreadsheet'
import { defaultEngine } from '@/lib/accounting'
import { filterJournalEntriesByPeriod, type PeriodFilter } from '@/lib/accounting/period'
import JournalEntryModal from '@/components/accounting/JournalEntryModal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { Loader2, ArrowUpDown, Edit, Pencil, SlidersHorizontal } from 'lucide-react'

interface AdjustingEntriesViewProps {
  period: PeriodFilter
}

const parseJournalLines = (lines: unknown) => {
  if (!lines) return []

  if (Array.isArray(lines)) {
    return lines.map((line: any) => ({
      accountNumber: String(line.accountNumber || line.account_number || ''),
      amount: Number(line.amount) || 0
    })).filter(line => line.accountNumber && line.amount > 0)
  }

  if (typeof lines === 'string') {
    try {
      const parsed = JSON.parse(lines)
      return parseJournalLines(parsed)
    } catch {
      return []
    }
  }

  return []
}

const normalizeJournalEntry = (entry: any) => ({
  ...entry,
  id: String(entry.id || ''),
  date: entry.date || '',
  description: entry.description || '',
  debits: parseJournalLines(entry.debits),
  credits: parseJournalLines(entry.credits)
})

const isAdjustingEntry = (entry: any) => {
  const id = String(entry.id || '').toLowerCase()
  const description = String(entry.description || '').toLowerCase()
  const source = String(entry.source || entry.type || '').toLowerCase()

  return id.startsWith('adj') || source.includes('adjust') || source.includes('penyesuaian') || description.includes('adjusting') || description.includes('penyesuaian')
}

export default function AdjustingEntriesView({ period }: AdjustingEntriesViewProps) {
  const [journalEntries, setJournalEntries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<any | null>(null)

  async function loadData() {
    setLoading(true)
    try {
      const journalRes = await spreadsheetApi.get('JournalEntries')
      setJournalEntries(Array.isArray(journalRes.data) ? journalRes.data.map(normalizeJournalEntry) : [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const actualEntries = useMemo(() => {
    return filterJournalEntriesByPeriod(journalEntries, period).filter(isAdjustingEntry)
  }, [journalEntries, period])

  const sortedEntries = useMemo(() => {
    return [...actualEntries].sort((a, b) => {
      const dateA = new Date(a.date).getTime()
      const dateB = new Date(b.date).getTime()
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA
    })
  }, [actualEntries, sortOrder])

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return

    const results = await Promise.all(selectedIds.map(id => spreadsheetApi.del('JournalEntries', id)))
    if (results.some(result => !result.success)) {
      console.error('Sebagian jurnal penyesuaian gagal dihapus dari spreadsheet.')
    }

    setJournalEntries(prev => prev.filter(entry => !selectedIds.includes(String(entry.id))))
    setSelectedIds([])
    setIsEditMode(false)
    setIsDeleteDialogOpen(false)
  }

  const formatCurrencyParts = (val: number) => {
    const formatted = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(val)
    return { symbol: 'Rp', amount: formatted }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const day = date.getDate().toString().padStart(2, '0')
    const month = date.toLocaleString('id-ID', { month: 'short' })
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }

  const formatJournalId = (id: string) => (
    id.split('-').length > 2 ? `ADJ-${id.split('-')[2].slice(-4)}` : id
  )

  const getAccountName = (num: string) => {
    const acc = defaultEngine.coa.getAccount(num)
    return acc ? acc.accountName : '-'
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-emerald-700">
        <Loader2 className="w-10 h-10 animate-spin mb-4" />
        <p className="font-medium">Memuat Jurnal Penyesuaian...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight leading-tight flex items-center">
            <SlidersHorizontal className="mr-3 text-primary w-8 h-8 flex-shrink-0" />
            Jurnal Penyesuaian (Adjusting Entries)
          </h1>
          <p className="text-text-secondary mt-1">
            Daftar jurnal penyesuaian aktual yang tersimpan di sistem.
          </p>
        </div>
      </div>

      <div className="card-container p-0 overflow-hidden">
        <div className="p-5 border-b border-border bg-white flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <h3 className="font-bold text-gray-800 text-lg">Jurnal Penyesuaian</h3>
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-sm font-medium text-gray-700 bg-gray-50 px-3.5 py-2 rounded-xl border border-gray-200 shadow-sm">
              Total jurnal: {sortedEntries.length}
            </div>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 px-3.5 py-2 rounded-xl border border-gray-200 transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <ArrowUpDown className="w-4 h-4 text-gray-500" />
              <span>Urutan: {sortOrder === 'asc' ? 'Terlama' : 'Terbaru'}</span>
            </button>

            {!isEditMode ? (
              <button
                onClick={() => setIsEditMode(true)}
                className="text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 px-3.5 py-2 rounded-xl border border-blue-200 transition-colors flex items-center gap-1.5 shadow-sm hover:shadow-md"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setIsEditMode(false)
                    setSelectedIds([])
                  }}
                  className="text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 px-3.5 py-2 rounded-xl border border-gray-300 transition-colors shadow-sm"
                >
                  Batal
                </button>
                <button
                  onClick={() => setIsDeleteDialogOpen(true)}
                  disabled={selectedIds.length === 0}
                  className="text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed px-3.5 py-2 rounded-xl transition-colors shadow-sm shadow-red-500/10"
                >
                  Hapus Pilihan ({selectedIds.length})
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full table-fixed text-left text-sm">
            <colgroup>
              {isEditMode && <col className="w-12" />}
              <col className="w-[11%]" />
              <col className="w-[13%]" />
              <col className="w-[29%]" />
              <col className="w-[13%]" />
              <col className="w-[17%]" />
              <col className="w-[17%]" />
              {isEditMode && <col className="w-16" />}
            </colgroup>
            <thead className="bg-[#F8FAFC] border-b border-gray-200 text-gray-600">
              <tr>
                {isEditMode && (
                  <th className="px-4 py-4 text-center w-12">
                    <input
                      type="checkbox"
                      checked={sortedEntries.length > 0 && selectedIds.length === sortedEntries.length}
                      onChange={(event) => {
                        if (event.target.checked) {
                          setSelectedIds(sortedEntries.map(entry => String(entry.id)))
                        } else {
                          setSelectedIds([])
                        }
                      }}
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                    />
                  </th>
                )}
                <th className="px-4 py-4 font-semibold whitespace-nowrap text-center">ID Jurnal</th>
                <th className="px-4 py-4 font-semibold whitespace-nowrap text-center">Tanggal</th>
                <th className="px-4 py-4 font-semibold text-center">Deskripsi</th>
                <th className="px-4 py-4 font-semibold text-center">Ref</th>
                <th className="px-5 py-4 font-semibold text-center">Debit</th>
                <th className="px-5 py-4 font-semibold text-center">Kredit</th>
                {isEditMode && <th className="px-4 py-4 font-semibold text-center w-16">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700 bg-white">
              {sortedEntries.length === 0 ? (
                <tr>
                  <td colSpan={isEditMode ? 8 : 6} className="px-6 py-12 text-center text-text-muted">
                    Belum ada jurnal penyesuaian aktual pada periode ini.
                  </td>
                </tr>
              ) : (
                sortedEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50/50 align-top transition-colors">
                    {isEditMode && (
                      <td className="px-4 py-5 text-center align-middle">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(String(entry.id))}
                          onChange={() => {
                            const entryId = String(entry.id)
                            if (selectedIds.includes(entryId)) {
                              setSelectedIds(selectedIds.filter(id => id !== entryId))
                            } else {
                              setSelectedIds([...selectedIds, entryId])
                            }
                          }}
                          className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                        />
                      </td>
                    )}
                    <td className="px-4 py-5 text-center">
                      <div className="text-xs text-gray-600 font-mono bg-gray-50 inline-block px-1.5 py-1 rounded border border-gray-100">
                        {formatJournalId(entry.id)}
                      </div>
                    </td>
                    <td className="px-4 py-5 whitespace-nowrap text-center">
                      <div className="font-medium text-gray-900">{formatDate(entry.date)}</div>
                    </td>
                    <td className="px-4 py-5">
                      <div className="space-y-2 text-[14px] leading-5">
                        {entry.debits.map((d, i) => (
                          <div key={`d-${i}`} className="text-gray-900 font-medium truncate">
                            {getAccountName(d.accountNumber)}
                          </div>
                        ))}
                        {entry.credits.map((c, i) => (
                          <div key={`c-${i}`} className="text-gray-900 pl-6 truncate">
                            {getAccountName(c.accountNumber)}
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 max-w-full truncate text-[13px] leading-5 text-[#047857] italic font-medium">
                        ({entry.description})
                      </div>
                    </td>
                    <td className="px-4 py-5 text-center">
                      <div className="space-y-2 text-[14px] leading-5">
                        {entry.debits.map((d, i) => (
                          <div key={`dref-${i}`} className="text-gray-500">{d.accountNumber}</div>
                        ))}
                        {entry.credits.map((c, i) => (
                          <div key={`cref-${i}`} className="text-gray-500">{c.accountNumber}</div>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-5 text-right">
                      <div className="space-y-2 text-[14px] leading-5">
                        {entry.debits.map((d, i) => {
                          const { symbol, amount } = formatCurrencyParts(d.amount)
                          return (
                            <div key={`da-${i}`} className="text-gray-900 font-medium flex justify-between w-full">
                              <span className="text-gray-500 mr-2">{symbol}</span>
                              <span>{amount}</span>
                            </div>
                          )
                        })}
                        {entry.credits.map((c, i) => (
                          <div key={`ca-empty-${i}`} className="text-transparent select-none flex justify-between w-full">
                            <span className="mr-2">Rp</span><span>0</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-5 text-right">
                      <div className="space-y-2 text-[14px] leading-5">
                        {entry.debits.map((d, i) => (
                          <div key={`ds-empty-${i}`} className="text-transparent select-none flex justify-between w-full">
                            <span className="mr-2">Rp</span><span>0</span>
                          </div>
                        ))}
                        {entry.credits.map((c, i) => {
                          const { symbol, amount } = formatCurrencyParts(c.amount)
                          return (
                            <div key={`ca-${i}`} className="text-gray-900 flex justify-between w-full">
                              <span className="text-gray-500 mr-2">{symbol}</span>
                              <span>{amount}</span>
                            </div>
                          )
                        })}
                      </div>
                    </td>
                    {isEditMode && (
                      <td className="px-4 py-5 text-center align-middle">
                        <button
                          onClick={() => {
                            setEditingEntry(entry)
                            setIsModalOpen(true)
                          }}
                          className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                          title="Edit jurnal penyesuaian"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <JournalEntryModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingEntry(null)
          loadData()
        }}
        editingEntry={editingEntry || undefined}
      />
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        title="Hapus Jurnal Penyesuaian"
        message={`Apakah Anda yakin ingin menghapus ${selectedIds.length} jurnal penyesuaian terpilih?`}
        confirmLabel="Ya, Hapus"
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteSelected}
      />
    </div>
  )
}
