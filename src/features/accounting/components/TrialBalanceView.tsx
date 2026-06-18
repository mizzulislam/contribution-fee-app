import { useMemo } from 'react'
import type { TrialBalanceItem } from '@/features/accounting'
import { buildPeriodAccountingEngine, getPeriodLabel, type PeriodFilter } from '@/features/accounting/calculations/period'
import AccountingDownloadMenu from '@/features/accounting/components/AccountingDownloadMenu'
import { CheckCircle2, AlertCircle, Scale } from 'lucide-react'

interface TrialBalanceViewProps {
  period: PeriodFilter
}

export default function TrialBalanceView({ period }: TrialBalanceViewProps) {
  const periodEngine = useMemo(() => buildPeriodAccountingEngine(period), [period])
  const items = useMemo<TrialBalanceItem[]>(() => periodEngine.getTrialBalance(), [periodEngine])
  const isBalanced = periodEngine.trialBalance.verifyEquality(items)

  const formatCurrency = (val: number) => {
    if (val === 0) return '-'
    return (
      <div className="flex justify-between items-center w-full min-w-[80px]">
        <span className="text-gray-500 mr-2">Rp</span>
        <span>{new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(val)}</span>
      </div>
    )
  }

  const totalDebit = items.reduce((sum, item) => sum + item.debit, 0)
  const totalCredit = items.reduce((sum, item) => sum + item.credit, 0)
  const periodLabel = getPeriodLabel(period)
  const formatAmountText = (val: number) => val === 0 ? '-' : `Rp ${new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(val)}`
  const trialBalanceExportRows = [
    ...items.map(item => [
      item.accountNumber,
      item.accountName,
      formatAmountText(item.debit),
      formatAmountText(item.credit),
    ]),
    ['Total Keseluruhan', '', formatAmountText(totalDebit), formatAmountText(totalCredit)],
  ]

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight flex items-center">
            <Scale className="mr-2 sm:mr-3 text-primary w-6 h-6 sm:w-8 sm:h-8" />
            Neraca Saldo
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">Daftar seluruh saldo akhir akun untuk memastikan total Debit dan Kredit seimbang.</p>
        </div>
        <AccountingDownloadMenu
          fileName={`neraca-saldo-${periodLabel.toLowerCase().replace(/[^a-z0-9]+/gi, '-').replace(/(^-|-$)/g, '') || 'semua-periode'}`}
          title="Neraca Saldo"
          meta={`Periode: ${periodLabel} | Status: ${isBalanced ? 'Seimbang' : 'Tidak Seimbang'} | Dicetak: ${new Date().toLocaleString('id-ID')}`}
          headers={['No. Akun', 'Nama Akun', 'Debit', 'Kredit']}
          rows={trialBalanceExportRows}
          amountColumnIndexes={[2, 3]}
        />
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

        <div className="overflow-x-auto overscroll-x-contain">
          <table className="min-w-[720px] w-full text-left text-sm">
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
                  <td colSpan={4} className="px-6 py-12 text-center text-text-muted">Belum ada data neraca saldo pada periode terpilih.</td>
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
