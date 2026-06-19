import { useMemo, useState } from 'react'
import { buildPeriodAccountingEngine, getPeriodLabel, type PeriodFilter } from '@/features/accounting/calculations/period'
import AccountingDownloadMenu from '@/features/accounting/components/AccountingDownloadMenu'
import type { FinancialStatements } from '@/features/accounting'
import { Scale, LayoutGrid, BookOpen } from 'lucide-react'

interface FinancialStatementsViewProps {
  period: PeriodFilter
}

export default function FinancialStatementsView({ period }: FinancialStatementsViewProps) {
  const periodEngine = useMemo(() => buildPeriodAccountingEngine(period), [period])
  const statements = useMemo<FinancialStatements>(() => periodEngine.getFinancialStatements(), [periodEngine])
  const items = useMemo(() => periodEngine.getTrialBalance(), [periodEngine])

  const [layoutMode, setLayoutMode] = useState<'grid' | 'single'>('grid')
  const [activeCardIndex, setActiveCardIndex] = useState<number>(0)

  // Helper to format currency values with standard accounting brackets for negative amounts (in black/gray format)
  const formatCurrency = (amount: number, forceNegativeStyle = false, colorClass = '') => {
    const isNegative = amount < 0 || forceNegativeStyle
    const absVal = Math.abs(amount)
    const formatted = new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(absVal)
    
    if (isNegative) {
      return (
        <span className={`inline-flex justify-between items-center w-[130px] flex-shrink-0 pl-4 ${colorClass || 'text-gray-900'} font-semibold`}>
          <span className="text-gray-400 font-normal mr-1">(Rp</span>
          <span>
            {formatted}
            <span className="text-gray-400 font-normal">)</span>
          </span>
        </span>
      )
    }

    return (
      <span className={`inline-flex justify-between items-center w-[130px] flex-shrink-0 pl-4 ${colorClass || 'text-gray-900'} font-semibold`}>
        <span className="text-gray-400 font-normal mr-2">Rp</span>
        <span>{formatted}</span>
      </span>
    )
  }

  // Helper to format text values for exports
  const formatAmountText = (amount: number) => `Rp ${new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(amount)}`

  // Classify Trial Balance accounts dynamically
  const classifiedAccounts = useMemo(() => {
    const revenueAccounts: { accountNumber: string; accountName: string; balance: number }[] = []
    const expenseAccounts: { accountNumber: string; accountName: string; balance: number }[] = []
    const currentAssetAccounts: { accountNumber: string; accountName: string; balance: number }[] = []
    const fixedAssetAccounts: { accountNumber: string; accountName: string; balance: number }[] = []
    const currentLiabilityAccounts: { accountNumber: string; accountName: string; balance: number }[] = []
    const equityAccounts: { accountNumber: string; accountName: string; balance: number }[] = []

    items.forEach(item => {
      const account = periodEngine.coa.getAccount(item.accountNumber)
      if (!account) return
      
      const normalBalance = account.normalBalance
      const balance = normalBalance === 'Debit' ? item.debit - item.credit : item.credit - item.debit
      
      if (balance === 0) return

      const num = parseInt(item.accountNumber, 10)
      const type = account.accountType

      if (type === 'Revenues') {
        revenueAccounts.push({ accountNumber: item.accountNumber, accountName: item.accountName, balance })
      } else if (type === 'Expenses') {
        expenseAccounts.push({ accountNumber: item.accountNumber, accountName: item.accountName, balance })
      } else if (type === 'Assets') {
        if (num >= 1000 && num < 1500) {
          currentAssetAccounts.push({ accountNumber: item.accountNumber, accountName: item.accountName, balance })
        } else if (num >= 1500 && num < 1900) {
          fixedAssetAccounts.push({ accountNumber: item.accountNumber, accountName: item.accountName, balance })
        }
      } else if (type === 'Liabilities') {
        if (num >= 2000 && num < 2500) {
          currentLiabilityAccounts.push({ accountNumber: item.accountNumber, accountName: item.accountName, balance })
        }
      } else if (type === 'Equity') {
        equityAccounts.push({ accountNumber: item.accountNumber, accountName: item.accountName, balance })
      }
    })

    return {
      revenueAccounts,
      expenseAccounts,
      currentAssetAccounts,
      fixedAssetAccounts,
      currentLiabilityAccounts,
      equityAccounts
    }
  }, [items, periodEngine])

  const inc = statements.incomeStatement
  const bal = statements.balanceSheet
  const cash = statements.cashFlowStatement
  const periodLabel = getPeriodLabel(period)

  // Modal Pemilik balance (excluding closing adjustments if not locked/closed)
  const modalPemilikBalance = useMemo(() => {
    const modalAcc = classifiedAccounts.equityAccounts.find(acc => acc.accountNumber === '3101' || acc.accountNumber === '311')
    return modalAcc ? modalAcc.balance : (bal.equity.totalEquity - statements.retainedEarningsStatement.endingRetainedEarnings)
  }, [classifiedAccounts.equityAccounts, bal.equity, statements.retainedEarningsStatement])

  const statementsExportRows = useMemo(() => {
    const rows: (string | number)[][] = []
    
    // Income Statement Export
    rows.push(['Laporan Laba Rugi', 'PENDAPATAN', ''])
    classifiedAccounts.revenueAccounts.forEach(acc => {
      rows.push(['Laporan Laba Rugi', `  ${acc.accountName}`, formatAmountText(acc.balance)])
    })
    rows.push(['Laporan Laba Rugi', 'Total Pendapatan', formatAmountText(inc.revenues)])
    
    rows.push(['Laporan Laba Rugi', 'BEBAN', ''])
    classifiedAccounts.expenseAccounts.forEach(acc => {
      rows.push(['Laporan Laba Rugi', `  ${acc.accountName}`, `(${formatAmountText(acc.balance)})`])
    })
    rows.push(['Laporan Laba Rugi', 'Total Beban', `(${formatAmountText(inc.expenses)})`])
    rows.push(['Laporan Laba Rugi', 'Laba Bersih (Net Income)', formatAmountText(inc.netIncome)])
    
    // Retained Earnings Statement Export
    rows.push(['Laporan Perubahan Ekuitas', 'Laba Ditahan Awal', formatAmountText(statements.retainedEarningsStatement.beginningRetainedEarnings)])
    rows.push(['Laporan Perubahan Ekuitas', 'Ditambah: Laba Bersih', formatAmountText(statements.retainedEarningsStatement.netIncome)])
    rows.push(['Laporan Perubahan Ekuitas', 'Dikurangi: Prive Pemilik (Dividen)', `(${formatAmountText(statements.retainedEarningsStatement.dividends)})`])
    rows.push(['Laporan Perubahan Ekuitas', 'Laba Ditahan Akhir', formatAmountText(statements.retainedEarningsStatement.endingRetainedEarnings)])
    
    // Balance Sheet Export
    rows.push(['Neraca', 'ASET LANCAR', ''])
    classifiedAccounts.currentAssetAccounts.forEach(acc => {
      rows.push(['Neraca', `  ${acc.accountName}`, formatAmountText(acc.balance)])
    })
    rows.push(['Neraca', 'Total Aset Lancar', formatAmountText(bal.assets.currentAssets)])
    
    rows.push(['Neraca', 'ASET TETAP', ''])
    classifiedAccounts.fixedAssetAccounts.forEach(acc => {
      const isNegative = acc.balance < 0
      rows.push([
        'Neraca', 
        `  ${acc.accountName}`, 
        isNegative ? `(${formatAmountText(Math.abs(acc.balance))})` : formatAmountText(acc.balance)
      ])
    })
    rows.push(['Neraca', 'Total Aset Tetap', formatAmountText(bal.assets.propertyPlantEquipment)])
    rows.push(['Neraca', 'TOTAL ASET', formatAmountText(bal.assets.totalAssets)])
    
    rows.push(['Neraca', 'KEWAJIBAN', ''])
    classifiedAccounts.currentLiabilityAccounts.forEach(acc => {
      rows.push(['Neraca', `  ${acc.accountName}`, formatAmountText(acc.balance)])
    })
    rows.push(['Neraca', 'Total Kewajiban', formatAmountText(bal.liabilities.totalLiabilities)])
    
    rows.push(['Neraca', 'EKUITAS', ''])
    rows.push(['Neraca', '  Modal Pemilik', formatAmountText(modalPemilikBalance)])
    rows.push(['Neraca', '  Laba Ditahan Akhir', formatAmountText(statements.retainedEarningsStatement.endingRetainedEarnings)])
    rows.push(['Neraca', 'Total Ekuitas', formatAmountText(bal.equity.totalEquity)])
    rows.push(['Neraca', 'TOTAL KEWAJIBAN & EKUITAS', formatAmountText(bal.totalLiabilitiesAndEquity)])

    // Cash Flow Statement Export
    rows.push(['Laporan Arus Kas', 'Kas Bersih dari Aktivitas Operasi', formatAmountText(cash.operatingActivities)])
    rows.push(['Laporan Arus Kas', 'Kas Bersih dari Aktivitas Investasi', formatAmountText(cash.investingActivities)])
    rows.push(['Laporan Arus Kas', 'Kas Bersih dari Aktivitas Pendanaan', formatAmountText(cash.financingActivities)])
    rows.push(['Laporan Arus Kas', 'Kenaikan/Penurunan Bersih Kas', formatAmountText(cash.netCashFlow)])
    rows.push(['Laporan Arus Kas', 'Saldo Kas Awal', formatAmountText(cash.beginningCashBalance)])
    rows.push(['Laporan Arus Kas', 'Saldo Kas Akhir', formatAmountText(cash.endingCashBalance)])
    
    return rows
  }, [classifiedAccounts, inc, statements, bal, cash, modalPemilikBalance])

  const incomeStatementCard = (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between min-h-[560px] w-full">
      <div>
        <div className="border-b border-gray-100 pb-4 mb-5">
          <span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">Laporan Operasional</span>
          <h2 className="text-xl font-bold text-gray-900 mt-0.5">Laporan Laba Rugi</h2>
          <p className="text-xs text-gray-500 mt-1">Mengukur kinerja keuangan operasional kos</p>
        </div>

        <div className="space-y-5">
          {/* Pendapatan Section */}
          <div>
            <div className="text-gray-900 font-bold text-xs uppercase tracking-wider mb-2.5 pl-1">
              Pendapatan (Revenues)
            </div>
            
            <div className="space-y-1.5">
              {classifiedAccounts.revenueAccounts.length === 0 ? (
                <p className="text-xs text-gray-400 italic py-1.5 pl-1">Tidak ada pendapatan tercatat</p>
              ) : (
                classifiedAccounts.revenueAccounts.map(acc => (
                  <div key={acc.accountNumber} className="flex justify-between items-center py-1.5 pl-1 border-b border-gray-50 text-xs hover:bg-gray-50/50">
                    <span className="text-gray-600 font-medium">{acc.accountName}</span>
                    {formatCurrency(acc.balance)}
                  </div>
                ))
              )}
              <div className="flex justify-between items-center py-2 pl-1 text-xs font-bold text-gray-800 border-t border-gray-200 mt-2">
                <span>Total Pendapatan</span>
                <span>{formatCurrency(inc.revenues)}</span>
              </div>
            </div>
          </div>

          {/* Beban Section */}
          <div>
            <div className="text-gray-900 font-bold text-xs uppercase tracking-wider mb-2.5 pl-1">
              Beban Operasional (Expenses)
            </div>
            
            <div className="space-y-1.5">
              {classifiedAccounts.expenseAccounts.length === 0 ? (
                <p className="text-xs text-gray-400 italic py-1.5 pl-1">Tidak ada beban tercatat</p>
              ) : (
                classifiedAccounts.expenseAccounts.map(acc => (
                  <div key={acc.accountNumber} className="flex justify-between items-center py-1.5 pl-1 border-b border-gray-50 text-xs hover:bg-gray-50/50">
                    <span className="text-gray-600 font-medium">{acc.accountName}</span>
                    {formatCurrency(acc.balance, true)}
                  </div>
                ))
              )}
              <div className="flex justify-between items-center py-2 pl-1 text-xs font-bold text-gray-800 border-t border-gray-200 mt-2">
                <span>Total Beban</span>
                <span>{formatCurrency(inc.expenses, true)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-between items-center py-2.5 pl-1 border-t border-b-2 border-gray-200 text-gray-900">
        <span className="font-bold text-xs uppercase tracking-wide">
          {inc.netIncome >= 0 ? 'Laba Bersih (Net Income)' : 'Rugi Bersih (Net Loss)'}
        </span>
        <span>
          {formatCurrency(inc.netIncome, false, 'text-xs font-bold text-gray-900')}
        </span>
      </div>
    </div>
  )

  const retainedEarningsCard = (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between min-h-[560px] w-full">
      <div>
        <div className="border-b border-gray-100 pb-4 mb-5">
          <span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">Ekuitas Mutasi</span>
          <h2 className="text-xl font-bold text-gray-900 mt-0.5">Perubahan Ekuitas</h2>
          <p className="text-xs text-gray-500 mt-1">Mutasi laba ditahan selama periode berjalan</p>
        </div>

        <div className="space-y-4">
          <div className="text-gray-900 font-bold text-xs uppercase tracking-wider mb-3 pl-1">
            Laba Ditahan (Retained Earnings)
          </div>

          <div className="space-y-3.5">
            <div className="flex justify-between items-center py-1.5 pl-1 border-b border-gray-100 text-xs hover:bg-gray-50/50">
              <span className="text-gray-600 font-medium">Saldo Laba Ditahan Awal</span>
              {formatCurrency(statements.retainedEarningsStatement.beginningRetainedEarnings)}
            </div>
            
            <div className="flex justify-between items-center py-1.5 pl-1 border-b border-gray-100 text-xs hover:bg-gray-50/50">
              <span className="text-gray-600 font-medium">Ditambah: Laba Bersih Periode Ini</span>
              <span>
                {formatCurrency(statements.retainedEarningsStatement.netIncome, false, 'text-xs font-bold text-gray-900')}
              </span>
            </div>

            <div className="flex justify-between items-center py-1.5 pl-1 border-b border-gray-100 text-xs hover:bg-gray-50/50">
              <span className="text-gray-600 font-medium">Dikurangi: Prive Pemilik (Dividen)</span>
              {formatCurrency(statements.retainedEarningsStatement.dividends, true)}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-between items-center py-2.5 pl-1 border-t border-b-2 border-gray-200 text-gray-900">
        <span className="font-bold text-xs uppercase tracking-wide">Laba Ditahan Akhir</span>
        <span>
          {formatCurrency(statements.retainedEarningsStatement.endingRetainedEarnings, false, 'text-xs font-bold text-gray-900')}
        </span>
      </div>
    </div>
  )

  const balanceSheetCard = (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between min-h-[560px] w-full">
      <div>
        <div className="border-b border-gray-100 pb-4 mb-5 flex justify-between items-start">
          <div>
            <span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">Posisi Keuangan</span>
            <h2 className="text-xl font-bold text-gray-900 mt-0.5">Neraca (Balance Sheet)</h2>
            <p className="text-xs text-gray-500 mt-1">Ringkasan aset, kewajiban, dan ekuitas kos</p>
          </div>
          <div className="mt-1">
            <Scale className="w-5 h-5 text-gray-500" />
          </div>
        </div>

        <div className="space-y-5 text-xs">
          {/* Assets Section */}
          <div>
            <div className="text-gray-900 font-bold text-xs uppercase tracking-wider mb-2.5 pl-1">
              ASET (HARTA)
            </div>
            
            {/* Current Assets */}
            <div className="pl-1 space-y-1.5 mb-3">
              <span className="text-xs font-bold text-gray-700 tracking-wide uppercase pl-1">Aset Lancar</span>
              {classifiedAccounts.currentAssetAccounts.length === 0 ? (
                <p className="text-xs text-gray-400 italic pl-1">Tidak ada aset lancar</p>
              ) : (
                classifiedAccounts.currentAssetAccounts.map(acc => (
                  <div key={acc.accountNumber} className="flex justify-between items-center py-1 pl-1 border-b border-gray-50 text-xs hover:bg-gray-50/50">
                    <span className="text-gray-600 font-medium">{acc.accountName}</span>
                    {formatCurrency(acc.balance)}
                  </div>
                ))
              )}
              <div className="flex justify-between items-center py-2 pl-1 font-bold text-gray-800 border-t border-gray-200 mt-2 text-xs">
                <span>Total Aset Lancar</span>
                <span>{formatCurrency(bal.assets.currentAssets)}</span>
              </div>
            </div>

            {/* Fixed Assets */}
            <div className="pl-1 space-y-1.5">
              <span className="text-xs font-bold text-gray-700 tracking-wide uppercase pl-1">Aset Tetap</span>
              {classifiedAccounts.fixedAssetAccounts.length === 0 ? (
                <p className="text-xs text-gray-400 italic pl-1">Tidak ada aset tetap</p>
              ) : (
                classifiedAccounts.fixedAssetAccounts.map(acc => {
                  const isContra = acc.balance < 0 || acc.accountNumber === '1502'
                  return (
                    <div key={acc.accountNumber} className="flex justify-between items-center py-1 pl-1 border-b border-gray-50 text-xs hover:bg-gray-50/50">
                      <span className="text-gray-600 font-medium">{acc.accountName}</span>
                      {formatCurrency(acc.balance, isContra)}
                    </div>
                  )
                })
              )}
              <div className="flex justify-between items-center py-2 pl-1 font-bold text-gray-800 border-t border-gray-200 mt-2 text-xs">
                <span>Total Aset Tetap (Net)</span>
                <span>{formatCurrency(bal.assets.propertyPlantEquipment)}</span>
              </div>
            </div>

            {/* Total Assets Summary */}
            <div className="flex justify-between items-center py-2.5 pl-1 border-t border-b border-gray-200 text-gray-900 font-bold mt-4 text-xs">
              <span className="uppercase tracking-wide font-bold">TOTAL ASET</span>
              <span>{formatCurrency(bal.assets.totalAssets, false, 'text-xs font-bold text-gray-900')}</span>
            </div>
          </div>

          {/* Liabilities Section */}
          <div>
            <div className="text-gray-900 font-bold text-xs uppercase tracking-wider mb-2.5 pl-1">
              KEWAJIBAN (HUTANG)
            </div>
            <div className="pl-1 space-y-1.5">
              {classifiedAccounts.currentLiabilityAccounts.length === 0 ? (
                <p className="text-xs text-gray-400 italic pl-1">Tidak ada kewajiban berjalan</p>
              ) : (
                classifiedAccounts.currentLiabilityAccounts.map(acc => (
                  <div key={acc.accountNumber} className="flex justify-between items-center py-1 pl-1 border-b border-gray-50 text-xs hover:bg-gray-50/50">
                    <span className="text-gray-600 font-medium">{acc.accountName}</span>
                    {formatCurrency(acc.balance)}
                  </div>
                ))
              )}
              <div className="flex justify-between items-center py-2 pl-1 font-bold text-gray-800 border-t border-gray-200 mt-2 text-xs">
                <span>Total Kewajiban</span>
                <span>{formatCurrency(bal.liabilities.totalLiabilities)}</span>
              </div>
            </div>
          </div>

          {/* Equity Section */}
          <div>
            <div className="text-gray-900 font-bold text-xs uppercase tracking-wider mb-2.5 pl-1">
              MODAL (EKUITAS)
            </div>
            <div className="pl-1 space-y-1.5">
              <div className="flex justify-between items-center py-1 pl-1 border-b border-gray-50 text-xs hover:bg-gray-50/50">
                <span className="text-gray-600 font-medium">Modal Pemilik</span>
                {formatCurrency(modalPemilikBalance)}
              </div>
              <div className="flex justify-between items-center py-1 pl-1 border-b border-gray-50 text-xs hover:bg-gray-50/50">
                <span className="text-gray-600 font-medium">Laba Ditahan Akhir</span>
                {formatCurrency(statements.retainedEarningsStatement.endingRetainedEarnings)}
              </div>
              <div className="flex justify-between items-center py-2 pl-1 font-bold text-gray-800 border-t border-gray-200 mt-2 text-xs">
                <span>Total Ekuitas</span>
                <span>{formatCurrency(bal.equity.totalEquity)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-between items-center py-2.5 pl-1 border-t border-b-2 border-gray-200 text-gray-900 font-bold text-xs">
        <span className="uppercase tracking-wide font-bold">Total Kewajiban & Modal</span>
        <span>{formatCurrency(bal.totalLiabilitiesAndEquity, false, 'text-xs font-bold text-gray-900')}</span>
      </div>
    </div>
  )

  const cashFlowCard = (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between min-h-[560px] w-full">
      <div>
        <div className="border-b border-gray-100 pb-4 mb-5">
          <span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">Pergerakan Kas</span>
          <h2 className="text-xl font-bold text-gray-900 mt-0.5">Laporan Arus Kas</h2>
          <p className="text-xs text-gray-500 mt-1">Ringkasan kas masuk dan keluar berdasarkan aktivitas</p>
        </div>

        <div className="space-y-3.5 text-xs">
          <div className="flex min-w-0 items-center gap-2 py-2 pl-1 border-b border-gray-100 hover:bg-gray-50/50">
            <span className="min-w-0 flex-1 text-gray-600 font-medium">Kas Bersih dari Aktivitas Operasi</span>
            {formatCurrency(cash.operatingActivities, cash.operatingActivities < 0)}
          </div>
          <div className="flex min-w-0 items-center gap-2 py-2 pl-1 border-b border-gray-100 hover:bg-gray-50/50">
            <span className="min-w-0 flex-1 text-gray-600 font-medium">Kas Bersih dari Aktivitas Investasi</span>
            {formatCurrency(cash.investingActivities, cash.investingActivities < 0)}
          </div>
          <div className="flex min-w-0 items-center gap-2 py-2 pl-1 border-b border-gray-100 hover:bg-gray-50/50">
            <span className="min-w-0 flex-1 text-gray-600 font-medium">Kas Bersih dari Aktivitas Pendanaan</span>
            {formatCurrency(cash.financingActivities, cash.financingActivities < 0)}
          </div>
          <div className="flex min-w-0 items-center gap-3 py-2.5 pl-1 border-t border-gray-200 text-gray-900 font-bold">
            <span className="min-w-0 flex-1 uppercase tracking-wide leading-snug">
              Kenaikan/<br />Penurunan<br />Bersih Kas
            </span>
            {formatCurrency(cash.netCashFlow, cash.netCashFlow < 0, 'text-xs font-bold text-gray-900')}
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-2 border-t border-gray-200 pt-4 text-xs">
        <div className="flex min-w-0 items-center gap-2 py-1.5 pl-1">
          <span className="min-w-0 flex-1 font-medium text-gray-600">Saldo Kas Awal</span>
          {formatCurrency(cash.beginningCashBalance, cash.beginningCashBalance < 0)}
        </div>
        <div className="flex min-w-0 items-center gap-2 py-2.5 pl-1 border-t border-b-2 border-gray-200 text-gray-900">
          <span className="min-w-0 flex-1 font-bold uppercase tracking-wide">Saldo Kas Akhir</span>
          {formatCurrency(cash.endingCashBalance, cash.endingCashBalance < 0, 'text-xs font-bold text-gray-900')}
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight flex items-center">
            <Scale className="mr-2 sm:mr-3 text-primary w-6 h-6 sm:w-8 sm:h-8" />
            Laporan Keuangan
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">Laporan Laba/Rugi, Perubahan Ekuitas, Neraca, dan Arus Kas.</p>
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

      <div className="bg-gray-50/50 border border-gray-200 rounded-3xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-gray-200/60 pb-5">
          <div className="flex items-center gap-3">
            {layoutMode === 'single' ? (
              <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
                {/* Sleek Segment Selector */}
                <div className="flex items-center gap-1 px-1">
                  {[
                    { label: 'Laba Rugi', index: 0 },
                    { label: 'Perubahan Ekuitas', index: 1 },
                    { label: 'Neraca', index: 2 },
                    { label: 'Arus Kas', index: 3 }
                  ].map((tab) => (
                    <button
                      key={tab.index}
                      onClick={() => setActiveCardIndex(tab.index)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                        activeCardIndex === tab.index
                          ? 'bg-gray-900 text-white shadow-sm'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <span className="text-sm font-semibold text-gray-600 pl-1">
                Menampilkan Semua Laporan (4 Dokumen)
              </span>
            )}
          </div>

          {/* Toggle Layout Mode */}
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1 shadow-sm self-end md:self-auto">
            <button
              onClick={() => setLayoutMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                layoutMode === 'grid'
                  ? 'bg-gray-900 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Semua Laporan</span>
            </button>
            <button
              onClick={() => setLayoutMode('single')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                layoutMode === 'single'
                  ? 'bg-gray-900 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Satu Halaman</span>
            </button>
          </div>
        </div>

        {/* Content area */}
        {layoutMode === 'grid' ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-4 gap-8 items-start">
            {incomeStatementCard}
            {retainedEarningsCard}
            {balanceSheetCard}
            {cashFlowCard}
          </div>
        ) : (
          <div className="w-full">
            {/* Render selected card full-width */}
            <div className="w-full transition-all duration-300">
              {activeCardIndex === 0 && incomeStatementCard}
              {activeCardIndex === 1 && retainedEarningsCard}
              {activeCardIndex === 2 && balanceSheetCard}
              {activeCardIndex === 3 && cashFlowCard}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
