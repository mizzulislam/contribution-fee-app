import { useMemo, useState } from 'react'
import type { LedgerAccount, Account } from '@/lib/accounting'
import { buildPeriodAccountingEngine, getPeriodLabel, type PeriodFilter } from '@/lib/accounting/period'
import AccountingDownloadMenu from '@/components/accounting/AccountingDownloadMenu'
import Select from '@/components/ui/Select'
import { BookOpen, Loader2 } from 'lucide-react'

interface GeneralLedgerViewProps {
  period: PeriodFilter
}

interface LedgerDisplayEntry {
  date: string
  description: string
  debit: number
  credit: number
  balance: number
  accountNumber?: string
  accountName?: string
}

export default function GeneralLedgerView({ period }: GeneralLedgerViewProps) {
  const periodEngine = useMemo(() => buildPeriodAccountingEngine(period), [period])
  const accounts = useMemo<Account[]>(() => periodEngine.coa.getAllAccounts(), [periodEngine])
  const [selectedAccount, setSelectedAccount] = useState('all') // Default to Pilih Semua Akun
  const isAllAccounts = selectedAccount === 'all'
  const ledgerData = useMemo<LedgerAccount | null>(() => (
    isAllAccounts ? null : periodEngine.ledger.getLedger(selectedAccount) || null
  ), [periodEngine, selectedAccount, isAllAccounts])
  const allLedgerEntries = useMemo<LedgerDisplayEntry[]>(() => {
    return periodEngine.ledger.getAllLedgers()
      .flatMap(ledger => ledger.entries.map(entry => ({
        ...entry,
        accountNumber: ledger.account.accountNumber,
        accountName: ledger.account.accountName,
      })))
      .sort((a, b) => {
        const accCompare = (a.accountNumber || '').localeCompare(b.accountNumber || '')
        if (accCompare !== 0) return accCompare
        return new Date(a.date).getTime() - new Date(b.date).getTime()
      })
  }, [periodEngine])
  const visibleLedgerEntries: LedgerDisplayEntry[] = isAllAccounts ? allLedgerEntries : ledgerData?.entries || []
  const selectedAccountLabel = isAllAccounts
    ? 'Semua Akun'
    : ledgerData ? `${ledgerData.account.accountNumber} - ${ledgerData.account.accountName}` : selectedAccount
  const periodLabel = getPeriodLabel(period)
  const periodSlug = periodLabel.toLowerCase().replace(/[^a-z0-9]+/gi, '-').replace(/(^-|-$)/g, '') || 'semua-periode'
  const formatAmountText = (val: number) => `Rp ${new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(val)}`
  const ledgerExportRows = isAllAccounts
    ? allLedgerEntries.map(entry => [
      new Date(entry.date).toLocaleDateString('id-ID'),
      `${entry.accountNumber} - ${entry.accountName}`,
      entry.description,
      entry.debit > 0 ? formatAmountText(entry.debit) : '-',
      entry.credit > 0 ? formatAmountText(entry.credit) : '-',
      formatAmountText(entry.balance),
    ])
    : visibleLedgerEntries.map(entry => [
      new Date(entry.date).toLocaleDateString('id-ID'),
      entry.description,
      entry.debit > 0 ? formatAmountText(entry.debit) : '-',
      entry.credit > 0 ? formatAmountText(entry.credit) : '-',
      formatAmountText(entry.balance),
    ])

  const formatCurrency = (val: number) => {
    return (
      <div className="flex justify-between items-center w-full min-w-[80px]">
        <span className="text-gray-500 mr-2">Rp</span>
        <span>{new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(val)}</span>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center">
            <BookOpen className="mr-3 text-primary w-8 h-8" />
            Buku Besar
          </h1>
          <p className="text-text-secondary mt-1">Melihat rincian mutasi (Debit/Kredit) dan Saldo Akhir per Akun tunggal.</p>
        </div>
        <AccountingDownloadMenu
          fileName={`buku-besar-${isAllAccounts ? 'semua-akun' : selectedAccount}-${periodSlug}`}
          title="Buku Besar"
          meta={`Akun: ${selectedAccountLabel} | Periode: ${periodLabel} | Dicetak: ${new Date().toLocaleString('id-ID')}`}
          headers={isAllAccounts
            ? ['Tanggal', 'Akun', 'Keterangan', 'Debit', 'Kredit', 'Saldo Berjalan']
            : ['Tanggal', 'Keterangan', 'Debit', 'Kredit', 'Saldo Berjalan']
          }
          rows={ledgerExportRows}
          amountColumnIndexes={isAllAccounts ? [3, 4, 5] : [2, 3, 4]}
        />
      </div>

      <div className="card-container">
        <div className="max-w-md mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Akun</label>
          <Select 
            className="w-full"
            value={selectedAccount} 
            onChange={(val) => {
              setSelectedAccount(val)
            }}
            options={[
              { label: 'Pilih Semua Akun', value: 'all' },
              ...accounts.map(acc => ({
                label: `${acc.accountNumber} - ${acc.accountName}`,
                value: acc.accountNumber
              }))
            ]}
          />
        </div>

        {ledgerData || isAllAccounts ? (
          <div>
            {/* Single Account View */}
            {!isAllAccounts && ledgerData && (
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

                <div className="overflow-x-auto overscroll-x-contain">
                  <table className="min-w-[820px] w-full text-left text-sm">
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
                          <td colSpan={5} className="px-6 py-12 text-center text-text-muted">
                            Belum ada mutasi untuk akun ini pada periode terpilih.
                          </td>
                        </tr>
                      ) : (
                        [...ledgerData.entries]
                          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                          .map((entry, idx) => (
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
            )}

            {/* All Accounts View grouped by Account */}
            {isAllAccounts && (
              <div className="space-y-8">
                <div className="mb-6 flex justify-between items-center bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                  <div>
                    <h3 className="font-semibold text-emerald-900">Buku Besar: Semua Akun</h3>
                    <p className="text-sm text-emerald-700">Diklasifikasikan per akun dengan tabel masing-masing (Urutan Terlama ke Terbaru).</p>
                  </div>
                  <div className="text-sm font-semibold text-emerald-900">
                    {periodEngine.ledger.getAllLedgers().filter(l => l.entries.length > 0).length} akun aktif
                  </div>
                </div>

                {periodEngine.ledger.getAllLedgers()
                  .filter(ledger => ledger.entries.length > 0)
                  .sort((a, b) => a.account.accountNumber.localeCompare(b.account.accountNumber))
                  .map((ledger) => {
                    const sortedEntries = [...ledger.entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    return (
                      <div key={ledger.account.accountNumber} className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm bg-white p-4">
                        <div className="mb-4 flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b pb-3 bg-gray-50/50 -m-4 p-4 rounded-t-2xl">
                          <div>
                            <h4 className="font-bold text-gray-900 text-lg">
                              {ledger.account.accountNumber} - {ledger.account.accountName}
                            </h4>
                            <p className="text-xs text-text-secondary mt-0.5">
                              Tipe: {ledger.account.accountType} | Saldo Normal: {ledger.account.normalBalance}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-semibold text-text-muted">Saldo Akhir</span>
                            <div className="text-xl font-bold text-emerald-700">
                              {formatCurrency(ledger.currentBalance)}
                            </div>
                          </div>
                        </div>

                        <div className="overflow-x-auto overscroll-x-contain mt-2">
                          <table className="min-w-[780px] w-full text-left text-sm">
                            <thead className="bg-gray-50/80 border-b border-border text-gray-600 text-xs uppercase">
                              <tr>
                                <th className="px-6 py-2.5 font-semibold whitespace-nowrap">Tanggal</th>
                                <th className="px-6 py-2.5 font-semibold whitespace-nowrap">Keterangan</th>
                                <th className="px-6 py-2.5 font-semibold text-right">Debit</th>
                                <th className="px-6 py-2.5 font-semibold text-right">Kredit</th>
                                <th className="px-6 py-2.5 font-semibold text-right">Saldo Berjalan</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border text-gray-700 bg-white">
                              {sortedEntries.map((entry, idx) => (
                                <tr key={idx} className="hover:bg-gray-50/30 transition-colors">
                                  <td className="px-6 py-3">{new Date(entry.date).toLocaleDateString('id-ID')}</td>
                                  <td className="px-6 py-3">{entry.description}</td>
                                  <td className="px-6 py-3 text-right">{entry.debit > 0 ? formatCurrency(entry.debit) : '-'}</td>
                                  <td className="px-6 py-3 text-right">{entry.credit > 0 ? formatCurrency(entry.credit) : '-'}</td>
                                  <td className="px-6 py-3 text-right font-medium">{formatCurrency(entry.balance)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )
                  })}
                
                {periodEngine.ledger.getAllLedgers().filter(l => l.entries.length > 0).length === 0 && (
                  <div className="px-6 py-12 text-center text-text-muted bg-white border rounded-2xl">
                    Belum ada mutasi untuk semua akun pada periode terpilih.
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-text-muted">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
            <span className="font-medium">Memuat data buku besar...</span>
          </div>
        )}
      </div>
    </div>
  )
}
