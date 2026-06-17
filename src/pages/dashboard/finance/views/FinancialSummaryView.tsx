import { useEffect, useState } from 'react'
import { defaultEngine } from '@/lib/accounting'
import type { FinancialStatements } from '@/lib/accounting'
import { ArrowUpRight, ArrowDownRight, Building2, Landmark, Wallet, Loader2 } from 'lucide-react'

export default function FinancialSummaryView() {
  const [statements, setStatements] = useState<FinancialStatements | null>(null)

  useEffect(() => {
    // In a real app, this might be an API call that returns the generated statements
    setStatements(defaultEngine.getFinancialStatements())
  }, [])

  if (!statements) return (
    <div className="flex flex-col items-center justify-center py-20 text-gray-500">
      <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
      <span className="text-lg font-medium">Memuat data keuangan...</span>
    </div>
  )

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center">
            <Wallet className="mr-3 text-primary w-8 h-8" />
            Dashboard Keuangan
          </h1>
          <p className="text-text-secondary mt-1">Ringkasan posisi keuangan dan laba rugi berjalan (Real-time IFRS).</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Assets */}
        <div className="rounded-[20px] bg-gradient-to-br from-[#10B981] to-[#047857] p-6 shadow-md text-white flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <h3 className="text-emerald-100 text-sm font-medium">Total Aset (Harta)</h3>
            <Landmark className="w-6 h-6 text-emerald-200" />
          </div>
          <p className="text-3xl font-bold mt-4">{formatCurrency(statements.balanceSheet.assets.totalAssets)}</p>
          <div className="mt-2 text-xs text-emerald-200 flex items-center">
            <Wallet className="w-3 h-3 mr-1" /> Kas Lancar: {formatCurrency(statements.balanceSheet.assets.currentAssets)}
          </div>
        </div>

        {/* Net Income */}
        <div className="card-container flex flex-col justify-between border-l-4 border-l-blue-500">
          <div className="flex justify-between items-start">
            <h3 className="text-text-secondary text-sm font-medium">Laba Bersih (Net Income)</h3>
            <ArrowUpRight className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <p className="text-3xl font-bold mt-4 text-gray-900">{formatCurrency(statements.incomeStatement.netIncome)}</p>
            <p className="text-xs text-text-muted mt-1">Pendapatan - Beban Operasional</p>
          </div>
        </div>

        {/* Total Liabilities & Equity */}
        <div className="card-container flex flex-col justify-between border-l-4 border-l-orange-500">
          <div className="flex justify-between items-start">
            <h3 className="text-text-secondary text-sm font-medium">Kewajiban & Ekuitas</h3>
            <Building2 className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <p className="text-3xl font-bold mt-4 text-gray-900">{formatCurrency(statements.balanceSheet.totalLiabilitiesAndEquity)}</p>
            <p className="text-xs text-text-muted mt-1">
              Hutang: {formatCurrency(statements.balanceSheet.liabilities.totalLiabilities)} | Modal: {formatCurrency(statements.balanceSheet.equity.totalEquity)}
            </p>
          </div>
        </div>
      </div>

      <div className="card-container p-6 bg-blue-50 border border-blue-100">
        <h3 className="font-semibold text-blue-900 mb-2">Persamaan Dasar Akuntansi (Aset = Kewajiban + Modal)</h3>
        <p className="text-sm text-blue-800">
          Sistem pembukuan ganda ini menjamin bahwa Total Aset ({formatCurrency(statements.balanceSheet.assets.totalAssets)}) selalu sama dengan Total Kewajiban & Modal ({formatCurrency(statements.balanceSheet.totalLiabilitiesAndEquity)}).
        </p>
      </div>
    </div>
  )
}
