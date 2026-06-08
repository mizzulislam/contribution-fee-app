import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { spreadsheetApi } from '@/lib/spreadsheet'
import { WalletCards, CalendarCheck, Droplets, ArrowRight, Building2, Users, Activity, ReceiptText, ArrowDownCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { QuickActions } from '@/components/dashboard/QuickActions'
import { FinancialChart } from '@/components/dashboard/FinancialChart'
import { Landmark, Wallet, ArrowUpRight } from 'lucide-react'
import { defaultEngine } from '@/lib/accounting'
import { mergeAccounts } from '@/lib/chartOfAccounts'
import type { FinancialStatements } from '@/lib/accounting'
import { UserActivityChart } from '@/components/dashboard/UserActivityChart'
import JournalEntryModal from '@/components/accounting/JournalEntryModal'

export default function Dashboard() {
  const { profile, activeRole } = useAuth()
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false)
  
  // Dashboard Data States
  const [totalUsers, setTotalUsers] = useState(0)
  const [unpaidBills, setUnpaidBills] = useState(0)
  const [myUnpaidAmount, setMyUnpaidAmount] = useState(0)
  const [gallonStock, setGallonStock] = useState(0)
  const [cashBalance, setCashBalance] = useState(0)
  const [statements, setStatements] = useState<FinancialStatements | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile) fetchDashboardData()
  }, [profile])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const fetchUsers = async () => {
        if (activeRole !== 'super admin') return
        const { data: usersData } = await spreadsheetApi.get('Users')
        if (usersData && Array.isArray(usersData)) {
          setTotalUsers(usersData.filter(u => u.status === 'Aktif').length)
        }
      }

      const fetchBills = async () => {
        const { data: billsData } = await spreadsheetApi.get('Bills')
        if (billsData && Array.isArray(billsData)) {
          if (activeRole === 'admin' || activeRole === 'super admin') {
            const unpaid = billsData.filter(b => b.status === 'unpaid')
            const totalUnpaid = unpaid.reduce((sum, b) => sum + (Number(b.amount) || 0), 0)
            setUnpaidBills(totalUnpaid)
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
        const { data: gallonsData } = await spreadsheetApi.get('Gallons')
        if (gallonsData && Array.isArray(gallonsData)) {
          let stock = 0
          gallonsData.forEach(g => {
            if (g.type === 'Pembelian') stock += Number(g.quantity)
            if (g.type === 'Penggunaan') stock -= Number(g.quantity)
          })
          setGallonStock(stock)
        }
      }

      const fetchAccounting = async () => {
        if (activeRole !== 'admin' && activeRole !== 'super admin') return
        
        const [coaRes, journalRes] = await Promise.all([
          spreadsheetApi.get('MasterData'),
          spreadsheetApi.get('JournalEntries')
        ])
        
        const coaData = coaRes.data
        const merged = mergeAccounts(coaData && Array.isArray(coaData) ? coaData : [])
        const typeMap: Record<string, any> = {
          'Harta': 'Assets',
          'Kewajiban': 'Liabilities',
          'Modal': 'Equity',
          'Pendapatan': 'Revenues',
          'Beban': 'Expenses'
        }
        defaultEngine.journal.getEntries().length = 0
        merged.forEach(acc => {
          if (acc.status === 'Aktif') {
            const mappedType = typeMap[acc.account_type] || 'Expenses'
            defaultEngine.coa.addAccount(acc.account_number, acc.account_name, mappedType)
            defaultEngine.ledger.ensureLedger(acc.account_number)
          }
        })

        const journalData = journalRes.data
        if (journalData && Array.isArray(journalData)) {
          let balance = 0
          journalData.forEach(je => {
            try {
              const debits = typeof je.debits === 'string' ? JSON.parse(je.debits) : (je.debits || [])
              const credits = typeof je.credits === 'string' ? JSON.parse(je.credits) : (je.credits || [])
              
              if (debits.length > 0 || credits.length > 0) {
                defaultEngine.recordTransaction(
                  je.date || new Date().toISOString().split('T')[0],
                  debits,
                  credits,
                  je.description || 'Tanpa Deskripsi'
                )
              }
              
              debits.forEach((d: any) => { if (d.accountNumber.startsWith('110')) balance += Number(d.amount) })
              credits.forEach((c: any) => { if (c.accountNumber.startsWith('110')) balance -= Number(c.amount) })
            } catch (e) {}
          })
          setCashBalance(balance)
          setStatements(defaultEngine.getFinancialStatements())
        }
      }

      await Promise.all([
        fetchUsers(),
        fetchBills(),
        fetchGallons(),
        fetchAccounting()
      ])

    } catch (err) {
      console.error("Dashboard Fetch Error:", err)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)
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

      <div className="card-container flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
              <Activity className="w-5 h-5 text-amber-600" />
            </div>
            <span className="badge badge-warning">Baru</span>
          </div>
          <h3 className="text-text-secondary text-sm font-medium">Log Sistem Hari Ini</h3>
          <p className="text-2xl font-bold mt-1 text-gray-900">12 Aktivitas</p>
        </div>
        <Link to="/dashboard/audit" className="text-sm font-semibold text-[#10B981] hover:text-[#047857] mt-4 flex items-center">
          Lihat Audit Log <ArrowRight className="w-4 h-4 ml-1" />
        </Link>
      </div>

      <div className="md:col-span-3">
        <FinancialChart />
      </div>
    </div>
  )

  // Render Dashboard Khusus Admin/Bendahara
  const renderAdminDashboard = () => (
    <div className="space-y-6">
      {statements && (
        <>
          <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4">Ringkasan Keuangan</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card-container flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
                    <Landmark className="w-5 h-5 text-emerald-600" />
                  </div>
                </div>
                <h3 className="text-text-secondary text-sm font-medium">Total Aset (Harta)</h3>
                <p className="text-2xl font-bold mt-1 text-gray-900">
                  {formatCurrency(statements.balanceSheet.assets.totalAssets)}
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 text-sm font-medium text-emerald-600 flex items-center">
                <Wallet className="w-4 h-4 mr-2" /> Kas Lancar: {formatCurrency(statements.balanceSheet.assets.currentAssets)}
              </div>
            </div>

            <div className="card-container flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                    <ArrowUpRight className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
                <h3 className="text-text-secondary text-sm font-medium">Laba Bersih (Net Income)</h3>
                <p className="text-2xl font-bold mt-1 text-gray-900">
                  {formatCurrency(statements.incomeStatement.netIncome)}
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 text-sm text-text-muted">
                Pendapatan - Beban Operasional
              </div>
            </div>

            <div className="card-container flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-orange-600" />
                  </div>
                </div>
                <h3 className="text-text-secondary text-sm font-medium">Kewajiban & Ekuitas</h3>
                <p className="text-2xl font-bold mt-1 text-gray-900">
                  {formatCurrency(statements.balanceSheet.totalLiabilitiesAndEquity)}
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 text-sm text-text-muted">
                Hutang: {formatCurrency(statements.balanceSheet.liabilities.totalLiabilities)} | Modal: {formatCurrency(statements.balanceSheet.equity.totalEquity)}
              </div>
            </div>
          </div>
          <div className="card-container p-6 bg-blue-50 border border-blue-100">
            <h3 className="font-semibold text-blue-900 mb-2">Persamaan Dasar Akuntansi (Aset = Kewajiban + Modal)</h3>
            <p className="text-sm text-blue-800">
              Sistem pembukuan ganda ini menjamin bahwa Total Aset ({formatCurrency(statements.balanceSheet.assets.totalAssets)}) selalu sama dengan Total Kewajiban & Modal ({formatCurrency(statements.balanceSheet.totalLiabilitiesAndEquity)}).
            </p>
          </div>
        </>
      )}

      <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4">Ringkasan Operasional</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card-container flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-full bg-[#ECFDF5] flex items-center justify-center">
                <ArrowDownCircle className="w-5 h-5 text-[#10B981]" />
              </div>
              {cashBalance > 0 ? <span className="badge badge-success">Aman</span> : null}
            </div>
            <h3 className="text-text-secondary text-sm font-medium">Saldo Kas Aktif</h3>
            <p className="text-2xl font-bold mt-1 text-gray-900">
              {loading ? '...' : formatCurrency(cashBalance)}
            </p>
          </div>
          <Link to="/dashboard/finance" className="text-sm font-semibold text-[#10B981] hover:text-[#047857] mt-4 flex items-center">
            Cek Mutasi <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>

      <div className="card-container flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
              <ReceiptText className="w-5 h-5 text-red-600" />
            </div>
            {unpaidBills > 0 && <span className="badge badge-danger">Pending</span>}
          </div>
          <h3 className="text-text-secondary text-sm font-medium">Total Iuran Pending</h3>
          <p className="text-2xl font-bold mt-1 text-gray-900">
            {loading ? '...' : formatCurrency(unpaidBills)}
          </p>
        </div>
        <Link to="/dashboard/bills-payments" className="text-sm font-semibold text-[#10B981] hover:text-[#047857] mt-4 flex items-center">
          Kirim Reminder <ArrowRight className="w-4 h-4 ml-1" />
        </Link>
      </div>

      <div className="card-container flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
              <Droplets className="w-5 h-5 text-blue-600" />
            </div>
            {gallonStock <= 2 && <span className="badge badge-warning">Perlu Beli</span>}
          </div>
          <h3 className="text-text-secondary text-sm font-medium">Status Stok Galon</h3>
          <p className="text-2xl font-bold mt-1 text-gray-900">
            {loading ? '...' : `Sisa ${gallonStock} Galon`}
          </p>
        </div>
        <Link to="/dashboard/gallons-management" className="text-sm font-semibold text-[#10B981] hover:text-[#047857] mt-4 flex items-center">
          Tracker Galon <ArrowRight className="w-4 h-4 ml-1" />
        </Link>
      </div>

      <div className="md:col-span-3">
        <FinancialChart />
      </div>
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
        <Link to="/dashboard/bills" className="text-sm font-semibold text-[#10B981] hover:text-[#047857] mt-4 flex items-center">
          Bayar Sekarang <ArrowRight className="w-4 h-4 ml-1" />
        </Link>
      </div>

      <div className="card-container flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
              <CalendarCheck className="w-5 h-5 text-blue-600" />
            </div>
            <span className="badge badge-info">Besok</span>
          </div>
          <h3 className="text-text-secondary text-sm font-medium">Jadwal Piket Galon</h3>
          <p className="text-2xl font-bold mt-1 text-gray-900">12 Juni 2026</p>
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
          <p className="text-2xl font-bold mt-1 text-gray-900">Transparan</p>
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
      />
    </div>
  )
}
