import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { spreadsheetApi } from '@/lib/spreadsheet'
import { WalletCards, CalendarCheck, Droplets, ArrowRight, Building2, Users, Activity, ReceiptText, ArrowDownCircle, SearchCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { QuickActions } from '@/components/dashboard/QuickActions'
import { FinancialChart } from '@/components/dashboard/FinancialChart'
import { Landmark, Wallet, ArrowUpRight } from 'lucide-react'
import { defaultEngine, syncAccountingWithSheet } from '@/lib/accounting'
import { mergeAccounts } from '@/lib/chartOfAccounts'
import type { FinancialStatements } from '@/lib/accounting'
import { UserActivityChart } from '@/components/dashboard/UserActivityChart'
import JournalEntryModal from '@/components/accounting/JournalEntryModal'
import { GALLON_CAPACITY, calculateGallonStock, formatGallonQuantity } from '@/lib/gallonStock'

interface JournalLine {
  accountNumber: string
  amount: number
}

export default function Dashboard() {
  const { profile, activeRole } = useAuth()
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false)
  
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

  async function fetchDashboardData() {
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
  }

  useEffect(() => {
    if (profile) fetchDashboardData()
  }, [profile, activeRole])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)
  }

  const formatFinancialValue = (value?: number) => {
    if (accountingLoading || value === undefined || value === null) return '...'
    return formatCurrency(value)
  }

  // Render Dashboard Khusus Super Admin
  const renderSuperAdminDashboard = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div className="card-container flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <h3 className="text-text-secondary text-sm font-medium">Total Pengguna Aktif</h3>
          <p className="text-2xl font-bold mt-1 text-gray-900">
            {loading ? '...' : `${totalUsers} Orang`}
          </p>
        </div>
        <Link to="/dashboard/users" className="text-sm font-semibold text-[#10B981] hover:text-[#047857] mt-4 flex items-center">
          Kelola Pengguna <ArrowRight className="w-4 h-4 ml-1" />
        </Link>
      </div>

      <Link to="/dashboard/audit" className="card-container flex flex-col justify-between transition-all hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-0">
        <div>
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
              <Activity className="w-5 h-5 text-amber-600" />
            </div>
            {todayAuditLogs > 0 && <span className="badge badge-warning">Baru</span>}
          </div>
          <h3 className="text-text-secondary text-sm font-medium">Log Sistem Hari Ini</h3>
          <p className="text-2xl font-bold mt-1 text-gray-900">
            {loading ? '...' : `${todayAuditLogs} Aktivitas`}
          </p>
        </div>
        <span className="text-sm font-semibold text-[#10B981] mt-4 flex items-center">
          Lihat Audit Log <ArrowRight className="w-4 h-4 ml-1" />
        </span>
      </Link>

      <Link to="/dashboard/billing?tab=bills" className="card-container flex flex-col justify-between transition-all hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-0">
        <div>
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
              <ReceiptText className="w-5 h-5 text-red-600" />
            </div>
            {totalUnpaidBills > 0 && <span className="badge badge-danger">Perlu Ditagih</span>}
          </div>
          <h3 className="text-text-secondary text-sm font-medium">Tagihan Belum Tuntas</h3>
          <p className="text-2xl font-bold mt-1 text-gray-900">
            {loading ? '...' : `${totalUnpaidBills} Tagihan`}
          </p>
          <p className="text-sm text-text-secondary mt-2">{loading ? '...' : formatCurrency(unpaidBills)}</p>
        </div>
        <span className="text-sm font-semibold text-[#10B981] mt-4 flex items-center">
          Buka Daftar Tagihan <ArrowRight className="w-4 h-4 ml-1" />
        </span>
      </Link>

      <Link to="/dashboard/billing?tab=verification" className="card-container flex flex-col justify-between transition-all hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-0">
        <div>
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
              <SearchCheck className="w-5 h-5 text-blue-600" />
            </div>
            {pendingPaymentCount > 0 && <span className="badge badge-info">Antrean</span>}
          </div>
          <h3 className="text-text-secondary text-sm font-medium">Pembayaran Menunggu Verifikasi</h3>
          <p className="text-2xl font-bold mt-1 text-gray-900">
            {loading ? '...' : `${pendingPaymentCount} Pembayaran`}
          </p>
          <p className="text-sm text-text-secondary mt-2">{loading ? '...' : formatCurrency(pendingPaymentAmount)}</p>
        </div>
        <span className="text-sm font-semibold text-[#10B981] mt-4 flex items-center">
          Buka Verifikasi Bayar <ArrowRight className="w-4 h-4 ml-1" />
        </span>
      </Link>

      <div className="md:col-span-3">
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
            <h3 className="text-2xl font-bold text-gray-900 tracking-tight">Ringkasan Keuangan</h3>
            <p className="text-sm text-text-secondary mt-1">Snapshot neraca dan laba rugi dari jurnal akuntansi tersinkron.</p>
          </div>
          <span className={`inline-flex w-fit items-center rounded-full px-3 py-1.5 text-xs font-semibold ${accountingLoading ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
            {accountingLoading ? 'Mensinkronisasi data' : 'Data terbaru'}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="relative min-h-[220px] overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-white via-white to-emerald-50/80 p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
            <div className="absolute right-0 top-0 h-24 w-24 bg-emerald-100/60 blur-2xl" />
            <div className="relative flex h-full flex-col justify-between gap-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Posisi Aset</p>
                  <h4 className="mt-2 text-base font-semibold text-gray-900">Total Aset (Harta)</h4>
                </div>
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                  <Landmark className="h-6 w-6" />
                </div>
              </div>
              <div>
                <p className="break-words text-3xl font-black tracking-tight text-gray-950 sm:text-4xl">
                  {formatFinancialValue(statements?.balanceSheet.assets.totalAssets)}
                </p>
                <div className="mt-7 grid grid-cols-2 gap-3 border-t border-emerald-100 pt-5 text-sm">
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

          <div className="relative min-h-[220px] overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-white via-white to-blue-50/80 p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
            <div className="absolute right-0 top-0 h-24 w-24 bg-blue-100/70 blur-2xl" />
            <div className="relative flex h-full flex-col justify-between gap-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wide text-blue-700">Kinerja Periode</p>
                  <h4 className="mt-2 text-base font-semibold text-gray-900">Laba Bersih</h4>
                </div>
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                  <ArrowUpRight className="h-6 w-6" />
                </div>
              </div>
              <div>
                <p className="break-words text-3xl font-black tracking-tight text-gray-950 sm:text-4xl">
                  {formatFinancialValue(statements?.incomeStatement.netIncome)}
                </p>
                <div className="mt-8 grid grid-cols-2 gap-3 border-t border-blue-100 pt-5 text-sm">
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

          <div className="relative min-h-[220px] overflow-hidden rounded-2xl border border-orange-100 bg-gradient-to-br from-white via-white to-orange-50/80 p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
            <div className="absolute right-0 top-0 h-24 w-24 bg-orange-100/70 blur-2xl" />
            <div className="relative flex h-full flex-col justify-between gap-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wide text-orange-700">Struktur Modal</p>
                  <h4 className="mt-2 text-base font-semibold text-gray-900">Kewajiban & Ekuitas</h4>
                </div>
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-orange-100 text-orange-700">
                  <Building2 className="h-6 w-6" />
                </div>
              </div>
              <div>
                <p className="break-words text-3xl font-black tracking-tight text-gray-950 sm:text-4xl">
                  {formatFinancialValue(statements?.balanceSheet.totalLiabilitiesAndEquity)}
                </p>
                <div className="mt-8 grid grid-cols-2 gap-3 border-t border-orange-100 pt-5 text-sm">
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
              <h3 className="font-bold text-blue-950">Persamaan Dasar Akuntansi</h3>
              <p className="mt-1 text-sm leading-relaxed text-blue-800">
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
            <h3 className="text-2xl font-bold text-gray-900 tracking-tight">Ringkasan Operasional</h3>
            <p className="text-sm text-text-secondary mt-1">Pantauan cepat kas, penagihan, dan stok galon yang perlu ditindaklanjuti.</p>
          </div>
          <span className="inline-flex w-fit items-center rounded-full border border-gray-100 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 shadow-sm">
            Operasional hari ini
          </span>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="relative min-h-[220px] overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-white via-white to-emerald-50/80 p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
            <div className="absolute right-0 top-0 h-24 w-24 bg-emerald-100/60 blur-2xl" />
            <div className="relative flex h-full flex-col justify-between gap-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Kas Operasional</p>
                  <h4 className="mt-2 text-base font-semibold text-gray-900">Saldo Kas Aktif</h4>
                </div>
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                  <ArrowDownCircle className="h-6 w-6" />
                </div>
              </div>
              <div>
                <p className="break-words text-3xl font-black tracking-tight text-gray-950 sm:text-4xl">
                  {loading ? '...' : formatCurrency(cashBalance)}
                </p>
                <div className="mt-8 border-t border-emerald-100 pt-5">
                  <Link to="/dashboard/finance" className="inline-flex items-center text-sm font-bold text-gray-900 hover:text-emerald-700">
                    Cek Mutasi <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="relative min-h-[220px] overflow-hidden rounded-2xl border border-rose-100 bg-gradient-to-br from-white via-white to-rose-50/80 p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
            <div className="absolute right-0 top-0 h-24 w-24 bg-rose-100/70 blur-2xl" />
            <div className="relative flex h-full flex-col justify-between gap-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wide text-rose-700">Penagihan</p>
                  <h4 className="mt-2 text-base font-semibold text-gray-900">Total Iuran Pending</h4>
                </div>
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-700">
                  <ReceiptText className="h-6 w-6" />
                </div>
              </div>
              <div>
                <p className="break-words text-3xl font-black tracking-tight text-gray-950 sm:text-4xl">
                  {loading ? '...' : formatCurrency(unpaidBills)}
                </p>
                <div className="mt-8 border-t border-rose-100 pt-5">
                  <Link to="/dashboard/billing?tab=reminders" className="inline-flex items-center text-sm font-bold text-gray-900 hover:text-rose-700">
                    Kirim Reminder <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="relative min-h-[220px] overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-white via-white to-blue-50/80 p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
            <div className="absolute right-0 top-0 h-24 w-24 bg-blue-100/70 blur-2xl" />
            <div className="relative flex h-full flex-col justify-between gap-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wide text-blue-700">Sistem Galon</p>
                  <h4 className="mt-2 text-base font-semibold text-gray-900">Status Stok Galon</h4>
                </div>
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                  <Droplets className="h-6 w-6" />
                </div>
              </div>
              <div>
                <p className="break-words text-3xl font-black tracking-tight text-gray-950 sm:text-4xl">
                  {loading ? '...' : `Sisa ${formatGallonQuantity(gallonStock)} Galon`}
                </p>
                <div className="mt-8 border-t border-blue-100 pt-5">
                  <Link to="/dashboard/gallons-management" className="inline-flex items-center text-sm font-bold text-gray-900 hover:text-blue-700">
                    Tracker Galon <ArrowRight className="ml-1 h-4 w-4" />
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div className="card-container flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
              <WalletCards className="w-5 h-5 text-red-600" />
            </div>
            {myUnpaidAmount > 0 && <span className="badge badge-danger">Ada Tagihan</span>}
          </div>
          <h3 className="text-text-secondary text-sm font-medium">Tagihan Anda</h3>
          <p className="text-2xl font-bold mt-1 text-gray-900">
            {loading ? '...' : formatCurrency(myUnpaidAmount)}
          </p>
        </div>
        <Link to="/dashboard/billing-user?tab=confirm" className="text-sm font-semibold text-[#10B981] hover:text-[#047857] mt-4 flex items-center">
          Bayar Sekarang <ArrowRight className="w-4 h-4 ml-1" />
        </Link>
      </div>

      <div className="card-container flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
              <CalendarCheck className="w-5 h-5 text-blue-600" />
            </div>
            {nextUserDuty && <span className="badge badge-info">Aktif</span>}
          </div>
          <h3 className="text-text-secondary text-sm font-medium">Jadwal Piket Galon</h3>
          <p className="text-2xl font-bold mt-1 text-gray-900">
            {loading ? '...' : nextUserDuty?.date ? new Date(nextUserDuty.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Tidak Ada'}
          </p>
          {nextUserDuty?.task && <p className="text-sm text-text-secondary mt-1">{nextUserDuty.task}</p>}
        </div>
        <Link to="/dashboard/duties-mine" className="text-sm font-semibold text-[#10B981] hover:text-[#047857] mt-4 flex items-center">
          Konfirmasi Piket <ArrowRight className="w-4 h-4 ml-1" />
        </Link>
      </div>

      <div className="card-container flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-full bg-[#ECFDF5] flex items-center justify-center">
              <Activity className="w-5 h-5 text-[#10B981]" />
            </div>
          </div>
          <h3 className="text-text-secondary text-sm font-medium">Laporan Kas Bersama</h3>
          <p className="text-2xl font-bold mt-1 text-gray-900">
            {loading ? '...' : formatCurrency(cashBalance)}
          </p>
        </div>
        <Link to="/dashboard/cash-reports" className="text-sm font-semibold text-[#10B981] hover:text-[#047857] mt-4 flex items-center">
          Lihat Kas Kos <ArrowRight className="w-4 h-4 ml-1" />
        </Link>
      </div>

      <div className="md:col-span-3">
        <UserActivityChart />
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
          <p className="text-text-secondary mt-1">Ringkasan operasional dan keuangan kos hari ini.</p>
        </div>
      </div>
      
      {/* Greeting Card with Soft Gradient */}
      <div className="rounded-[20px] bg-gradient-to-br from-[#ECFDF5] to-white border border-[#D1FAE5] p-6 sm:p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-[#047857] mb-2">
          Selamat datang, {profile?.full_name || 'Pengguna'}!
        </h2>
        <p className="text-gray-600">
          Anda login sebagai <span className="font-semibold text-[#10B981] capitalize">{activeRole || 'user'}</span>. 
          {activeRole === 'super admin' && ' Pantau dan atur seluruh aktivitas sistem dari sini.'}
          {activeRole === 'admin' && ' Kelola operasional kos, iuran, dan kebutuhan galon.'}
          {activeRole === 'user' && ' Jangan lupa cek tagihan dan jadwal piket Anda.'}
        </p>
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
    </div>
  )
}
