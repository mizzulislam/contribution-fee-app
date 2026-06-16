import { useMemo } from 'react'
import { buildPeriodAccountingEngine, getPeriodLabel, type PeriodFilter } from '@/lib/accounting/period'
import AccountingDownloadMenu from '@/components/accounting/AccountingDownloadMenu'
import type { FinancialStatements } from '@/lib/accounting'

interface FinancialStatementsViewProps {
  period: PeriodFilter
}

export default function FinancialStatementsView({ period }: FinancialStatementsViewProps) {
  const periodEngine = useMemo(() => buildPeriodAccountingEngine(period), [period])
  const statements = useMemo<FinancialStatements>(() => periodEngine.getFinancialStatements(), [periodEngine])


  const formatCurrency = (amount: number) => {
    return (
      <span className="inline-flex justify-between items-center min-w-[120px]">
        <span className="text-gray-500 mr-2">Rp</span>
        <span>{new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(amount)}</span>
      </span>
    )
  }

  const inc = statements.incomeStatement
  const bal = statements.balanceSheet
  const periodLabel = getPeriodLabel(period)
  const formatAmountText = (amount: number) => `Rp ${new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(amount)}`
  const statementsExportRows = [
    ['Laporan Laba Rugi', 'Total Pendapatan', formatAmountText(inc.revenues)],
    ['Laporan Laba Rugi', 'Total Beban', formatAmountText(inc.expenses)],
    ['Laporan Laba Rugi', 'Laba Bersih', formatAmountText(inc.netIncome)],
    ['Neraca', 'Aset Lancar', formatAmountText(bal.assets.currentAssets)],
    ['Neraca', 'Aset Tetap', formatAmountText(bal.assets.propertyPlantEquipment)],
    ['Neraca', 'Total Aset', formatAmountText(bal.assets.totalAssets)],
    ['Neraca', 'Kewajiban Jangka Pendek', formatAmountText(bal.liabilities.currentLiabilities)],
    ['Neraca', 'Total Kewajiban', formatAmountText(bal.liabilities.totalLiabilities)],
    ['Neraca', 'Total Modal & Laba Ditahan', formatAmountText(bal.equity.totalEquity)],
    ['Neraca', 'Total Ekuitas', formatAmountText(bal.equity.totalEquity)],
    ['Neraca', 'Total Kewajiban & Modal', formatAmountText(bal.totalLiabilitiesAndEquity)],
  ]

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Laporan Keuangan</h1>
          <p className="text-text-secondary mt-1">Laporan Laba/Rugi dan Neraca (Balance Sheet) standar IFRS.</p>
        </div>
        <AccountingDownloadMenu
          fileName={`laporan-keuangan-${periodLabel.toLowerCase().replace(/[^a-z0-9]+/gi, '-').replace(/(^-|-$)/g, '') || 'semua-periode'}`}
          title="Laporan Keuangan"
          meta={`Periode: ${periodLabel} | Dicetak: ${new Date().toLocaleString('id-ID')}`}
          headers={['Laporan', 'Pos', 'Nilai']}
          rows={statementsExportRows}
          amountColumnIndexes={[2]}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Income Statement */}
        <div className="card-container">
          <div className="text-center mb-6 border-b pb-4">
            <h2 className="text-xl font-bold text-gray-900 uppercase">Laporan Laba Rugi</h2>
            <p className="text-sm text-gray-500">Periode Berjalan</p>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b">
              <span className="font-medium text-gray-700">Total Pendapatan (Revenues)</span>
              <span className="font-semibold">{formatCurrency(inc.revenues)}</span>
            </div>
            
            <div className="flex justify-between py-2 border-b">
              <span className="font-medium text-gray-700">Total Beban (Expenses)</span>
              <span className="font-semibold text-red-600">({formatCurrency(inc.expenses)})</span>
            </div>

            <div className="flex justify-between py-4 mt-4 bg-blue-50 px-3 -mx-3 rounded-lg border border-blue-100">
              <span className="font-bold text-blue-900">Laba Bersih (Net Income)</span>
              <span className="font-bold text-blue-900">{formatCurrency(inc.netIncome)}</span>
            </div>
          </div>
        </div>

        {/* Balance Sheet */}
        <div className="card-container">
          <div className="text-center mb-6 border-b pb-4">
            <h2 className="text-xl font-bold text-gray-900 uppercase">Neraca (Balance Sheet)</h2>
            <p className="text-sm text-gray-500">Posisi Keuangan Saat Ini</p>
          </div>

          <div className="space-y-6 text-sm">
            {/* Assets */}
            <div>
              <h3 className="font-bold text-emerald-800 bg-emerald-50 px-2 py-1 mb-2 rounded">ASET (HARTA)</h3>
              <div className="space-y-1 pl-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Aset Lancar (Kas, Piutang)</span>
                  <span>{formatCurrency(bal.assets.currentAssets)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Aset Tetap (Peralatan)</span>
                  <span>{formatCurrency(bal.assets.propertyPlantEquipment)}</span>
                </div>
                <div className="flex justify-between font-semibold pt-2 border-t mt-2">
                  <span>Total Aset</span>
                  <span>{formatCurrency(bal.assets.totalAssets)}</span>
                </div>
              </div>
            </div>

            {/* Liabilities */}
            <div>
              <h3 className="font-bold text-orange-800 bg-orange-50 px-2 py-1 mb-2 rounded">KEWAJIBAN (HUTANG)</h3>
              <div className="space-y-1 pl-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Kewajiban Jangka Pendek</span>
                  <span>{formatCurrency(bal.liabilities.currentLiabilities)}</span>
                </div>
                <div className="flex justify-between font-semibold pt-2 border-t mt-2">
                  <span>Total Kewajiban</span>
                  <span>{formatCurrency(bal.liabilities.totalLiabilities)}</span>
                </div>
              </div>
            </div>

            {/* Equity */}
            <div>
              <h3 className="font-bold text-purple-800 bg-purple-50 px-2 py-1 mb-2 rounded">MODAL (EKUITAS)</h3>
              <div className="space-y-1 pl-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Modal & Laba Ditahan</span>
                  <span>{formatCurrency(bal.equity.totalEquity)}</span>
                </div>
                <div className="flex justify-between font-semibold pt-2 border-t mt-2">
                  <span>Total Ekuitas</span>
                  <span>{formatCurrency(bal.equity.totalEquity)}</span>
                </div>
              </div>
            </div>

            {/* Final Check */}
            <div className="flex justify-between py-4 mt-4 bg-gray-900 text-white px-3 -mx-3 rounded-lg">
              <span className="font-bold">Total Kewajiban & Modal</span>
              <span className="font-bold">{formatCurrency(bal.totalLiabilitiesAndEquity)}</span>
            </div>
            
            {bal.assets.totalAssets === bal.totalLiabilitiesAndEquity ? (
              <p className="text-xs text-center text-emerald-600 font-medium">Neraca Seimbang (Balanced) ✓</p>
            ) : (
              <p className="text-xs text-center text-red-600 font-medium">Peringatan: Neraca Tidak Seimbang ✗</p>
            )}

          </div>
        </div>

      </div>
    </div>
  )
}
