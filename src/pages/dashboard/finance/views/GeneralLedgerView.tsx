import { useState, useEffect } from 'react'
import { defaultEngine } from '@/lib/accounting'
import type { LedgerAccount, Account } from '@/lib/accounting'
import Select from '@/components/ui/Select'

export default function GeneralLedgerView() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [selectedAccount, setSelectedAccount] = useState('1102') // Default to Kas BCA
  const [ledgerData, setLedgerData] = useState<LedgerAccount | null>(null)

  useEffect(() => {
    setAccounts(defaultEngine.coa.getAllAccounts())
    refreshLedger('1102')
  }, [])

  const refreshLedger = (accNum: string) => {
    setLedgerData(defaultEngine.ledger.getLedger(accNum) || null)
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Buku Besar</h1>
          <p className="text-text-secondary mt-1">Melihat rincian mutasi (Debit/Kredit) dan Saldo Akhir per Akun tunggal.</p>
        </div>
      </div>

      <div className="card-container">
        <div className="max-w-md mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Akun</label>
          <Select 
            className="w-full"
            value={selectedAccount} 
            onChange={(val) => {
              setSelectedAccount(val)
              refreshLedger(val)
            }}
            options={accounts.map(acc => ({
              label: `${acc.accountNumber} - ${acc.accountName} (${acc.accountType} - Saldo Normal: ${acc.normalBalance})`,
              value: acc.accountNumber
            }))}
          />
        </div>

        {ledgerData ? (
          <div>
            <div className="mb-4 flex justify-between items-center bg-blue-50 p-4 rounded-xl border border-blue-100">
              <div>
                <h3 className="font-semibold text-blue-900">Saldo Akhir: {ledgerData.account.accountName}</h3>
                <p className="text-sm text-blue-700">Perhitungan berjalan menyesuaikan Saldo Normal ({ledgerData.account.normalBalance})</p>
              </div>
              <div className="text-2xl font-bold text-blue-900">
                {formatCurrency(ledgerData.currentBalance)}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#F3F4F6] border-b border-border text-gray-600">
                  <tr>
                    <th className="px-6 py-3 font-semibold whitespace-nowrap">Tanggal</th>
                    <th className="px-6 py-3 font-semibold whitespace-nowrap">Keterangan</th>
                    <th className="px-6 py-3 font-semibold text-right">Debit</th>
                    <th className="px-6 py-3 font-semibold text-right">Kredit</th>
                    <th className="px-6 py-3 font-semibold text-right">Saldo Berjalan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-gray-700 bg-white">
                  {ledgerData.entries.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-text-muted">Belum ada mutasi untuk akun ini.</td>
                    </tr>
                  ) : (
                    ledgerData.entries.map((entry, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-6 py-4">{new Date(entry.date).toLocaleDateString('id-ID')}</td>
                        <td className="px-6 py-4">{entry.description}</td>
                        <td className="px-6 py-4 text-right">{entry.debit > 0 ? formatCurrency(entry.debit) : '-'}</td>
                        <td className="px-6 py-4 text-right">{entry.credit > 0 ? formatCurrency(entry.credit) : '-'}</td>
                        <td className="px-6 py-4 text-right font-medium">{formatCurrency(entry.balance)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-text-muted">Memuat data buku besar...</div>
        )}
      </div>
    </div>
  )
}
