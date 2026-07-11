import { useState, useEffect } from 'react'
import { defaultEngine, syncAccountingWithSheet } from '@/features/accounting'
import type { JournalEntry, Account } from '@/features/accounting'
import { filterJournalEntriesByPeriod, getPeriodLabel, type PeriodFilter } from '@/features/accounting/calculations/period'
import JournalEntryModal from '@/features/accounting/components/JournalEntryModal'
import AccountingDownloadMenu from '@/features/accounting/components/AccountingDownloadMenu'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { Loader2, ScrollText, ArrowUpDown, Pencil, Eye, Trash2, X, PlusCircle, Edit } from 'lucide-react'
import { spreadsheetApi } from '@/services/sheets-client'

interface GeneralJournalViewProps {
  period: PeriodFilter
}

export default function GeneralJournalView({ period }: GeneralJournalViewProps) {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [isSyncing, setIsSyncing] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [successDialog, setSuccessDialog] = useState<{
    isOpen: boolean
    title: string
    message: string
  }>({
    isOpen: false,
    title: '',
    message: ''
  })
  
  // Sorting and Edit States
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null)
  const [selectedDetailEntry, setSelectedDetailEntry] = useState<any | null>(null)

  const refreshData = () => {
    setEntries(defaultEngine.journal.getEntries())
    setAccounts(defaultEngine.coa.getAllAccounts())
    setIsSyncing(false)
  }

  useEffect(() => {
    refreshData()
  }, [])

  const handleModalClose = () => {
    setIsModalOpen(false)
    setEditingEntry(null)
    refreshData()
  }

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return
    
    setIsDeleting(true)
    try {
      const count = selectedIds.length
      // Delete all selected from spreadsheet
      await Promise.all(selectedIds.map(id => spreadsheetApi.del('JournalEntries', id)))
      
      // Re-sync local defaultEngine singleton
      await syncAccountingWithSheet()
      
      // Clear selections and edit mode
      setSelectedIds([])
      setIsEditMode(false)
      setIsDeleteDialogOpen(false)
      refreshData()

      // Show success dialog
      setSuccessDialog({
        isOpen: true,
        title: 'Penghapusan Berhasil',
        message: `${count} entri jurnal umum berhasil dihapus secara permanen dari database.`
      })
    } catch (err) {
      console.error("Gagal menghapus jurnal:", err)
    } finally {
      setIsDeleting(false)
    }
  }

  const formatCurrencyParts = (val: number) => {
    const formatted = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(val)
    return { symbol: 'Rp', amount: formatted }
  }

  const formatAmount = (val: number) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(val)

  const formatJournalId = (id: string) => (
    id.split('-').length > 2 ? `JE-${id.split('-')[2].slice(-4)}` : id
  )

  // Format date to DD/MMM/YYYY
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const day = date.getDate().toString().padStart(2, '0')
    const month = date.toLocaleString('id-ID', { month: 'short' })
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }

  // Sort entries based on date and order state
  const filteredEntries = filterJournalEntriesByPeriod(entries, period).filter(entry => {
    const isClosing = entry.source === 'manual_closing' || String(entry.id).toUpperCase().startsWith('CL-')
    const isAdjusting = entry.source === 'manual_adjusting' || entry.source === 'depreciation' || entry.source === 'unearned_rent' || String(entry.id).toUpperCase().startsWith('ADJ-')
    return !isClosing && !isAdjusting
  })

  const sortedEntries = [...filteredEntries].sort((a, b) => {
    const dateA = new Date(a.date).getTime()
    const dateB = new Date(b.date).getTime()
    return sortOrder === 'asc' ? dateA - dateB : dateB - dateA
  })

  const getAccountName = (accountNumber: string) => (
    accounts.find(account => account.accountNumber === accountNumber)?.accountName || '-'
  )

  const getExportRows = () => sortedEntries.flatMap(entry => [
    ...entry.debits.map(debit => ({
      id: formatJournalId(entry.id),
      date: formatDate(entry.date),
      description: entry.description,
      accountName: getAccountName(debit.accountNumber),
      ref: debit.accountNumber,
      debit: debit.amount,
      credit: '',
    })),
    ...entry.credits.map(credit => ({
      id: formatJournalId(entry.id),
      date: formatDate(entry.date),
      description: entry.description,
      accountName: `    ${getAccountName(credit.accountNumber)}`, // Indent credit account
      ref: credit.accountNumber,
      debit: '',
      credit: credit.amount,
    })),
  ])

  const exportRows = getExportRows()
  const periodLabel = getPeriodLabel(period)
  const periodSlug = periodLabel.toLowerCase().replace(/[^a-z0-9]+/gi, '-').replace(/(^-|-$)/g, '') || 'semua-periode'
  const journalExportRows = exportRows.map(row => [
    row.id,
    row.date,
    row.description,
    row.accountName,
    row.ref,
    typeof row.debit === 'number' ? `Rp ${formatAmount(row.debit)}` : '',
    typeof row.credit === 'number' ? `Rp ${formatAmount(row.credit)}` : '',
  ])

  const journalPrintContent = (
    <div className="space-y-6">
      <div className="print-brand text-[11px] font-bold text-emerald-600 tracking-wider">SOEMATRA KOST</div>
      <h1 className="text-2xl font-bold text-gray-900 mt-1">Jurnal Umum</h1>
      <div className="text-[11px] text-gray-600 border-b-2 border-emerald-500 pb-2 mb-4">
        Periode: {periodLabel} | Dicetak: {new Date().toLocaleString('id-ID')}
      </div>
      
      <table className="w-full table-fixed text-left text-[11.5px] border border-gray-200 border-collapse">
        <colgroup>
          <col className="w-[12%]" />
          <col className="w-[54%]" />
          <col className="w-[10%]" />
          <col className="w-[12%]" />
          <col className="w-[12%]" />
        </colgroup>
        <thead className="bg-[#F8FAFC] border-b border-gray-300 text-gray-700 uppercase">
          <tr>
            <th className="px-3 py-2 border-r border-gray-200 font-bold text-center">Tanggal</th>
            <th className="px-3 py-2 border-r border-gray-200 font-bold text-center">Deskripsi</th>
            <th className="px-3 py-2 border-r border-gray-200 font-bold text-center">Ref</th>
            <th className="px-3 py-2 border-r border-gray-200 font-bold text-center">Debit</th>
            <th className="px-3 py-2 font-bold text-center">Kredit</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 text-gray-700 bg-white">
          {sortedEntries.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                Belum ada transaksi pada periode ini.
              </td>
            </tr>
          ) : (
            sortedEntries.map((entry) => (
              <tr key={entry.id} className="align-top border-b border-gray-200">

                <td className="px-3 py-2 border-r border-gray-200 text-center print-center whitespace-nowrap">
                  {formatDate(entry.date)}
                </td>
                <td className="px-3 py-2 border-r border-gray-200">
                  <div className="space-y-1.5 text-[11px] leading-relaxed">
                    {/* Debits */}
                    {entry.debits.map((d, i) => {
                      const acc = accounts.find(a => a.accountNumber === d.accountNumber)
                      return <div key={`d-${i}`} className="text-gray-900 font-semibold">{acc?.accountName}</div>
                    })}
                    {/* Credits (Indented) */}
                    {entry.credits.map((c, i) => {
                      const acc = accounts.find(a => a.accountNumber === c.accountNumber)
                      return <div key={`c-${i}`} className="text-gray-900 pl-4">{acc?.accountName}</div>
                    })}
                  </div>
                  {/* Keterangan di baris paling bawah ayat jurnal */}
                  <div className="mt-1 text-[10px] leading-normal text-[#047857] italic font-semibold">
                    ({entry.description})
                  </div>
                </td>
                <td className="px-3 py-2 border-r border-gray-200 text-center print-center text-gray-500">
                  <div className="space-y-1.5">
                    {entry.debits.map((d, i) => (
                      <div key={`dref-${i}`}>{d.accountNumber}</div>
                    ))}
                    {entry.credits.map((c, i) => (
                      <div key={`cref-${i}`}>{c.accountNumber}</div>
                    ))}
                  </div>
                </td>
                <td className="px-3 py-2 border-r border-gray-200">
                  <div className="space-y-1.5 text-right">
                    {entry.debits.map((d, i) => (
                      <div key={`da-${i}`} className="text-gray-900 font-semibold flex justify-between w-full">
                        <span className="text-gray-400 font-normal">Rp</span>
                        <span>{formatAmount(d.amount)}</span>
                      </div>
                    ))}
                    {entry.credits.map((c, i) => (
                      <div key={`ca-${i}`} className="text-transparent select-none flex justify-between w-full">
                        <span>Rp</span><span>0</span>
                      </div>
                    ))}
                  </div>
                </td>
                <td className="px-3 py-2">
                  <div className="space-y-1.5 text-right">
                    {entry.debits.map((d, i) => (
                      <div key={`ds-${i}`} className="text-transparent select-none flex justify-between w-full">
                        <span>Rp</span><span>0</span>
                      </div>
                    ))}
                    {entry.credits.map((c, i) => (
                      <div key={`ca-${i}`} className="text-gray-900 font-semibold flex justify-between w-full">
                        <span className="text-gray-400 font-normal">Rp</span>
                        <span>{formatAmount(c.amount)}</span>
                      </div>
                    ))}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight flex items-center">
            <ScrollText className="mr-2 sm:mr-3 text-primary w-6 h-6 sm:w-8 sm:h-8" />
            Riwayat Jurnal Umum
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">Daftar historis seluruh transaksi akuntansi.</p>
        </div>
        <div className="flex items-center gap-3">
          <AccountingDownloadMenu
            fileName={`jurnal-umum-${periodSlug}`}
            title="Jurnal Umum"
            meta={`Periode: ${periodLabel} | Dicetak: ${new Date().toLocaleString('id-ID')}`}
            headers={['ID Jurnal', 'Tanggal', 'Deskripsi', 'Akun', 'Ref', 'Debit', 'Kredit']}
            rows={journalExportRows}
            amountColumnIndexes={[5, 6]}
            colWidths={['10%', '12%', '20%', '22%', '8%', '14%', '14%']}
            printContent={journalPrintContent}
          />

          <button 
            onClick={() => {
              setEditingEntry(null)
              setIsModalOpen(true)
            }}
            className="btn-primary flex min-h-[46px] min-w-[212px] items-center justify-center py-2.5 px-5 shadow-lg shadow-primary/20"
          >
            <PlusCircle className="w-5 h-5 mr-2" /> Catat Transaksi
          </button>
        </div>
      </div>

      <div className="card-container p-0 overflow-hidden">
        <div className="p-5 border-b border-border bg-white flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <h3 className="font-bold text-gray-800 text-lg">Buku Jurnal Harian</h3>
          
          <div className="flex flex-wrap items-center gap-3">
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
        
        <div className="overflow-x-auto w-full">
          <table className="min-w-[850px] w-full table-fixed text-left text-sm">
            <colgroup>
              {isEditMode && <col className="w-16" />}
              <col className="w-[12%]" />
              <col className="w-[41%]" />
              <col className="w-[13%]" />
              <col className="w-[17%]" />
              <col className="w-[17%]" />
              {isEditMode && <col className="w-32" />}
            </colgroup>
            <thead className="bg-[#F8FAFC] border-b border-gray-200 text-gray-600 text-xs uppercase font-semibold">
              <tr>
                {isEditMode && (
                  <th className="px-4 py-4 text-center w-12">
                    <input 
                      type="checkbox"
                      checked={sortedEntries.length > 0 && selectedIds.length === sortedEntries.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedIds(sortedEntries.map(ent => ent.id))
                        } else {
                          setSelectedIds([])
                        }
                      }}
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                    />
                  </th>
                )}
                <th className="px-4 py-4 font-semibold whitespace-nowrap text-center">Tanggal</th>
                <th className="px-4 py-4 font-semibold text-center">Deskripsi</th>
                <th className="px-4 py-4 font-semibold text-center">Ref</th>
                <th className="px-5 py-4 font-semibold text-center">Debit</th>
                <th className="px-5 py-4 font-semibold text-center">Kredit</th>
                {isEditMode && <th className="px-6 py-4 font-semibold text-center w-32">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700 bg-white">
              {sortedEntries.length === 0 ? (
                <tr>
                  <td colSpan={isEditMode ? 7 : 5} className="px-6 py-12 text-center text-text-muted">
                    {isSyncing ? 'Memuat data transaksi...' : 'Belum ada transaksi pada periode ini.'}
                  </td>
                </tr>
              ) : (
                sortedEntries.map((entry) => {
                  const journalRows = [
                    ...entry.debits.map((d) => ({
                      type: 'debit' as const,
                      accountNumber: d.accountNumber,
                      amount: d.amount,
                    })),
                    ...entry.credits.map((c) => ({
                      type: 'credit' as const,
                      accountNumber: c.accountNumber,
                      amount: c.amount,
                    }))
                  ]

                  return (
                    <tr key={entry.id} className="hover:bg-gray-50/50 align-top transition-colors">
                      {isEditMode && (
                        <td className="px-4 py-5 text-center align-middle">
                          <input 
                            type="checkbox"
                            checked={selectedIds.includes(entry.id)}
                            onChange={() => {
                              if (selectedIds.includes(entry.id)) {
                                setSelectedIds(selectedIds.filter(id => id !== entry.id))
                              } else {
                                setSelectedIds([...selectedIds, entry.id])
                              }
                            }}
                            className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                          />
                        </td>
                      )}

                      <td className="px-4 py-5 whitespace-nowrap text-center">
                        <div className="font-medium text-gray-900">{formatDate(entry.date)}</div>
                      </td>
                      <td className="px-4 py-5">
                        <div className="space-y-2 text-[14px] leading-5">
                          {journalRows.map((row, idx) => {
                            const acc = accounts.find(a => a.accountNumber === row.accountNumber)
                            return (
                              <div 
                                key={idx} 
                                className={`text-gray-900 font-medium truncate h-5 flex items-center ${row.type === 'credit' ? 'pl-6' : ''}`}
                              >
                                {acc?.accountName}
                              </div>
                            )
                          })}
                        </div>
                        {/* Keterangan berada di bawah baris kredit (sesuai permintaan user) */}
                        <div className="mt-2 max-w-full truncate text-[13px] leading-5 text-[#047857] italic font-medium">
                          ({entry.description})
                        </div>
                      </td>
                      <td className="px-4 py-5 text-center">
                        <div className="space-y-2 text-[14px] leading-5">
                          {journalRows.map((row, idx) => (
                            <div key={idx} className="text-gray-500 h-5 flex items-center justify-center">
                              {row.accountNumber}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-5 text-right">
                        <div className="space-y-2 text-[14px] leading-5">
                          {journalRows.map((row, idx) => {
                            if (row.type === 'debit') {
                              const { symbol, amount } = formatCurrencyParts(row.amount)
                              return (
                                <div key={idx} className="text-gray-900 font-medium flex justify-between w-full h-5 items-center">
                                  <span className="text-gray-500 mr-2">{symbol}</span>
                                  <span>{amount}</span>
                                </div>
                              )
                            } else {
                              return (
                                <div key={idx} className="text-transparent select-none flex justify-between w-full h-5 items-center">
                                  <span className="mr-2">Rp</span><span>0</span>
                                </div>
                              )
                            }
                          })}
                        </div>
                      </td>
                      <td className="px-5 py-5 text-right">
                        <div className="space-y-2 text-[14px] leading-5">
                          {journalRows.map((row, idx) => {
                            if (row.type === 'credit') {
                              const { symbol, amount } = formatCurrencyParts(row.amount)
                              return (
                                <div key={idx} className="text-gray-900 font-medium flex justify-between w-full h-5 items-center">
                                  <span className="text-gray-500 mr-2">{symbol}</span>
                                  <span>{amount}</span>
                                </div>
                              )
                            } else {
                              return (
                                <div key={idx} className="text-transparent select-none flex justify-between w-full h-5 items-center">
                                  <span className="mr-2">Rp</span><span>0</span>
                                </div>
                              )
                            }
                          })}
                        </div>
                      </td>
                      {isEditMode && (
                        <td className="px-6 py-5 text-center align-middle">
                          <div className="flex justify-center items-center gap-1.5">
                            <button 
                              onClick={() => {
                                setSelectedDetailEntry(entry)
                              }}
                              className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors border border-transparent hover:border-emerald-100"
                              title="Detail transaksi"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => {
                                setEditingEntry(entry)
                                setIsModalOpen(true)
                              }}
                              className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                              title="Edit transaksi"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => {
                                setSelectedIds([entry.id])
                                setIsDeleteDialogOpen(true)
                              }}
                              className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                              title="Hapus transaksi"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <JournalEntryModal 
        isOpen={isModalOpen} 
        onClose={handleModalClose} 
        editingEntry={editingEntry}
      />
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        title="Hapus Jurnal"
        message={`Apakah Anda yakin ingin menghapus ${selectedIds.length} jurnal terpilih?`}
        confirmLabel="Ya, Hapus"
        isLoading={isDeleting}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteSelected}
      />
      <ConfirmDialog
        isOpen={successDialog.isOpen}
        title={successDialog.title}
        message={successDialog.message}
        variant="success"
        showCancel={false}
        confirmLabel="Selesai"
        onClose={() => setSuccessDialog(prev => ({ ...prev, isOpen: false }))}
      />

      {selectedDetailEntry && (
        <div className="fixed inset-0 w-screen h-screen z-[9999] flex items-center justify-center p-4 sm:p-6 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-300" onMouseDown={() => setSelectedDetailEntry(null)}>
          <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-2xl flex flex-col relative overflow-hidden animate-in zoom-in-95 duration-300" onMouseDown={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="px-6 pt-6 pb-4 border-b border-gray-150 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Detail Ayat Jurnal</h3>
                <p className="text-xs text-gray-500 mt-1">ID: {formatJournalId(selectedDetailEntry.id)}</p>
              </div>
              <button onClick={() => setSelectedDetailEntry(null)} className="p-2 text-gray-400 hover:text-white bg-gray-100 hover:bg-red-500 rounded-full transition-all duration-200 shadow-sm">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-4">
              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-150 text-sm">
                <div>
                  <span className="text-gray-500 block font-medium">Tanggal Transaksi</span>
                  <span className="font-semibold text-gray-900 mt-1 block">{formatDate(selectedDetailEntry.date)}</span>
                </div>
                <div>
                  <span className="text-gray-500 block font-medium">Keterangan / Deskripsi</span>
                  <span className="font-semibold text-emerald-800 mt-1 block">{selectedDetailEntry.description}</span>
                </div>
              </div>

              {/* Entries Table */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#F8FAFC] border-b border-gray-200 text-gray-600 uppercase font-semibold">
                    <tr>
                      <th className="px-4 py-2.5">Nama Akun</th>
                      <th className="px-4 py-2.5 text-center">Ref</th>
                      <th className="px-4 py-2.5 text-right">Debit</th>
                      <th className="px-4 py-2.5 text-right">Kredit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700 bg-white">
                    {/* Debits */}
                    {selectedDetailEntry.debits.map((d: any, idx: number) => {
                      const acc = accounts.find(a => a.accountNumber === d.accountNumber)
                      return (
                        <tr key={`d-${idx}`} className="hover:bg-gray-50/50">
                          <td className="px-4 py-3 font-semibold text-gray-900">{acc?.accountName || '-'}</td>
                          <td className="px-4 py-3 text-center text-gray-500">{d.accountNumber}</td>
                          <td className="px-4 py-3 text-right font-medium text-gray-900">Rp {formatAmount(d.amount)}</td>
                          <td className="px-4 py-3 text-right text-gray-400">-</td>
                        </tr>
                      )
                    })}
                    {/* Credits */}
                    {selectedDetailEntry.credits.map((c: any, idx: number) => {
                      const acc = accounts.find(a => a.accountNumber === c.accountNumber)
                      return (
                        <tr key={`c-${idx}`} className="hover:bg-gray-50/50">
                          <td className="px-4 py-3 pl-8 text-gray-900">{acc?.accountName || '-'}</td>
                          <td className="px-4 py-3 text-center text-gray-500">{c.accountNumber}</td>
                          <td className="px-4 py-3 text-right text-gray-400">-</td>
                          <td className="px-4 py-3 text-right font-medium text-gray-900">Rp {formatAmount(c.amount)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-150 flex justify-end">
              <button onClick={() => setSelectedDetailEntry(null)} className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold rounded-xl transition-all shadow-sm">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
