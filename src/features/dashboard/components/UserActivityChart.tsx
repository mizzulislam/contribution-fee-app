import { useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { spreadsheetApi } from '@/services/sheets-client'

interface BillRow {
  resident_email?: string
  resident_name?: string
  amount?: number
  due_date?: string
  status?: string
}

interface PaymentRow {
  resident_email?: string
  resident_name?: string
  amount?: number
  date_verified?: string
  date_submitted?: string
  status?: string
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des']

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function addMonths(date: Date, months: number) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1)
}

function belongsToUser(row: { resident_email?: string; resident_name?: string }, email?: string, name?: string) {
  return row.resident_email === email || row.resident_name === name
}

export function UserActivityChart() {
  const { profile } = useAuth()
  const [bills, setBills] = useState<BillRow[]>([])
  const [payments, setPayments] = useState<PaymentRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile?.id) return
    let isMounted = true

    async function fetchActivityData() {
      setLoading(true)
      const [billRes, paymentRes] = await Promise.all([
        spreadsheetApi.get('Bills'),
        spreadsheetApi.get('Payments'),
      ])

      if (!isMounted) return

      setBills(Array.isArray(billRes.data) ? billRes.data.filter((bill: BillRow) => belongsToUser(bill, profile?.email, profile?.full_name)) : [])
      setPayments(Array.isArray(paymentRes.data) ? paymentRes.data.filter((payment: PaymentRow) => belongsToUser(payment, profile?.email, profile?.full_name)) : [])
      setLoading(false)
    }

    fetchActivityData()
    return () => {
      isMounted = false
    }
  }, [profile?.email, profile?.full_name, profile?.id])

  const data = useMemo(() => {
    const now = new Date()
    const firstMonth = addMonths(startOfMonth(now), -5)
    const buckets = Array.from({ length: 6 }, (_, index) => {
      const start = addMonths(firstMonth, index)
      return {
        name: MONTHS[start.getMonth()],
        start,
        end: addMonths(start, 1),
        tagihan: 0,
        pembayaran: 0,
      }
    })

    bills.forEach(bill => {
      const date = bill.due_date ? new Date(bill.due_date) : null
      if (!date || Number.isNaN(date.getTime())) return
      const bucket = buckets.find(item => date >= item.start && date < item.end)
      if (bucket) bucket.tagihan += Number(bill.amount) || 0
    })

    payments.forEach(payment => {
      const status = String(payment.status || '').toLowerCase()
      if (!['paid', 'verified', 'lunas'].includes(status)) return
      const date = payment.date_verified || payment.date_submitted
      const paymentDate = date ? new Date(date) : null
      if (!paymentDate || Number.isNaN(paymentDate.getTime())) return
      const bucket = buckets.find(item => paymentDate >= item.start && paymentDate < item.end)
      if (bucket) bucket.pembayaran += Number(payment.amount) || 0
    })

    return buckets.map(({ name, tagihan, pembayaran }) => ({ name, tagihan, pembayaran }))
  }, [bills, payments])

  const hasData = data.some(item => item.tagihan > 0 || item.pembayaran > 0)

  return (
    <div className="card-container flex flex-col h-full min-h-[350px]">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900">Riwayat Tagihan & Pembayaran</h3>
        <p className="text-sm text-gray-500">6 bulan terakhir berdasarkan data akun Anda.</p>
      </div>

      <div className="flex-1 w-full min-h-[250px]">
        {loading ? (
          <div className="flex h-full min-h-[250px] items-center justify-center text-emerald-700">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Memuat riwayat pembayaran...
          </div>
        ) : !hasData ? (
          <div className="flex h-full min-h-[250px] items-center justify-center rounded-xl border border-dashed border-gray-200 text-sm text-gray-500">
            Belum ada tagihan atau pembayaran pada 6 bulan terakhir.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} dy={10} />
              <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} dx={-10} tickFormatter={(val) => `Rp${Number(val) / 1000}k`} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                formatter={(value: any, name: any) => [`Rp ${Number(value).toLocaleString('id-ID')}`, name === 'tagihan' ? 'Tagihan' : 'Pembayaran']}
                cursor={{ fill: '#F3F4F6' }}
              />
              <Bar dataKey="tagihan" name="Tagihan" fill="#10B981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="pembayaran" name="Pembayaran" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
