import { useState, useEffect } from 'react'
import { defaultEngine } from '@/lib/accounting'
import type { TrialBalanceItem } from '@/lib/accounting'
import { CheckCircle2, AlertCircle } from 'lucide-react'

export default function TrialBalanceView() {
  const [items, setItems] = useState<TrialBalanceItem[]>([])
  const [isBalanced, setIsBalanced] = useState(false)

  useEffect(() => {
    const data = defaultEngine.getTrialBalance()
    setItems(data)
    setIsBalanced(defaultEngine.trialBalance.verifyEquality(data))
  }, [])

  const formatCurrency = (val: number) => {
    if (val === 0) return '-'
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val)
  }

  const totalDebit = items.reduce((sum, item) => sum + item.debit, 0)
  const totalCredit = items.reduce((sum, item) => sum + item.credit, 0)

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Neraca Saldo</h1>
          <p className="text-text-secondary mt-1">Daftar seluruh saldo akhir akun untuk memastikan total Debit dan Kredit seimbang.</p>
        </div>
      </div>

      <div className="card-container p-0 overflow-hidden">
        {/* Status Bar */}
        <div className={`p-4 border-b flex items-center ${isBalanced ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
          {isBalanced ? (
            <>
              <CheckCircle2 className="w-5 h-5 text-emerald-600 mr-2" />
              <span className="text-emerald-800 font-medium">Buku Kas Seimbang (Balanced)</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
              <span className="text-red-800 font-medium">Peringatan: Terdapat selisih antara Debit dan Kredit!</span>
            </>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#F3F4F6] border-b border-border text-gray-600">
              <tr>
                <th className="px-6 py-3 font-semibold whitespace-nowrap">No. Akun</th>
                <th className="px-6 py-3 font-semibold whitespace-nowrap w-full">Nama Akun</th>
                <th className="px-6 py-3 font-semibold text-right">Debit</th>
                <th className="px-6 py-3 font-semibold text-right">Kredit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-gray-700 bg-white">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-text-muted">Belum ada data di neraca saldo.</td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.accountNumber} className="hover:bg-gray-50">
                    <td className="px-6 py-3 font-medium">{item.accountNumber}</td>
                    <td className="px-6 py-3">{item.accountName}</td>
                    <td className="px-6 py-3 text-right">{formatCurrency(item.debit)}</td>
                    <td className="px-6 py-3 text-right">{formatCurrency(item.credit)}</td>
                  </tr>
                ))
              )}
            </tbody>
            {/* Table Footer for Totals */}
            <tfoot className="bg-gray-50 border-t-2 border-gray-200">
              <tr>
                <th colSpan={2} className="px-6 py-4 text-right font-bold text-gray-900">Total Keseluruhan:</th>
                <th className="px-6 py-4 text-right font-bold text-gray-900 double-underline">{formatCurrency(totalDebit)}</th>
                <th className="px-6 py-4 text-right font-bold text-gray-900 double-underline">{formatCurrency(totalCredit)}</th>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}
