import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Bell, Check, Info, Loader2 } from 'lucide-react'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { spreadsheetApi } from '@/services/sheets-client'

interface NotificationItem {
  id: string
  title: string
  message: string
  type: 'warning' | 'success' | 'info'
  date: string
  read: boolean
}

interface BillRow {
  id: string | number
  resident_email?: string
  resident_name?: string
  amount?: number
  due_date?: string
  status?: string
  title?: string
  description?: string
}

interface PaymentRow {
  id: string | number
  resident_email?: string
  resident_name?: string
  amount?: number
  status?: string
  title?: string
  date_verified?: string
  date_submitted?: string
}

interface ScheduleRow {
  id: string | number
  user_id?: string | number
  user?: string
  task?: string
  date?: string
  status?: string
}

function formatCurrency(amount?: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(amount) || 0)
}

function formatDate(date?: string) {
  if (!date) return '-'
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return date
  return parsed.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

function belongsToUser(row: { resident_email?: string; resident_name?: string }, email?: string, name?: string) {
  return row.resident_email === email || row.resident_name === name
}

export default function Notifications() {
  const { profile } = useAuth()
  const profileId = profile?.id
  const profileEmail = profile?.email
  const profileName = profile?.full_name
  const profileNickname = profile?.nickname
  const [bills, setBills] = useState<BillRow[]>([])
  const [payments, setPayments] = useState<PaymentRow[]>([])
  const [schedules, setSchedules] = useState<ScheduleRow[]>([])
  const [readIds, setReadIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profileId) return
    let isMounted = true

    async function fetchNotifications() {
      setLoading(true)
      const [billRes, paymentRes, scheduleRes] = await Promise.all([
        spreadsheetApi.get('Bills'),
        spreadsheetApi.get('Payments'),
        spreadsheetApi.get('Schedules'),
      ])

      if (!isMounted) return

      setBills(Array.isArray(billRes.data) ? (billRes.data as BillRow[]).filter((bill: BillRow) => belongsToUser(bill, profileEmail, profileName)) : [])
      setPayments(Array.isArray(paymentRes.data) ? (paymentRes.data as PaymentRow[]).filter((payment: PaymentRow) => belongsToUser(payment, profileEmail, profileName)) : [])
      setSchedules(Array.isArray(scheduleRes.data) ? (scheduleRes.data as ScheduleRow[]).filter((schedule: ScheduleRow) => {
        const userIdentifier = profileNickname || profileName?.split(' ')[0] || ''
        return String(schedule.user_id) === String(profileId) || Boolean(userIdentifier && schedule.user?.includes(userIdentifier))
      }) : [])
      setLoading(false)
    }

    fetchNotifications()
    return () => {
      isMounted = false
    }
  }, [profileEmail, profileId, profileName, profileNickname])

  const notifications = useMemo<NotificationItem[]>(() => {
    const items: NotificationItem[] = []

    bills.forEach(bill => {
      const status = String(bill.status || '').toLowerCase()
      if (['unpaid', 'rejected', 'belum bayar'].includes(status)) {
        const id = `bill-${bill.id}`
        items.push({
          id,
          title: status === 'rejected' ? 'Pembayaran Ditolak' : 'Tagihan Belum Dibayar',
          message: `${bill.title || bill.description || 'Tagihan kos'} sebesar ${formatCurrency(bill.amount)} jatuh tempo ${formatDate(bill.due_date)}.`,
          type: 'warning',
          date: formatDate(bill.due_date),
          read: readIds.includes(id),
        })
      }
    })

    payments.forEach(payment => {
      const status = String(payment.status || '').toLowerCase()
      if (['paid', 'verified', 'lunas'].includes(status)) {
        const id = `payment-${payment.id}`
        items.push({
          id,
          title: 'Pembayaran Terverifikasi',
          message: `${payment.title || 'Pembayaran'} sebesar ${formatCurrency(payment.amount)} sudah diverifikasi.`,
          type: 'success',
          date: formatDate(payment.date_verified || payment.date_submitted),
          read: readIds.includes(id),
        })
      }
      if (status === 'pending_verification' || status === 'menunggu verifikasi') {
        const id = `payment-pending-${payment.id}`
        items.push({
          id,
          title: 'Pembayaran Menunggu Verifikasi',
          message: `${payment.title || 'Pembayaran'} sebesar ${formatCurrency(payment.amount)} sedang ditinjau bendahara.`,
          type: 'info',
          date: formatDate(payment.date_submitted),
          read: readIds.includes(id),
        })
      }
    })

    schedules
      .filter(schedule => String(schedule.status || '').toLowerCase() !== 'selesai')
      .forEach(schedule => {
        const id = `schedule-${schedule.id}`
        items.push({
          id,
          title: 'Jadwal Piket Aktif',
          message: `${schedule.task || 'Piket'} terjadwal pada ${formatDate(schedule.date)}.`,
          type: 'info',
          date: formatDate(schedule.date),
          read: readIds.includes(id),
        })
      })

    return items
  }, [bills, payments, readIds, schedules])

  const markAsRead = (id: string) => {
    setReadIds(prev => prev.includes(id) ? prev : [...prev, id])
  }

  const markAllAsRead = () => {
    setReadIds(notifications.map(n => n.id))
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="w-5 h-5 text-warning" />
      case 'success': return <Check className="w-5 h-5 text-success" />
      default: return <Info className="w-5 h-5 text-info" />
    }
  }

  const getBgColor = (type: string, read: boolean) => {
    if (read) return 'bg-white'
    switch (type) {
      case 'warning': return 'bg-orange-50'
      case 'success': return 'bg-green-50'
      default: return 'bg-blue-50'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight flex items-center">
            <Bell className="mr-2 sm:mr-3 text-primary w-6 h-6 sm:w-8 sm:h-8" />
            Notifikasi Pribadi
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">Dirangkum dari tagihan, pembayaran, dan jadwal piket akun Anda.</p>
        </div>
        <button
          onClick={markAllAsRead}
          className="text-sm font-medium text-primary hover:text-primary-dark"
          disabled={notifications.length === 0}
        >
          Tandai semua dibaca
        </button>
      </div>

      <div className="card-container overflow-hidden divide-y divide-gray-100">
        {loading ? (
          <div className="p-10 text-center text-emerald-700">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" />
            Memuat notifikasi...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            Tidak ada notifikasi aktif dari data sistem saat ini.
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-5 sm:p-6 transition-colors flex gap-4 ${getBgColor(notif.type, notif.read)} hover:bg-gray-50`}
            >
              <div className="mt-1">
                {getIcon(notif.type)}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <h3 className={`font-semibold ${notif.read ? 'text-gray-700' : 'text-gray-900'}`}>
                    {notif.title}
                  </h3>
                  <span className="text-xs text-text-muted whitespace-nowrap ml-4">{notif.date}</span>
                </div>
                <p className={`text-sm ${notif.read ? 'text-gray-500' : 'text-gray-700'} mb-3`}>
                  {notif.message}
                </p>
                {!notif.read && (
                  <button
                    onClick={() => markAsRead(notif.id)}
                    className="text-xs font-medium text-primary hover:text-primary-dark flex items-center"
                  >
                    <Check className="w-3.5 h-3.5 mr-1" /> Tandai sudah dibaca
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
