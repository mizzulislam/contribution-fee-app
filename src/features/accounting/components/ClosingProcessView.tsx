import { useState, useEffect, useMemo } from 'react'
import { spreadsheetApi } from '@/services/sheets-client'
import { defaultEngine, syncAccountingWithSheet, generateClosingEntries } from '@/features/accounting'
import { filterJournalEntriesByPeriod, buildPeriodAccountingEngine, type PeriodFilter } from '@/features/accounting/calculations/period'
import JournalEntryModal from '@/features/accounting/components/JournalEntryModal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { Loader2, ShieldAlert, ListTodo, ArrowUpDown, Edit, Pencil } from 'lucide-react'

interface ClosingProcessViewProps {
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

const isClosingEntry = (entry: any) => {
  const id = String(entry.id || '').toLowerCase()
  const description = String(entry.description || '').toLowerCase()
  const source = String(entry.source || entry.type || '').toLowerCase()

  return id.startsWith('cl') || source.includes('closing') || source.includes('penutup') || description.includes('closing') || description.includes('jurnal penutup') || description.includes('tutup buku')
}

export default function ClosingProcessView({ period }: ClosingProcessViewProps) {
  const [journalEntries, setJournalEntries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<any | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [alertDialog, setAlertDialog] = useState<{
    isOpen: boolean
    title: string
    message: string
    variant: 'danger' | 'info' | 'success'
    showCancel?: boolean
    confirmLabel?: string
    onConfirm?: () => void
  }>({
    isOpen: false,
    title: '',
    message: '',
    variant: 'info',
    showCancel: false,
    confirmLabel: 'Mengerti'
  })

  const handleGenerateClosing = () => {
    if (period.preset === 'all') {
      setAlertDialog({
        isOpen: true,
        title: 'Periode Tidak Valid',
        message: 'Pilih periode waktu yang spesifik (bukan Semua Periode) untuk menjalankan Tutup Buku.',
        variant: 'info',
        showCancel: false,
        confirmLabel: 'Mengerti'
      })
      return
    }
    if (actualClosingEntries.length > 0) {
      setAlertDialog({
        isOpen: true,
        title: 'Jurnal Sudah Ada',
        message: 'Jurnal penutup untuk periode ini sudah ada. Harap hapus terlebih dahulu jika ingin membuat ulang.',
        variant: 'info',
        showCancel: false,
        confirmLabel: 'Mengerti'
      })
      return
    }
    
    setAlertDialog({
      isOpen: true,
      title: 'Konfirmasi Tutup Buku',
      message: 'Apakah Anda yakin ingin menjalankan Tutup Buku untuk periode ini? Tindakan ini akan mengunci seluruh entri transaksi pada periode terkait.',
      variant: 'info',
      showCancel: true,
      confirmLabel: 'Ya, Jalankan',
      onConfirm: () => {
        setAlertDialog(prev => ({ ...prev, isOpen: false }))
        executeClosing()
      }
    })
  }

  const executeClosing = async () => {
    setIsGenerating(true)
    const closingDate = period.endDate || new Date().toISOString().split('T')[0]

    // Saga rollback helper
    const postedClosingEntries: string[] = []
    let errorMsg = ''

    try {
      // Step 1: Re-fetch and build period engine
      const periodEngine = buildPeriodAccountingEngine(period)
      const tbItems = periodEngine.getTrialBalance().map(item => {
        const acc = periodEngine.coa.getAccount(item.accountNumber)
        return {
          ...item,
          accountType: acc ? acc.accountType : 'Expenses'
        }
      })
      
      // Step 2: Generate GAAP closing entries
      const closingEntries = generateClosingEntries(tbItems, closingDate)
      
      if (closingEntries.length === 0) {
        throw new Error('Tidak ada akun nominal (Pendapatan/Beban/Prive) dengan saldo aktif untuk ditutup pada periode ini.')
      }

      // Step 3: Post generated entries sequentially
      for (const entry of closingEntries) {
        const payload = {
          id: entry.id,
          date: entry.date,
          description: entry.description,
          debits: JSON.stringify(entry.debits),
          credits: JSON.stringify(entry.credits),
          source: 'manual_closing',
          created_at: new Date().toISOString()
        }
        
        const res = await spreadsheetApi.post('JournalEntries', payload)
        if (!res.success) {
          throw new Error((res.error as any)?.message || `Gagal memposting jurnal penutup ${entry.id}`)
        }
        postedClosingEntries.push(entry.id)
      }

      // Sync and reload
      await syncAccountingWithSheet()
      await loadData()
      setAlertDialog({
        isOpen: true,
        title: 'Tutup Buku Berhasil',
        message: 'Tutup Buku berhasil diselesaikan! Seluruh akun nominal telah dinihilkan ke Laba Ditahan.',
        variant: 'success',
        showCancel: false,
        confirmLabel: 'Selesai'
      })
    } catch (err: any) {
      console.error('Tutup Buku gagal:', err)
      errorMsg = err.message || String(err)

      // Rollback Posted Entries
      for (const entryId of postedClosingEntries) {
        await spreadsheetApi.del('JournalEntries', entryId)
      }
      
      setAlertDialog({
        isOpen: true,
        title: 'Tutup Buku Gagal',
        message: `Gagal menjalankan Tutup Buku: ${errorMsg}. Seluruh jurnal penutup baru telah dibatalkan (rolled back).`,
        variant: 'danger',
        showCancel: false,
        confirmLabel: 'Mengerti'
      })
    } finally {
      setIsGenerating(false)
    }
  }

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

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const actualClosingEntries = useMemo(() => {
    return filterJournalEntriesByPeriod(journalEntries, period).filter(isClosingEntry)
  }, [journalEntries, period])

  const sortedClosingEntries = useMemo(() => {
    return [...actualClosingEntries].sort((a, b) => {
      const dateA = new Date(a.date).getTime()
      const dateB = new Date(b.date).getTime()
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA
    })
  }, [actualClosingEntries, sortOrder])

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return

    setIsDeleting(true)
    try {
      const count = selectedIds.length
      const results = await Promise.all(selectedIds.map(id => spreadsheetApi.del('JournalEntries', id)))
      if (results.some(result => !result.success)) {
        console.error('Sebagian jurnal penutup gagal dihapus dari spreadsheet.')
      }

      setJournalEntries(prev => prev.filter(entry => !selectedIds.includes(String(entry.id))))
      setSelectedIds([])
      setIsEditMode(false)
      setIsDeleteDialogOpen(false)

      setAlertDialog({
        isOpen: true,
        title: 'Penghapusan Berhasil',
        message: `${count} entri jurnal penutup berhasil dihapus secara permanen dari database.`,
        variant: 'success',
        showCancel: false,
        confirmLabel: 'Selesai'
      })
    } catch (err) {
      console.error(err)
    } finally {
      setIsDeleting(false)
    }
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
    id.split('-').length > 2 ? `CL-${id.split('-')[2].slice(-4)}` : id
  )

  const getAccountName = (num: string) => {
    const acc = defaultEngine.coa.getAccount(num)
    return acc ? acc.accountName : '-'
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-emerald-700">
        <Loader2 className="w-10 h-10 animate-spin mb-4" />
        <p className="font-medium">Memuat Jurnal Penutup...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="space-y-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight leading-tight flex items-center">
            <ShieldAlert className="mr-2 sm:mr-3 text-primary w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0" />
            Tutup Buku (Closing the Books)
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            Daftar jurnal penutup aktual yang tersimpan di sistem.
          </p>
        </div>
      </div>

      {/* closing explanation card */}
      <div className="card-container p-6 border-l-4 border-l-red-600 bg-red-50/20">
        <h3 className="font-semibold text-red-950 text-base flex items-center gap-2">
          <ListTodo className="w-5 h-5 text-red-600" />
          Alur & Langkah Jurnal Penutup (GAAP/IFRS):
        </h3>
        <ol className="list-decimal list-inside text-xs text-red-900 mt-3 space-y-2 leading-relaxed pl-2">
          <li><strong>Langkah 1:</strong> Mendebit semua akun Pendapatan (Revenues) dan mengkredit Ikhtisar Laba Rugi (3500) sebesar total pendapatan.</li>
          <li><strong>Langkah 2:</strong> Mendebit Ikhtisar Laba Rugi (3500) dan mengkredit semua akun Beban (Expenses) sebesar total beban masing-masing.</li>
          <li><strong>Langkah 3:</strong> Menutup saldo bersih Ikhtisar Laba Rugi ke Laba Ditahan (3201). (Jika laba, debit Ikhtisar Laba Rugi dan kredit Laba Ditahan; jika rugi, sebaliknya).</li>
          <li><strong>Langkah 4:</strong> Mendebit Laba Ditahan (3201) dan mengkredit akun Prive Pemilik (3301) untuk menihilkan prive/penarikan modal.</li>
        </ol>
      </div>

      {period.preset === 'all' && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <div className="text-sm font-semibold">Tutup Buku Otomatis Dinonaktifkan</div>
            <p className="text-xs mt-1">
              Untuk menjalankan Tutup Buku otomatis, harap pilih periode waktu yang spesifik (seperti Bulan Ini atau Bulan Lalu) pada filter periode di atas.
            </p>
          </div>
        </div>
      )}

      <div className="card-container p-0 overflow-visible">
        <div className="p-5 border-b border-border bg-white flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <h3 className="font-bold text-gray-800 text-lg">Jurnal Penutup</h3>
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-sm font-medium text-gray-700 bg-gray-50 px-3.5 py-2 rounded-xl border border-gray-200 shadow-sm min-h-10 flex items-center">
              Total jurnal: {sortedClosingEntries.length}
            </div>

            {period.preset !== 'all' && actualClosingEntries.length === 0 && (
              <button
                onClick={handleGenerateClosing}
                disabled={isGenerating}
                className="text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed px-3.5 py-2 rounded-xl transition-colors shadow-sm hover:shadow-md min-h-10 flex items-center gap-1.5 cursor-pointer"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                <span>Jalankan Tutup Buku</span>
              </button>
            )}
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 px-3.5 py-2 rounded-xl border border-gray-200 transition-colors flex items-center gap-1.5 shadow-sm min-h-10"
            >
              <ArrowUpDown className="w-4 h-4 text-gray-500" />
              <span>Urutan: {sortOrder === 'asc' ? 'Terlama' : 'Terbaru'}</span>
            </button>

            {!isEditMode ? (
              <button
                onClick={() => setIsEditMode(true)}
                className="text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 px-3.5 py-2 rounded-xl border border-blue-200 transition-colors flex items-center gap-1.5 shadow-sm hover:shadow-md min-h-10"
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
                  className="text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 px-3.5 py-2 rounded-xl border border-gray-300 transition-colors shadow-sm min-h-10"
                >
                  Batal
                </button>
                <button
                  onClick={() => setIsDeleteDialogOpen(true)}
                  disabled={selectedIds.length === 0}
                  className="text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed px-3.5 py-2 rounded-xl transition-colors shadow-sm shadow-red-500/10 min-h-10"
                >
                  Hapus Pilihan ({selectedIds.length})
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="min-w-[850px] w-full table-fixed text-left text-sm">
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
                      checked={sortedClosingEntries.length > 0 && selectedIds.length === sortedClosingEntries.length}
                      onChange={(event) => {
                        if (event.target.checked) {
                          setSelectedIds(sortedClosingEntries.map(entry => String(entry.id)))
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
              {sortedClosingEntries.length === 0 ? (
                <tr>
                  <td colSpan={isEditMode ? 8 : 6} className="px-6 py-12 text-center text-text-muted">
                    Belum ada jurnal penutup aktual pada periode ini.
                  </td>
                </tr>
              ) : (
                sortedClosingEntries.map((entry) => (
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
                          title="Edit jurnal penutup"
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
        title="Hapus Jurnal Penutup"
        message={`Apakah Anda yakin ingin menghapus ${selectedIds.length} jurnal penutup terpilih?`}
        confirmLabel="Ya, Hapus"
        isLoading={isDeleting}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteSelected}
      />
      <ConfirmDialog
        isOpen={alertDialog.isOpen}
        title={alertDialog.title}
        message={alertDialog.message}
        variant={alertDialog.variant}
        showCancel={alertDialog.showCancel}
        confirmLabel={alertDialog.confirmLabel}
        onClose={() => setAlertDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={alertDialog.onConfirm}
      />
    </div>
  )
}
