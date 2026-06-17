import { useEffect, useMemo, useState } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Loader2 } from 'lucide-react'
import { spreadsheetApi } from '@/services/sheets-client'
import { mergeAccounts } from '@/features/accounting/data/chartOfAccounts'

type TimeRange = 'harian' | 'mingguan' | 'bulanan'

interface JournalLine {
  accountNumber?: string | number
  account_number?: string | number
  amount?: string | number
}

interface JournalEntryRow {
  id?: string | number
  date?: string
  debits?: string | JournalLine[]
  credits?: string | JournalLine[]
}

interface ChartPoint {
  name: string
  start: Date
  end: Date
  pemasukan: number
  pengeluaran: number
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des']
const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

function parseLines(lines: string | JournalLine[] | undefined): JournalLine[] {
  if (!lines) return []
  if (Array.isArray(lines)) return normalizeLines(lines)

  try {
    const parsed = JSON.parse(lines)
    return Array.isArray(parsed) ? normalizeLines(parsed) : []
  } catch {
    return []
  }
}

function normalizeLines(lines: JournalLine[]): JournalLine[] {
  return lines
    .map(line => ({
      accountNumber: line.accountNumber ?? line.account_number,
      amount: parseAmount(line.amount),
    }))
    .filter(line => line.accountNumber !== undefined && line.accountNumber !== null && line.accountNumber !== '')
}

function parseAmount(value: string | number | undefined) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (!value) return 0

  const normalized = String(value)
    .replace(/[^\d,.-]/g, '')
    .replace(/\.(?=\d{3}(\D|$))/g, '')
    .replace(',', '.')

  const amount = Number(normalized)
  return Number.isFinite(amount) ? amount : 0
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function addMonths(date: Date, months: number) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1)
}

function buildBuckets(range: TimeRange): ChartPoint[] {
  const today = startOfDay(new Date())

  if (range === 'harian') {
    return Array.from({ length: 7 }, (_, index) => {
      const start = addDays(today, index - 6)
      return {
        name: DAYS[start.getDay()],
        start,
        end: addDays(start, 1),
        pemasukan: 0,
        pengeluaran: 0,
      }
    })
  }

  if (range === 'mingguan') {
    return Array.from({ length: 4 }, (_, index) => {
      const start = addDays(today, (index - 3) * 7)
      return {
        name: `Mg ${index + 1}`,
        start,
        end: addDays(start, 7),
        pemasukan: 0,
        pengeluaran: 0,
      }
    })
  }

  return Array.from({ length: 6 }, (_, index) => {
    const start = addMonths(new Date(today.getFullYear(), today.getMonth(), 1), index - 5)
    return {
      name: MONTHS[start.getMonth()],
      start,
      end: addMonths(start, 1),
      pemasukan: 0,
      pengeluaran: 0,
    }
  })
}

export function FinancialChart() {
  const [timeRange, setTimeRange] = useState<TimeRange>('bulanan')
  const [entries, setEntries] = useState<JournalEntryRow[]>([])
  const [accountTypes, setAccountTypes] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function fetchChartData() {
      setLoading(true)
      setError(null)

      try {
        const [journalRes, masterRes] = await Promise.all([
          spreadsheetApi.get('JournalEntries'),
          spreadsheetApi.get('MasterData'),
        ])

        if (!isMounted) return

        const accounts = mergeAccounts(Array.isArray(masterRes.data) ? masterRes.data : [])
        setAccountTypes(
          accounts.reduce<Record<string, string>>((map, account) => {
            map[String(account.account_number)] = account.account_type
            return map
          }, {})
        )
        setEntries(Array.isArray(journalRes.data) ? journalRes.data : [])
      } catch (err) {
        console.error('Financial chart fetch error:', err)
        if (isMounted) {
          setEntries([])
          setError('Data arus kas belum dapat dimuat.')
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchChartData()
    return () => {
      isMounted = false
    }
  }, [])

  const data = useMemo(() => {
    const buckets = buildBuckets(timeRange)

    entries.forEach(entry => {
      const entryDate = entry.date ? startOfDay(new Date(entry.date)) : null
      if (!entryDate || Number.isNaN(entryDate.getTime())) return

      const bucket = buckets.find(item => entryDate >= item.start && entryDate < item.end)
      if (!bucket) return

      parseLines(entry.credits).forEach(line => {
        if (accountTypes[String(line.accountNumber)] === 'Pendapatan') {
          bucket.pemasukan += parseAmount(line.amount)
        }
      })

      parseLines(entry.debits).forEach(line => {
        if (accountTypes[String(line.accountNumber)] === 'Beban') {
          bucket.pengeluaran += parseAmount(line.amount)
        }
      })
    })

    return buckets.map(({ name, pemasukan, pengeluaran }) => ({ name, pemasukan, pengeluaran }))
  }, [accountTypes, entries, timeRange])

  const hasData = data.some(item => item.pemasukan > 0 || item.pengeluaran > 0)

  const getTitle = () => {
    switch (timeRange) {
      case 'harian': return '7 Hari Terakhir'
      case 'mingguan': return '4 Minggu Terakhir'
      case 'bulanan': return '6 Bulan Terakhir'
    }
  }

  return (
    <div className="card-container flex flex-col h-full min-h-[350px]">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Arus Kas ({getTitle()})</h3>
          <p className="text-sm text-gray-500">Dihitung dari jurnal akuntansi tersinkron.</p>
        </div>

        <div className="flex items-center bg-gray-100 p-1 rounded-xl w-fit">
          {([
            ['harian', 'Harian'],
            ['mingguan', 'Mingguan'],
            ['bulanan', 'Bulanan'],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setTimeRange(value)}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${timeRange === value ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="w-full h-[280px] sm:h-[300px]">
        {loading ? (
          <div className="flex h-full items-center justify-center text-emerald-700">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Memuat data arus kas...
          </div>
        ) : error ? (
          <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-rose-200 bg-rose-50/40 px-4 text-center text-sm text-rose-700">
            {error}
          </div>
        ) : !hasData ? (
          <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-gray-200 text-sm text-gray-500">
            Belum ada data jurnal pada periode ini.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPemasukan" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorPengeluaran" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} dy={10} />
              <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} dx={-10} tickFormatter={(val) => `Rp${Number(val) / 1000}k`} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}
                formatter={(value: any, name: any) => [`Rp ${Number(value).toLocaleString('id-ID')}`, name === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran']}
              />
              <Area type="monotone" dataKey="pemasukan" name="Pemasukan" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorPemasukan)" />
              <Area type="monotone" dataKey="pengeluaran" name="Pengeluaran" stroke="#EF4444" strokeWidth={3} fillOpacity={1} fill="url(#colorPengeluaran)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
