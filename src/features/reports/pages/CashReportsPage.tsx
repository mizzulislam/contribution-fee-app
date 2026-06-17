import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  FileBarChart,
  Filter,
  Loader2,
  PieChart,
  RefreshCw,
  Search,
  Wallet,
} from 'lucide-react'
import { TableLoader } from '@/components/ui/TableLoader'
import Select from '@/components/ui/Select'
import { cn } from '@/utils/styles'
import { getPeriodLabel, getPresetPeriod, type PeriodFilter, type PeriodPreset } from '@/features/accounting/calculations/period'
import {
  getResidentCashTransparency,
  type ResidentCashMutation,
  type ResidentCashTransparencyData,
} from '@/features/reports/services/residentCash.service'

type ActiveTab = 'mutations' | 'statements'
type StatementSection = 'income' | 'equity' | 'balance' | 'cashFlow'

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

function formatStatementAmount(amount: number) {
  const formatted = formatCurrency(Math.abs(amount))
  return amount < 0 ? `(${formatted})` : formatted
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value || '-'

  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function dateToTime(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.getTime()
}

function buildPeriodFilter(startDate: string, endDate: string): PeriodFilter | undefined {
  if (!startDate && !endDate) return undefined
  return {
    preset: 'custom',
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  }
}

function filterMutation(mutation: ResidentCashMutation, filters: {
  startDate: string
  endDate: string
  category: string
  search: string
}) {
  const transactionTime = dateToTime(mutation.date)
  const startTime = filters.startDate ? dateToTime(filters.startDate) : null
  const endTime = filters.endDate ? dateToTime(filters.endDate) : null

  if (startTime !== null && transactionTime !== null && transactionTime < startTime) return false
  if (endTime !== null && transactionTime !== null && transactionTime > endTime) return false
  if (filters.category && mutation.category !== filters.category) return false

  const search = filters.search.trim().toLowerCase()
  if (!search) return true

  return [
    mutation.category,
    mutation.description,
    mutation.sourceStatus,
    mutation.date,
  ].some(value => String(value).toLowerCase().includes(search))
}

function StatementRow({
  label,
  value,
  bold = false,
  indent = false,
  negative = false,
}: {
  label: string
  value?: number
  bold?: boolean
  indent?: boolean
  negative?: boolean
}) {
  const hasValue = typeof value === 'number'

  return (
    <div className={cn(
      'grid grid-cols-[1fr_auto] gap-4 border-b border-gray-100 px-4 py-3 text-sm last:border-b-0',
      bold && 'bg-gray-50 font-bold text-gray-950'
    )}>
      <span className={cn('text-gray-700', indent && 'pl-5', bold && 'text-gray-950')}>
        {label}
      </span>
      <span className={cn('min-w-[150px] text-right font-medium tabular-nums text-gray-900', bold && 'font-bold', negative && 'text-rose-700')}>
        {hasValue ? formatStatementAmount(value) : ''}
      </span>
    </div>
  )
}

export default function CashReports() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('mutations')
  const [data, setData] = useState<ResidentCashTransparencyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [category, setCategory] = useState('')
  const [search, setSearch] = useState('')
  const [statementPeriod, setStatementPeriod] = useState<PeriodFilter>({ preset: 'all' })
  const [isStatementPeriodOpen, setIsStatementPeriodOpen] = useState(false)
  const [statementStartDate, setStatementStartDate] = useState('')
  const [statementEndDate, setStatementEndDate] = useState('')
  const [statementSection, setStatementSection] = useState<StatementSection>('income')
  const statementPeriodRef = useRef<HTMLDivElement>(null)

  const period = useMemo(() => buildPeriodFilter(startDate, endDate), [startDate, endDate])

  const fetchCashReports = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await getResidentCashTransparency(activeTab === 'statements' ? statementPeriod : period)
      setData(result)
    } catch (err) {
      console.error('Resident cash report error:', err)
      setData(null)
      setError('Data kas belum dapat dimuat. Coba muat ulang, atau hubungi admin jika masih terjadi.')
    } finally {
      setLoading(false)
    }
  }, [activeTab, period, statementPeriod])

  useEffect(() => {
    fetchCashReports()
  }, [fetchCashReports])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!statementPeriodRef.current?.contains(event.target as Node)) {
        setIsStatementPeriodOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredMutations = useMemo(() => {
    if (!data) return []

    return data.mutations.filter(mutation => filterMutation(mutation, {
      startDate,
      endDate,
      category,
      search,
    }))
  }, [category, data, endDate, search, startDate])

  const displayedTotals = useMemo(() => {
    return filteredMutations.reduce((totals, mutation) => {
      totals.incoming += mutation.moneyIn
      totals.outgoing += mutation.moneyOut
      return totals
    }, { incoming: 0, outgoing: 0 })
  }, [filteredMutations])

  const tabs = [
    { id: 'mutations', label: 'Mutasi Kas', icon: PieChart },
    { id: 'statements', label: 'Laporan Keuangan', icon: FileBarChart },
  ] as const
  const categoryOptions = useMemo(() => [
    { label: 'Semua Kategori', value: '' },
    ...(data?.categories || []).map(item => ({ label: item, value: item })),
  ], [data?.categories])
  const periodLabel = period ? getPeriodLabel(period) : 'Semua Periode'
  const statementPeriodLabel = getPeriodLabel(statementPeriod)

  const applyStatementPeriod = (preset: PeriodPreset) => {
    if (preset === 'custom') {
      setStatementPeriod({
        preset,
        startDate: statementStartDate || undefined,
        endDate: statementEndDate || undefined,
      })
    } else {
      setStatementPeriod(getPresetPeriod(preset))
    }
    setIsStatementPeriodOpen(false)
  }

  const statementSections = [
    { id: 'income', label: 'Laba Rugi' },
    { id: 'equity', label: 'Perubahan Ekuitas' },
    { id: 'balance', label: 'Neraca' },
    { id: 'cashFlow', label: 'Arus Kas' },
  ] as const

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="flex items-center text-3xl font-bold tracking-tight text-gray-900">
            <PieChart className="mr-3 h-8 w-8 text-primary" />
            Transparansi Kas Kos
          </h1>
          <p className="mt-1 text-text-secondary">
            Data kas read-only dari Akuntansi & Pelaporan Admin yang aman dilihat penghuni.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchCashReports}
          disabled={loading}
          className="btn-secondary inline-flex min-h-11 items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Muat Ulang
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-700">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="card-container flex min-h-[132px] flex-col justify-center bg-white p-6">
          <div className="mb-2 flex items-center text-text-secondary">
            <Wallet className="mr-2 h-5 w-5" />
            <span className="font-medium">Saldo Kas Saat Ini</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {loading ? '...' : formatCurrency(data?.summary.balance || 0)}
          </div>
        </div>

        <div className="card-container flex min-h-[132px] flex-col justify-center bg-white p-6">
          <div className="mb-2 flex items-center text-success">
            <ArrowUpRight className="mr-2 h-5 w-5" />
            <span className="font-medium">Uang Masuk Ditampilkan</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {loading ? '...' : formatCurrency(displayedTotals.incoming)}
          </div>
        </div>

        <div className="card-container flex min-h-[132px] flex-col justify-center bg-white p-6">
          <div className="mb-2 flex items-center text-danger">
            <ArrowDownRight className="mr-2 h-5 w-5" />
            <span className="font-medium">Uang Keluar Ditampilkan</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {loading ? '...' : formatCurrency(displayedTotals.outgoing)}
          </div>
        </div>
      </div>

      <div className="rounded-[20px] border border-gray-100 bg-white p-2 shadow-sm">
        <div className="flex items-center gap-2 overflow-x-auto">
          {tabs.map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex min-h-11 flex-shrink-0 items-center rounded-xl px-4 py-2.5 text-sm font-medium transition-all',
                  isActive ? 'bg-emerald-50 text-emerald-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <Icon className={cn('mr-2 h-4 w-4', isActive ? 'text-emerald-600' : 'text-gray-400')} />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {activeTab === 'mutations' ? (
        <div className="card-container overflow-hidden p-0">
          <div className="border-b border-gray-100 p-4 sm:p-5">
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_1fr_1fr_1.4fr]">
              <label className="text-xs font-semibold text-gray-600">
                Dari Tanggal
                <input
                  type="date"
                  value={startDate}
                  onChange={event => setStartDate(event.target.value)}
                  className="form-input mt-1 h-10 text-sm"
                />
              </label>

              <label className="text-xs font-semibold text-gray-600">
                Sampai Tanggal
                <input
                  type="date"
                  value={endDate}
                  onChange={event => setEndDate(event.target.value)}
                  className="form-input mt-1 h-10 text-sm"
                />
              </label>

              <label className="text-xs font-semibold text-gray-600">
                Kategori
                <Select
                  value={category}
                  onChange={setCategory}
                  options={categoryOptions}
                  className="mt-1"
                />
              </label>

              <label className="text-xs font-semibold text-gray-600">
                Cari
                <div className="relative mt-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="search"
                    value={search}
                    onChange={event => setSearch(event.target.value)}
                    placeholder="Cari keterangan atau sumber data..."
                    className="form-input h-10 pl-9 text-sm"
                  />
                </div>
              </label>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-5 py-4 text-left">Tanggal</th>
                  <th className="px-5 py-4 text-left">Kategori</th>
                  <th className="px-5 py-4 text-left">Keterangan</th>
                  <th className="px-5 py-4 text-right">Uang Masuk</th>
                  <th className="px-5 py-4 text-right">Uang Keluar</th>
                  <th className="px-5 py-4 text-right">Saldo Setelah Transaksi</th>
                  <th className="px-5 py-4 text-left">Status/Sumber Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <TableLoader colSpan={7} text="Memuat mutasi kas dari akuntansi..." />
                ) : filteredMutations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="mx-auto max-w-md rounded-2xl border border-dashed border-gray-200 bg-gray-50/60 p-6">
                        <p className="font-semibold text-gray-900">Belum ada mutasi kas yang cocok.</p>
                        <p className="mt-1 text-sm text-gray-500">Coba ubah tanggal, kategori, atau kata pencarian.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredMutations.map(mutation => (
                    <tr key={mutation.id} className="bg-white transition-colors hover:bg-emerald-50/30">
                      <td className="whitespace-nowrap px-5 py-4 font-medium text-gray-700">{formatDate(mutation.date)}</td>
                      <td className="px-5 py-4">
                        <span className="badge badge-success">{mutation.category}</span>
                      </td>
                      <td className="max-w-[320px] px-5 py-4 text-gray-700">
                        <span className="line-clamp-2">{mutation.description}</span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-right font-semibold text-emerald-700">
                        {mutation.moneyIn > 0 ? formatCurrency(mutation.moneyIn) : '-'}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-right font-semibold text-rose-700">
                        {mutation.moneyOut > 0 ? formatCurrency(mutation.moneyOut) : '-'}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-right font-bold text-gray-900">
                        {formatCurrency(mutation.balanceAfter)}
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                          {mutation.sourceStatus}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex flex-col gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 text-sm text-emerald-800 lg:flex-row lg:items-center lg:justify-between">
            <span>
              Laporan ini read-only untuk warga. Periode laporan: <span className="font-bold">{statementPeriodLabel}</span>.
            </span>

            <div ref={statementPeriodRef} className="relative">
              <button
                type="button"
                onClick={() => setIsStatementPeriodOpen(prev => !prev)}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-50"
              >
                <Filter className="h-4 w-4" />
                Filter Periode
                <CalendarDays className="h-4 w-4 text-emerald-500" />
              </button>

              {isStatementPeriodOpen && (
                <div className="absolute right-0 z-40 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-gray-100 bg-white p-4 text-gray-700 shadow-xl shadow-gray-200/60">
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'Semua', value: 'all' },
                      { label: 'Bulan Ini', value: 'this_month' },
                      { label: 'Bulan Lalu', value: 'last_month' },
                      { label: 'Tahun Ini', value: 'this_year' },
                    ].map(item => (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => applyStatementPeriod(item.value as PeriodPreset)}
                        className={cn(
                          'rounded-xl border px-3 py-2 text-sm font-medium transition-colors',
                          statementPeriod.preset === item.value
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                        )}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  <div className="mt-4 border-t border-gray-100 pt-4">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <label className="text-xs font-semibold text-gray-600">
                        Dari
                        <input
                          type="date"
                          value={statementStartDate}
                          onChange={event => setStatementStartDate(event.target.value)}
                          className="form-input mt-1 h-10 text-sm"
                        />
                      </label>
                      <label className="text-xs font-semibold text-gray-600">
                        Sampai
                        <input
                          type="date"
                          value={statementEndDate}
                          onChange={event => setStatementEndDate(event.target.value)}
                          className="form-input mt-1 h-10 text-sm"
                        />
                      </label>
                    </div>
                    <button
                      type="button"
                      onClick={() => applyStatementPeriod('custom')}
                      className="btn-primary mt-3 w-full justify-center py-2 text-sm"
                    >
                      Terapkan Periode Custom
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {loading ? (
            <div className="card-container flex min-h-[260px] flex-col items-center justify-center text-emerald-700">
              <Loader2 className="mb-3 h-8 w-8 animate-spin" />
              <span className="text-sm font-semibold">Memuat laporan keuangan...</span>
            </div>
          ) : !data ? (
            <div className="card-container p-8 text-center text-gray-500">Laporan keuangan belum tersedia.</div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 px-6 py-6 text-center">
                <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Soematra Kost</p>
                <h2 className="mt-1 text-2xl font-bold text-gray-950">Laporan Keuangan</h2>
                <p className="mt-1 text-sm text-gray-500">Periode: {statementPeriodLabel}</p>
              </div>

              <div className="border-b border-gray-200 bg-gray-50 p-3">
                <div className="flex flex-wrap gap-2">
                  {statementSections.map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setStatementSection(item.id)}
                      className={cn(
                        'rounded-xl px-4 py-2 text-sm font-semibold transition-colors',
                        statementSection === item.id
                          ? 'bg-gray-900 text-white shadow-sm'
                          : 'bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      )}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {statementSection === 'income' && (
                <section>
                  <div className="border-b border-gray-200 px-6 py-5 text-center">
                    <h3 className="text-xl font-bold text-gray-950">Laporan Laba Rugi</h3>
                    <p className="mt-1 text-sm text-gray-500">Untuk periode {statementPeriodLabel}</p>
                  </div>
                  <div>
                    <StatementRow label="Pendapatan" bold />
                    <StatementRow label="Pendapatan kos" value={data.report.statements.incomeStatement.revenues} indent />
                    <StatementRow label="Total Pendapatan" value={data.report.statements.incomeStatement.revenues} bold />
                    <StatementRow label="Beban" bold />
                    <StatementRow label="Beban operasional" value={data.report.statements.incomeStatement.expenses} indent negative />
                    <StatementRow label="Total Beban" value={data.report.statements.incomeStatement.expenses} bold negative />
                    <StatementRow
                      label={data.report.statements.incomeStatement.netIncome >= 0 ? 'Laba Bersih' : 'Rugi Bersih'}
                      value={data.report.statements.incomeStatement.netIncome}
                      bold
                      negative={data.report.statements.incomeStatement.netIncome < 0}
                    />
                  </div>
                </section>
              )}

              {statementSection === 'equity' && (
                <section>
                  <div className="border-b border-gray-200 px-6 py-5 text-center">
                    <h3 className="text-xl font-bold text-gray-950">Laporan Perubahan Ekuitas</h3>
                    <p className="mt-1 text-sm text-gray-500">Untuk periode {statementPeriodLabel}</p>
                  </div>
                  <div>
                    <StatementRow label="Laba Ditahan Awal" value={data.report.statements.retainedEarningsStatement.beginningRetainedEarnings} />
                    <StatementRow label="Ditambah: Laba/Rugi Bersih" value={data.report.statements.retainedEarningsStatement.netIncome} negative={data.report.statements.retainedEarningsStatement.netIncome < 0} />
                    <StatementRow label="Dikurangi: Prive Pemilik" value={data.report.statements.retainedEarningsStatement.dividends} negative />
                    <StatementRow label="Laba Ditahan Akhir" value={data.report.statements.retainedEarningsStatement.endingRetainedEarnings} bold negative={data.report.statements.retainedEarningsStatement.endingRetainedEarnings < 0} />
                  </div>
                </section>
              )}

              {statementSection === 'balance' && (
                <section>
                  <div className="border-b border-gray-200 px-6 py-5 text-center">
                    <h3 className="text-xl font-bold text-gray-950">Neraca</h3>
                    <p className="mt-1 text-sm text-gray-500">Posisi keuangan per {statementPeriodLabel}</p>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2">
                    <div className="border-b border-gray-200 lg:border-r lg:border-b-0">
                      <StatementRow label="Aset" bold />
                      <StatementRow label="Aset lancar" value={data.report.statements.balanceSheet.assets.currentAssets} indent negative={data.report.statements.balanceSheet.assets.currentAssets < 0} />
                      <StatementRow label="Aset tetap" value={data.report.statements.balanceSheet.assets.propertyPlantEquipment} indent negative={data.report.statements.balanceSheet.assets.propertyPlantEquipment < 0} />
                      <StatementRow label="Aset tidak berwujud" value={data.report.statements.balanceSheet.assets.intangibleAssets} indent negative={data.report.statements.balanceSheet.assets.intangibleAssets < 0} />
                      <StatementRow label="Total Aset" value={data.report.statements.balanceSheet.assets.totalAssets} bold negative={data.report.statements.balanceSheet.assets.totalAssets < 0} />
                    </div>
                    <div>
                      <StatementRow label="Kewajiban" bold />
                      <StatementRow label="Kewajiban lancar" value={data.report.statements.balanceSheet.liabilities.currentLiabilities} indent />
                      <StatementRow label="Kewajiban jangka panjang" value={data.report.statements.balanceSheet.liabilities.longTermLiabilities} indent />
                      <StatementRow label="Total Kewajiban" value={data.report.statements.balanceSheet.liabilities.totalLiabilities} bold />
                      <StatementRow label="Ekuitas" bold />
                      <StatementRow label="Total Ekuitas" value={data.report.statements.balanceSheet.equity.totalEquity} indent negative={data.report.statements.balanceSheet.equity.totalEquity < 0} />
                      <StatementRow label="Total Kewajiban & Ekuitas" value={data.report.statements.balanceSheet.totalLiabilitiesAndEquity} bold negative={data.report.statements.balanceSheet.totalLiabilitiesAndEquity < 0} />
                    </div>
                  </div>
                </section>
              )}

              {statementSection === 'cashFlow' && (
                <section>
                  <div className="border-b border-gray-200 px-6 py-5 text-center">
                    <h3 className="text-xl font-bold text-gray-950">Laporan Arus Kas</h3>
                    <p className="mt-1 text-sm text-gray-500">Untuk periode {statementPeriodLabel}</p>
                  </div>
                  <div>
                    <StatementRow
                      label="Kas Bersih dari Aktivitas Operasi"
                      value={data.report.statements.cashFlowStatement.operatingActivities}
                      negative={data.report.statements.cashFlowStatement.operatingActivities < 0}
                    />
                    <StatementRow
                      label="Kas Bersih dari Aktivitas Investasi"
                      value={data.report.statements.cashFlowStatement.investingActivities}
                      negative={data.report.statements.cashFlowStatement.investingActivities < 0}
                    />
                    <StatementRow
                      label="Kas Bersih dari Aktivitas Pendanaan"
                      value={data.report.statements.cashFlowStatement.financingActivities}
                      negative={data.report.statements.cashFlowStatement.financingActivities < 0}
                    />
                    <StatementRow
                      label="Kenaikan/Penurunan Bersih Kas"
                      value={data.report.statements.cashFlowStatement.netCashFlow}
                      bold
                      negative={data.report.statements.cashFlowStatement.netCashFlow < 0}
                    />
                    <StatementRow
                      label="Saldo Kas Awal"
                      value={data.report.statements.cashFlowStatement.beginningCashBalance}
                      negative={data.report.statements.cashFlowStatement.beginningCashBalance < 0}
                    />
                    <StatementRow
                      label="Saldo Kas Akhir"
                      value={data.report.statements.cashFlowStatement.endingCashBalance}
                      bold
                      negative={data.report.statements.cashFlowStatement.endingCashBalance < 0}
                    />
                  </div>
                </section>
              )}

              <div className="border-t border-gray-200 bg-emerald-50/50 px-6 py-4 text-xs leading-5 text-emerald-900">
                Catatan: laporan ini hanya menampilkan data yang aman untuk penghuni dan tidak menyediakan aksi tambah, edit, hapus, posting jurnal, closing entry, atau approval.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
