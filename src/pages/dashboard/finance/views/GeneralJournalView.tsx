import { useState, useEffect } from 'react'
import { defaultEngine } from '@/lib/accounting'
import type { JournalEntry, Account, AccountType } from '@/lib/accounting'
import { spreadsheetApi } from '@/lib/spreadsheet'
import { mergeAccounts } from '@/lib/chartOfAccounts'
import JournalEntryModal from '@/components/accounting/JournalEntryModal'
import { PlusCircle } from 'lucide-react'

export default function GeneralJournalView() {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [isSyncing, setIsSyncing] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    refreshData()
  }, [])

  const refreshData = async () => {
    setIsSyncing(true)
    try {
      const { data } = await spreadsheetApi.get('MasterData')
      const merged = mergeAccounts(data && Array.isArray(data) ? data : [])
      
      const typeMap: Record<string, AccountType> = {
        'Harta': 'Assets',
        'Kewajiban': 'Liabilities',
        'Modal': 'Equity',
        'Pendapatan': 'Revenues',
        'Beban': 'Expenses'
      }

      merged.forEach(acc => {
        if (acc.status === 'Aktif') {
          const mappedType = typeMap[acc.account_type] || 'Expenses'
          defaultEngine.coa.addAccount(acc.account_number, acc.account_name, mappedType)
          defaultEngine.ledger.ensureLedger(acc.account_number)
        }
      })
    } catch (err) {
      console.error("Gagal sinkronisasi data COA:", err)
    } finally {
      setIsSyncing(false)
      setEntries(defaultEngine.journal.getEntries().reverse())
      setAccounts(defaultEngine.coa.getAllAccounts())
    }
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    refreshData()
  }

  const formatCurrencyParts = (val: number) => {
    const formatted = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(val)
    return { symbol: 'Rp', amount: formatted }
  }

  // Format date to DD/MMM/YYYY
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const day = date.getDate().toString().padStart(2, '0')
    const month = date.toLocaleString('id-ID', { month: 'short' })
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Riwayat Jurnal Umum</h1>
          <p className="text-text-secondary mt-1">Daftar historis seluruh transaksi akuntansi.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center justify-center py-2.5 px-5 shadow-lg shadow-primary/20"
        >
          <PlusCircle className="w-5 h-5 mr-2" /> Catat Transaksi
        </button>
      </div>

      <div className="card-container p-0 overflow-hidden">
        <div className="p-5 border-b border-border bg-white flex justify-between items-center">
          <h3 className="font-bold text-gray-800 text-lg">Buku Jurnal Harian</h3>
          <span className="text-sm text-text-muted bg-gray-50 px-3 py-1 rounded-full border border-gray-100">Diurutkan dari terbaru</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#F8FAFC] border-b border-gray-200 text-gray-600">
              <tr>
                <th className="px-6 py-4 font-semibold whitespace-nowrap text-center">ID Jurnal</th>
                <th className="px-6 py-4 font-semibold whitespace-nowrap text-center">Tanggal</th>
                <th className="px-6 py-4 font-semibold text-center">Deskripsi</th>
                <th className="px-6 py-4 font-semibold text-center w-24">Ref</th>
                <th className="px-6 py-4 font-semibold text-center w-40">Debit</th>
                <th className="px-6 py-4 font-semibold text-center w-40">Kredit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700 bg-white">
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-text-muted">Belum ada transaksi dicatat.</td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50/50 align-top transition-colors">
                    <td className="px-6 py-5 text-center">
                      <div className="text-xs text-gray-600 font-mono bg-gray-50 inline-block px-2 py-1 rounded border border-gray-100">{entry.id.split('-').length > 2 ? `JE-${entry.id.split('-')[2].slice(-4)}` : entry.id}</div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-center">
                      <div className="font-medium text-gray-900">{formatDate(entry.date)}</div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="space-y-1.5 text-[14px]">
                        {/* Debits */}
                        {entry.debits.map((d, i) => {
                          const acc = accounts.find(a => a.accountNumber === d.accountNumber)
                          return <div key={`d-${i}`} className="text-gray-900 font-medium">{acc?.accountName}</div>
                        })}
                        {/* Credits (Indented) */}
                        {entry.credits.map((c, i) => {
                          const acc = accounts.find(a => a.accountNumber === c.accountNumber)
                          return <div key={`c-${i}`} className="text-gray-900 pl-6">{acc?.accountName}</div>
                        })}
                      </div>
                      {/* Keterangan berada di bawah baris kredit (sesuai permintaan user) */}
                      <div className="mt-2.5 text-[13px] text-[#047857] italic border-t border-gray-100 pt-2 inline-block font-medium">
                        ({entry.description})
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="space-y-1.5 text-[14px]">
                        {entry.debits.map((d, i) => (
                          <div key={`dref-${i}`} className="text-gray-500">{d.accountNumber}</div>
                        ))}
                        {entry.credits.map((c, i) => (
                          <div key={`cref-${i}`} className="text-gray-500">{c.accountNumber}</div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right w-40">
                      <div className="space-y-1.5 text-[14px]">
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
                          <div key={`ca-${i}`} className="text-transparent select-none flex justify-between w-full">
                            <span className="mr-2">Rp</span><span>0</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right w-40">
                      <div className="space-y-1.5 text-[14px]">
                        {entry.debits.map((d, i) => (
                          <div key={`ds-${i}`} className="text-transparent select-none flex justify-between w-full">
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
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <JournalEntryModal isOpen={isModalOpen} onClose={handleModalClose} />
    </div>
  )
}
