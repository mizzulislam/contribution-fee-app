import { useCallback, useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { spreadsheetApi } from '@/services/sheets-client'
import { WalletCards, CalendarCheck, Droplets, ArrowRight, Building2, Users, Activity, ReceiptText, ArrowDownCircle, SearchCheck, X, LayoutDashboard, type LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { QuickActions } from '@/features/dashboard/components/QuickActions'
import { FinancialChart } from '@/features/dashboard/components/FinancialChart'
import { Landmark, ArrowUpRight } from 'lucide-react'
import { defaultEngine, syncAccountingWithSheet } from '@/features/accounting'
import type { FinancialStatements } from '@/features/accounting'
import { UserActivityChart } from '@/features/dashboard/components/UserActivityChart'
import JournalEntryModal from '@/features/accounting/components/JournalEntryModal'
import { calculateGallonStock, formatGallonQuantity } from '@/features/gallon-tracker/utils/gallonStock'
import { getResidentCashSnapshot } from '@/features/reports/services/residentCash.service'

type DashboardCardTone = 'emerald' | 'blue' | 'orange' | 'rose' | 'amber' | 'purple'

const dashboardCardToneClasses: Record<DashboardCardTone, {
  border: string
  background: string
  glow: string
  icon: string
  eyebrow: string
  divider: string
  action: string
  badge: string
}> = {
  emerald: {
    border: 'border-emerald-100',
    background: 'bg-gradient-to-br from-white via-white to-emerald-50/80',
    glow: 'bg-emerald-100/60',
    icon: 'bg-emerald-100 text-emerald-700',
    eyebrow: 'text-emerald-700',
    divider: 'border-emerald-100',
    action: 'hover:text-emerald-700',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  },
  blue: {
    border: 'border-blue-100',
    background: 'bg-gradient-to-br from-white via-white to-blue-50/80',
    glow: 'bg-blue-100/70',
    icon: 'bg-blue-100 text-blue-700',
    eyebrow: 'text-blue-700',
    divider: 'border-blue-100',
    action: 'hover:text-blue-700',
    badge: 'bg-blue-50 text-blue-700 border-blue-100',
  },
  orange: {
    border: 'border-orange-100',
    background: 'bg-gradient-to-br from-white via-white to-orange-50/80',
    glow: 'bg-orange-100/70',
    icon: 'bg-orange-100 text-orange-700',
    eyebrow: 'text-orange-700',
    divider: 'border-orange-100',
    action: 'hover:text-orange-700',
    badge: 'bg-orange-50 text-orange-700 border-orange-100',
  },
  rose: {
    border: 'border-rose-100',
    background: 'bg-gradient-to-br from-white via-white to-rose-50/80',
    glow: 'bg-rose-100/70',
    icon: 'bg-rose-100 text-rose-700',
    eyebrow: 'text-rose-700',
    divider: 'border-rose-100',
    action: 'hover:text-rose-700',
    badge: 'bg-rose-50 text-rose-700 border-rose-100',
  },
  amber: {
    border: 'border-amber-100',
    background: 'bg-gradient-to-br from-white via-white to-amber-50/80',
    glow: 'bg-amber-100/70',
    icon: 'bg-amber-100 text-amber-700',
    eyebrow: 'text-amber-700',
    divider: 'border-amber-100',
    action: 'hover:text-amber-700',
    badge: 'bg-amber-50 text-amber-700 border-amber-100',
  },
  purple: {
    border: 'border-purple-100',
    background: 'bg-gradient-to-br from-white via-white to-purple-50/80',
    glow: 'bg-purple-100/70',
    icon: 'bg-purple-100 text-purple-700',
    eyebrow: 'text-purple-700',
    divider: 'border-purple-100',
    action: 'hover:text-purple-700',
    badge: 'bg-purple-50 text-purple-700 border-purple-100',
  },
}

interface DashboardMetricCardProps {
  actionLabel: string
  actionTo: string
  badge?: string
  eyebrow: string
  icon: LucideIcon
  note?: string
  title: string
  tone: DashboardCardTone
  value: string
}

function DashboardMetricCard({
  actionLabel,
  actionTo,
  badge,
  eyebrow,
  icon: Icon,
  note,
  title,
  tone,
  value,
}: DashboardMetricCardProps) {
  const toneClass = dashboardCardToneClasses[tone]

  return (
    <div className={`relative min-h-[160px] sm:min-h-[220px] overflow-hidden rounded-2xl border ${toneClass.border} ${toneClass.background} p-4 sm:p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md`}>
      <div className={`absolute right-0 top-0 h-20 w-20 sm:h-24 sm:w-24 ${toneClass.glow} blur-2xl`} />
      <div className="relative flex h-full flex-col justify-between gap-3 sm:gap-6">
        <div className="flex items-start justify-between gap-2 sm:gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <p className={`text-[10px] sm:text-xs font-bold uppercase tracking-wide ${toneClass.eyebrow}`}>{eyebrow}</p>
              {badge && (
                <span className={`inline-flex rounded-full border px-1.5 py-0.5 text-[9px] sm:text-[11px] font-semibold ${toneClass.badge}`}>
                  {badge}
                </span>
              )}
            </div>
            <h4 className="mt-1 sm:mt-2 text-sm sm:text-base font-semibold text-gray-900 line-clamp-1">{title}</h4>
          </div>
          <div className={`flex h-9 w-9 sm:h-12 sm:w-12 flex-shrink-0 items-center justify-center rounded-xl sm:rounded-2xl ${toneClass.icon}`}>
            <Icon className="h-4.5 w-4.5 sm:h-6 sm:w-6" />
          </div>
        </div>
        <div>
          <p className="break-words text-2xl font-black tracking-tight text-gray-950 sm:text-4xl">
            {value}
          </p>
          {note ? (
            <p className="mt-1 sm:mt-2 text-xs sm:text-sm font-medium text-text-secondary line-clamp-1">{note}</p>
          ) : (
            <p className="mt-1 sm:mt-2 text-xs sm:text-sm font-medium text-transparent select-none" aria-hidden="true">
              &nbsp;
            </p>
          )}
          <div className={`mt-4 sm:mt-8 border-t ${toneClass.divider} pt-3 sm:pt-5`}>
            <Link to={actionTo} className={`inline-flex items-center text-xs sm:text-sm font-bold text-gray-900 ${toneClass.action}`}>
              {actionLabel} <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { profile, activeRole } = useAuth()
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false)
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(false)
  
  // Dashboard Data States
  const [totalUsers, setTotalUsers] = useState(0)
  const [unpaidBills, setUnpaidBills] = useState(0)
  const [myUnpaidAmount, setMyUnpaidAmount] = useState(0)
  const [totalRooms, setTotalRooms] = useState(0)
  const [totalUnpaidBills, setTotalUnpaidBills] = useState(0)
  const [pendingPaymentCount, setPendingPaymentCount] = useState(0)
  const [pendingPaymentAmount, setPendingPaymentAmount] = useState(0)
  const [todayAuditLogs, setTodayAuditLogs] = useState(0)
  const [nextUserDuty, setNextUserDuty] = useState<{ date?: string; task?: string } | null>(null)
  const [gallonStock, setGallonStock] = useState<number>(0)
  const [cashBalance, setCashBalance] = useState<number>(0)
  const [statements, setStatements] = useState<FinancialStatements | null>(null)
  const [loading, setLoading] = useState(true)
  const [accountingLoading, setAccountingLoading] = useState(true)

  const fetchDashboardData = useCallback(async () => {
    setLoading(true)
    try {
      const fetchUsers = async () => {
        if (activeRole !== 'super admin') return
        const { data: usersData } = await spreadsheetApi.get('Users')
        if (usersData && Array.isArray(usersData)) {
          setTotalUsers(usersData.filter(u => u.status === 'Aktif').length)
          const rooms = new Set(usersData.map(u => u.room_number).filter(r => r))
          setTotalRooms(rooms.size)
        }
      }

      const fetchBills = async () => {
        const { data: billsData } = await spreadsheetApi.get('Bills')
        if (billsData && Array.isArray(billsData)) {
          if (activeRole === 'admin' || activeRole === 'super admin') {
            const unpaid = billsData.filter(b => {
              const status = String(b.status || '').toLowerCase()
              return ['unpaid', 'pending', 'rejected', 'belum bayar'].includes(status)
            })
            const totalUnpaid = unpaid.reduce((sum, b) => sum + (Number(b.amount) || 0), 0)
            setUnpaidBills(totalUnpaid)
            setTotalUnpaidBills(unpaid.length)
          }
          if (activeRole === 'user') {
            const myUnpaid = billsData.filter(b => (b.resident_email === profile?.email || b.resident_name === profile?.full_name) && b.status === 'unpaid')
            const myTotal = myUnpaid.reduce((sum, b) => sum + (Number(b.amount) || 0), 0)
            setMyUnpaidAmount(myTotal)
          }
        }
      }

      const fetchGallons = async () => {
        if (activeRole !== 'admin') return
        const [gallonsRes, journalRes] = await Promise.all([
          spreadsheetApi.get('Gallons'),
          spreadsheetApi.get('JournalEntries'),
        ])
        if (gallonsRes.data && Array.isArray(gallonsRes.data)) {
          setGallonStock(calculateGallonStock({
            gallonRows: gallonsRes.data,
            journalEntries: Array.isArray(journalRes.data) ? journalRes.data : [],
          }).stock)
        }
      }

      const fetchAccounting = async () => {
        if (activeRole !== 'admin' && activeRole !== 'super admin' && activeRole !== 'user') return

        setAccountingLoading(true)

        if (activeRole === 'user') {
          const summary = await getResidentCashSnapshot()
          setCashBalance(summary.balance)
          setStatements(defaultEngine.getFinancialStatements())
          setAccountingLoading(false)
          return
        }

        const currentStatements = defaultEngine.getFinancialStatements()
        setStatements(currentStatements)
        
        await syncAccountingWithSheet()
        
        let balance = 0
        const entries = defaultEngine.journal.getEntries()
        entries.forEach(entry => {
          entry.debits.forEach(d => {
            if (d.accountNumber.startsWith('110')) balance += Number(d.amount)
          })
          entry.credits.forEach(c => {
            if (c.accountNumber.startsWith('110')) balance -= Number(c.amount)
          })
        })
        setCashBalance(balance)
        setStatements(defaultEngine.getFinancialStatements())
        setAccountingLoading(false)
      }

      const fetchPaymentVerifications = async () => {
        if (activeRole !== 'super admin') return

        const { data: paymentsData } = await spreadsheetApi.get('Payments')
        if (paymentsData && Array.isArray(paymentsData)) {
          const pending = paymentsData.filter(p => p.status === 'Menunggu Verifikasi' || p.status === 'pending_verification')
          setPendingPaymentCount(pending.length)
          setPendingPaymentAmount(pending.reduce((sum, p) => sum + (Number(p.amount) || 0), 0))
        } else {
          setPendingPaymentCount(0)
          setPendingPaymentAmount(0)
        }
      }

      const fetchAuditLogs = async () => {
        if (activeRole !== 'super admin') return

        const { data: auditData } = await spreadsheetApi.get('AuditLogs')
        if (auditData && Array.isArray(auditData)) {
          const now = new Date()
          const todayCount = auditData.filter(log => {
            const createdAt = log.created_at ? new Date(log.created_at) : null
            return createdAt && !Number.isNaN(createdAt.getTime()) &&
              createdAt.getFullYear() === now.getFullYear() &&
              createdAt.getMonth() === now.getMonth() &&
              createdAt.getDate() === now.getDate()
          }).length
          setTodayAuditLogs(todayCount)
        } else {
          setTodayAuditLogs(0)
        }
      }

      const fetchUserSchedule = async () => {
        if (activeRole !== 'user' || !profile?.id) return

        const { data: scheduleData } = await spreadsheetApi.get('Schedules')
        if (scheduleData && Array.isArray(scheduleData)) {
          const userIdentifier = profile.nickname || profile.full_name?.split(' ')[0] || ''
          const activeSchedules = scheduleData
            .filter(s => {
              const belongsToUser = String(s.user_id) === String(profile.id) || Boolean(userIdentifier && s.user?.includes(userIdentifier))
              return belongsToUser && String(s.status || '').toLowerCase() !== 'selesai'
            })
            .sort((a, b) => new Date(a.date || '').getTime() - new Date(b.date || '').getTime())

          setNextUserDuty(activeSchedules[0] ? { date: activeSchedules[0].date, task: activeSchedules[0].task } : null)
        } else {
          setNextUserDuty(null)
        }
      }

      await Promise.all([
        fetchUsers(),
        fetchBills(),
        fetchGallons(),
        fetchAccounting(),
        fetchPaymentVerifications(),
        fetchAuditLogs(),
        fetchUserSchedule()
      ])

    } catch (err) {
      console.error("Dashboard Fetch Error:", err)
      setAccountingLoading(false)
    } finally {
      setLoading(false)
    }
  }, [activeRole, profile])

  useEffect(() => {
    if (profile) fetchDashboardData()
  }, [fetchDashboardData, profile])

  useEffect(() => {
    if (!profile || !activeRole) return

    if (sessionStorage.getItem('soematra_show_welcome_modal') === '1') {
      setIsWelcomeModalOpen(true)
      sessionStorage.removeItem('soematra_show_welcome_modal')
    }
  }, [profile, activeRole])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)
  }

  const formatFinancialValue = (value?: number) => {
    if (accountingLoading || value === undefined || value === null) return '...'
    return formatCurrency(value)
  }

  const getRoleLabel = () => {
    if (activeRole === 'super admin') return 'Super Admin'
    if (activeRole === 'admin') return 'Admin'
    return 'Warga'
  }

  const getWelcomeMessage = () => {
    if (activeRole === 'super admin') return 'Pantau dan atur seluruh aktivitas sistem dari sini.'
    if (activeRole === 'admin') return 'Kelola operasional kos, iuran, dan kebutuhan galon.'
    return 'Jangan lupa cek tagihan dan jadwal piket Anda.'
  }

  const closeWelcomeModal = () => setIsWelcomeModalOpen(false)

  // Render Dashboard Khusus Super Admin
  const renderSuperAdminDashboard = () => (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
      <DashboardMetricCard
        actionLabel="Kelola Pengguna"
        actionTo="/dashboard/warga"
        eyebrow="Data Penghuni"
        icon={Users}
        title="Total Pengguna Aktif"
        tone="blue"
        value={loading ? '...' : `${totalUsers} Orang`}
      />

      <DashboardMetricCard
        actionLabel="Lihat Audit Log"
        actionTo="/dashboard/audit"
        badge={todayAuditLogs > 0 ? 'Baru' : undefined}
        eyebrow="Audit Sistem"
        icon={Activity}
        title="Log Sistem Hari Ini"
        tone="amber"
        value={loading ? '...' : `${todayAuditLogs} Aktivitas`}
      />

      <DashboardMetricCard
        actionLabel="Buka Daftar Tagihan"
        actionTo="/dashboard/billing?tab=bills"
        badge={totalUnpaidBills > 0 ? 'Perlu Ditagih' : undefined}
        eyebrow="Penagihan"
        icon={ReceiptText}
        note={loading ? '...' : formatCurrency(unpaidBills)}
        title="Tagihan Belum Tuntas"
        tone="rose"
        value={loading ? '...' : `${totalUnpaidBills} Tagihan`}
      />

      <DashboardMetricCard
        actionLabel="Buka Verifikasi Bayar"
        actionTo="/dashboard/billing?tab=verification"
        badge={pendingPaymentCount > 0 ? 'Antrean' : undefined}
        eyebrow="Verifikasi"
        icon={SearchCheck}
        note={loading ? '...' : formatCurrency(pendingPaymentAmount)}
        title="Pembayaran Menunggu Verifikasi"
        tone="emerald"
        value={loading ? '...' : `${pendingPaymentCount} Pembayaran`}
      />

      <div className="md:col-span-2">
        <FinancialChart />
      </div>
    </div>
  )

  // Render Dashboard Khusus Admin/Bendahara
  const renderAdminDashboard = () => (
    <div className="space-y-6">
      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">Ringkasan Keuangan</h3>
            <p className="text-xs text-text-secondary mt-1">Snapshot neraca dan laba rugi dari jurnal akuntansi tersinkron.</p>
          </div>
          <span className={`inline-flex w-fit items-center rounded-full px-3 py-1.5 text-xs font-semibold ${accountingLoading ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
            {accountingLoading ? 'Mensinkronisasi data' : 'Data terbaru'}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="relative min-h-[160px] sm:min-h-[220px] overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-white via-white to-emerald-50/80 p-4 sm:p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
            <div className="absolute right-0 top-0 h-20 w-20 sm:h-24 sm:w-24 bg-emerald-100/60 blur-2xl" />
            <div className="relative flex h-full flex-col justify-between gap-3 sm:gap-6">
              <div className="flex items-start justify-between gap-2 sm:gap-4">
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wide text-emerald-700">Posisi Aset</p>
                  <h4 className="mt-1 sm:mt-2 text-sm sm:text-base font-semibold text-gray-900">Total Aset (Harta)</h4>
                </div>
                <div className="flex h-9 w-9 sm:h-12 sm:w-12 flex-shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-emerald-100 text-emerald-700">
                  <Landmark className="h-4.5 w-4.5 sm:h-6 sm:w-6" />
                </div>
              </div>
              <div>
                <p className="break-words text-2xl font-black tracking-tight text-gray-950 sm:text-4xl">
                  {formatFinancialValue(statements?.balanceSheet.assets.totalAssets)}
                </p>
                <div className="mt-4 sm:mt-7 grid grid-cols-2 gap-3 border-t border-emerald-100 pt-3 sm:pt-5 text-xs sm:text-sm">
                  <div>
                    <p className="text-text-secondary">Kas Lancar</p>
                    <p className="mt-1 font-bold text-gray-900">{formatFinancialValue(statements?.balanceSheet.assets.currentAssets)}</p>
                  </div>
                  <div>
                    <p className="text-text-secondary">Total Aset</p>
                    <p className="mt-1 font-bold text-gray-900">{formatFinancialValue(statements?.balanceSheet.assets.totalAssets)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="relative min-h-[160px] sm:min-h-[220px] overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-white via-white to-blue-50/80 p-4 sm:p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
            <div className="absolute right-0 top-0 h-20 w-20 sm:h-24 sm:w-24 bg-blue-100/70 blur-2xl" />
            <div className="relative flex h-full flex-col justify-between gap-3 sm:gap-6">
              <div className="flex items-start justify-between gap-2 sm:gap-4">
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wide text-blue-700">Kinerja Periode</p>
                  <h4 className="mt-1 sm:mt-2 text-sm sm:text-base font-semibold text-gray-900">Laba Bersih</h4>
                </div>
                <div className="flex h-9 w-9 sm:h-12 sm:w-12 flex-shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-blue-100 text-blue-700">
                  <ArrowUpRight className="h-4.5 w-4.5 sm:h-6 sm:w-6" />
                </div>
              </div>
              <div>
                <p className="break-words text-2xl font-black tracking-tight text-gray-950 sm:text-4xl">
                  {formatFinancialValue(statements?.incomeStatement.netIncome)}
                </p>
                <div className="mt-4 sm:mt-8 grid grid-cols-2 gap-3 border-t border-blue-100 pt-3 sm:pt-5 text-xs sm:text-sm">
                  <div>
                    <p className="text-text-secondary">Pendapatan</p>
                    <p className="mt-1 font-bold text-gray-900">{formatFinancialValue(statements?.incomeStatement.revenues)}</p>
                  </div>
                  <div>
                    <p className="text-text-secondary">Beban</p>
                    <p className="mt-1 font-bold text-gray-900">{formatFinancialValue(statements?.incomeStatement.expenses)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="relative min-h-[160px] sm:min-h-[220px] overflow-hidden rounded-2xl border border-orange-100 bg-gradient-to-br from-white via-white to-orange-50/80 p-4 sm:p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
            <div className="absolute right-0 top-0 h-20 w-20 sm:h-24 sm:w-24 bg-orange-100/70 blur-2xl" />
            <div className="relative flex h-full flex-col justify-between gap-3 sm:gap-6">
              <div className="flex items-start justify-between gap-2 sm:gap-4">
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wide text-orange-700">Struktur Modal</p>
                  <h4 className="mt-1 sm:mt-2 text-sm sm:text-base font-semibold text-gray-900">Kewajiban & Ekuitas</h4>
                </div>
                <div className="flex h-9 w-9 sm:h-12 sm:w-12 flex-shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-orange-100 text-orange-700">
                  <Building2 className="h-4.5 w-4.5 sm:h-6 sm:w-6" />
                </div>
              </div>
              <div>
                <p className="break-words text-2xl font-black tracking-tight text-gray-950 sm:text-4xl">
                  {formatFinancialValue(statements?.balanceSheet.totalLiabilitiesAndEquity)}
                </p>
                <div className="mt-4 sm:mt-8 grid grid-cols-2 gap-3 border-t border-orange-100 pt-3 sm:pt-5 text-xs sm:text-sm">
                  <div>
                    <p className="text-text-secondary">Hutang</p>
                    <p className="mt-1 font-bold text-gray-900">{formatFinancialValue(statements?.balanceSheet.liabilities.totalLiabilities)}</p>
                  </div>
                  <div>
                    <p className="text-text-secondary">Modal</p>
                    <p className="mt-1 font-bold text-gray-900">{formatFinancialValue(statements?.balanceSheet.equity.totalEquity)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-sky-100 bg-gradient-to-r from-sky-50 to-indigo-50 p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-blue-950">Persamaan Dasar Akuntansi</h3>
              <p className="mt-1 text-[11px] sm:text-xs leading-relaxed text-blue-800">
                Total Aset {formatFinancialValue(statements?.balanceSheet.assets.totalAssets)} harus sama dengan Kewajiban & Modal {formatFinancialValue(statements?.balanceSheet.totalLiabilitiesAndEquity)}.
              </p>
            </div>
            <span className="inline-flex w-fit items-center rounded-full bg-white px-3 py-1.5 text-xs font-bold text-blue-800 shadow-sm ring-1 ring-blue-100">
              Aset = Kewajiban + Modal
            </span>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">Ringkasan Operasional</h3>
            <p className="text-xs text-text-secondary mt-1">Pantauan cepat kas, penagihan, dan stok galon yang perlu ditindaklanjuti.</p>
          </div>
          <span className="inline-flex w-fit items-center rounded-full border border-gray-100 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 shadow-sm">
            Operasional hari ini
          </span>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="relative min-h-[160px] sm:min-h-[220px] overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-white via-white to-emerald-50/80 p-4 sm:p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
            <div className="absolute right-0 top-0 h-20 w-20 sm:h-24 sm:w-24 bg-emerald-100/60 blur-2xl" />
            <div className="relative flex h-full flex-col justify-between gap-3 sm:gap-6">
              <div className="flex items-start justify-between gap-2 sm:gap-4">
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wide text-emerald-700">Kas Operasional</p>
                  <h4 className="mt-1 sm:mt-2 text-sm sm:text-base font-semibold text-gray-900">Saldo Kas Aktif</h4>
                </div>
                <div className="flex h-9 w-9 sm:h-12 sm:w-12 flex-shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-emerald-100 text-emerald-700">
                  <ArrowDownCircle className="h-4.5 w-4.5 sm:h-6 sm:w-6" />
                </div>
              </div>
              <div>
                <p className="break-words text-2xl font-black tracking-tight text-gray-950 sm:text-4xl">
                  {loading ? '...' : formatCurrency(cashBalance)}
                </p>
                <div className="mt-4 sm:mt-8 border-t border-emerald-100 pt-3 sm:pt-5">
                  <Link to="/dashboard/finance" className="inline-flex items-center text-xs sm:text-sm font-bold text-gray-900 hover:text-emerald-700">
                    Cek Mutasi <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="relative min-h-[160px] sm:min-h-[220px] overflow-hidden rounded-2xl border border-rose-100 bg-gradient-to-br from-white via-white to-rose-50/80 p-4 sm:p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
            <div className="absolute right-0 top-0 h-20 w-20 sm:h-24 sm:w-24 bg-rose-100/70 blur-2xl" />
            <div className="relative flex h-full flex-col justify-between gap-3 sm:gap-6">
              <div className="flex items-start justify-between gap-2 sm:gap-4">
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wide text-rose-700">Penagihan</p>
                  <h4 className="mt-1 sm:mt-2 text-sm sm:text-base font-semibold text-gray-900">Total Iuran Pending</h4>
                </div>
                <div className="flex h-9 w-9 sm:h-12 sm:w-12 flex-shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-rose-100 text-rose-700">
                  <ReceiptText className="h-4.5 w-4.5 sm:h-6 sm:w-6" />
                </div>
              </div>
              <div>
                <p className="break-words text-2xl font-black tracking-tight text-gray-950 sm:text-4xl">
                  {loading ? '...' : formatCurrency(unpaidBills)}
                </p>
                <div className="mt-4 sm:mt-8 border-t border-rose-100 pt-3 sm:pt-5">
                  <Link to="/dashboard/billing?tab=reminders" className="inline-flex items-center text-xs sm:text-sm font-bold text-gray-900 hover:text-rose-700">
                    Kirim Reminder <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="relative min-h-[160px] sm:min-h-[220px] overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-white via-white to-blue-50/80 p-4 sm:p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
            <div className="absolute right-0 top-0 h-20 w-20 sm:h-24 sm:w-24 bg-blue-100/70 blur-2xl" />
            <div className="relative flex h-full flex-col justify-between gap-3 sm:gap-6">
              <div className="flex items-start justify-between gap-2 sm:gap-4">
                <div className="min-w-0">
                  <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wide text-blue-700">Sistem Galon</p>
                  <h4 className="mt-1 sm:mt-2 text-sm sm:text-base font-semibold text-gray-900">Status Stok Galon</h4>
                </div>
                <div className="flex h-9 w-9 sm:h-12 sm:w-12 flex-shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-blue-100 text-blue-700">
                  <Droplets className="h-4.5 w-4.5 sm:h-6 sm:w-6" />
                </div>
              </div>
              <div>
                <p className="break-words text-2xl font-black tracking-tight text-gray-950 sm:text-4xl">
                  {loading ? '...' : `Sisa ${formatGallonQuantity(gallonStock)} Galon`}
                </p>
                <div className="mt-4 sm:mt-8 border-t border-blue-100 pt-3 sm:pt-5">
                  <Link to="/dashboard/gallons-management" className="inline-flex items-center text-xs sm:text-sm font-bold text-gray-900 hover:text-blue-700">
                    Tracker Galon <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="md:col-span-3">
        <FinancialChart />
      </div>
    </div>
  )

  // Render Dashboard Khusus User/Penghuni
  const renderUserDashboard = () => (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      <DashboardMetricCard
        actionLabel="Bayar Sekarang"
        actionTo="/dashboard/billing-user?tab=confirm"
        badge={myUnpaidAmount > 0 ? 'Ada Tagihan' : undefined}
        eyebrow="Pembayaran"
        icon={WalletCards}
        title="Tagihan Anda"
        tone="rose"
        value={loading ? '...' : formatCurrency(myUnpaidAmount)}
      />

      <DashboardMetricCard
        actionLabel="Konfirmasi Piket"
        actionTo="/dashboard/duties-mine"
        badge={nextUserDuty ? 'Aktif' : undefined}
        eyebrow="Kalender Kos"
        icon={CalendarCheck}
        note={nextUserDuty?.task}
        title="Jadwal Piket Galon"
        tone="blue"
        value={loading ? '...' : nextUserDuty?.date ? new Date(nextUserDuty.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Tidak Ada'}
      />

      <DashboardMetricCard
        actionLabel="Lihat Kas Kos"
        actionTo="/dashboard/cash-reports"
        eyebrow="Transparansi Kas"
        icon={Activity}
        title="Laporan Kas Bersama"
        tone="emerald"
        value={loading ? '...' : formatCurrency(cashBalance)}
      />

      <div className="lg:col-span-3">
        <UserActivityChart />
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight flex items-center">
            <LayoutDashboard className="mr-2 sm:mr-3 text-primary w-6 h-6 sm:w-8 sm:h-8" />
            Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">Ringkasan operasional dan keuangan kos hari ini.</p>
        </div>
      </div>
      
      <QuickActions onOpenTransaction={() => setIsTransactionModalOpen(true)} />

      {/* Render Specific Dashboard Cards Based on Role */}
      {activeRole === 'super admin' && renderSuperAdminDashboard()}
      {activeRole === 'admin' && renderAdminDashboard()}
      {activeRole === 'user' && renderUserDashboard()}

      <JournalEntryModal 
        isOpen={isTransactionModalOpen} 
        onClose={() => setIsTransactionModalOpen(false)} 
        onSuccess={fetchDashboardData}
      />

      {isWelcomeModalOpen && createPortal(
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-gray-950/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="welcome-modal-title"
          onMouseDown={closeWelcomeModal}
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-2xl shadow-gray-900/20"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="relative bg-gradient-to-br from-[#ECFDF5] via-white to-white p-6 sm:p-8">
              <button
                type="button"
                onClick={closeWelcomeModal}
                className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-white hover:text-gray-700"
                aria-label="Tutup dialog selamat datang"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                <Activity className="h-6 w-6" />
              </div>

              <h2 id="welcome-modal-title" className="pr-8 text-xl sm:text-2xl font-bold tracking-tight text-gray-950">
                Selamat datang, {profile?.full_name || 'Pengguna'}!
              </h2>
              <p className="mt-3 text-xs sm:text-sm leading-6 text-gray-600">
                Anda login sebagai <span className="font-semibold text-emerald-700">{getRoleLabel()}</span>. {getWelcomeMessage()}
              </p>
            </div>

            <div className="flex justify-end border-t border-gray-100 bg-white px-6 py-4">
              <button
                type="button"
                onClick={closeWelcomeModal}
                className="btn-primary min-w-28"
              >
                Mulai
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
