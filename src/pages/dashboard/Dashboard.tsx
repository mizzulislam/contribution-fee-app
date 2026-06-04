import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { WalletCards, CalendarCheck, Droplets, ArrowRight, Building2, Users, Activity, ReceiptText, ArrowDownCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { QuickActions } from '@/components/dashboard/QuickActions'
import { FinancialChart } from '@/components/dashboard/FinancialChart'
import { UserActivityChart } from '@/components/dashboard/UserActivityChart'
import JournalEntryModal from '@/components/accounting/JournalEntryModal'

export default function Dashboard() {
  const { profile } = useAuth()
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false)

  // Render Dashboard Khusus Super Admin
  const renderSuperAdminDashboard = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div className="card-container flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-full bg-[#ECFDF5] flex items-center justify-center">
              <Building2 className="w-5 h-5 text-[#10B981]" />
            </div>
          </div>
          <h3 className="text-text-secondary text-sm font-medium">Total Kos Terdaftar</h3>
          <p className="text-2xl font-bold mt-1 text-gray-900">3 Cabang</p>
        </div>
        <Link to="/dashboard/units" className="text-sm font-semibold text-[#10B981] hover:text-[#047857] mt-4 flex items-center">
          Kelola Kos <ArrowRight className="w-4 h-4 ml-1" />
        </Link>
      </div>

      <div className="card-container flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <h3 className="text-text-secondary text-sm font-medium">Total Pengguna Aktif</h3>
          <p className="text-2xl font-bold mt-1 text-gray-900">24 Orang</p>
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div className="card-container flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-full bg-[#ECFDF5] flex items-center justify-center">
              <ArrowDownCircle className="w-5 h-5 text-[#10B981]" />
            </div>
            <span className="badge badge-success">Aman</span>
          </div>
          <h3 className="text-text-secondary text-sm font-medium">Saldo Kas Aktif</h3>
          <p className="text-2xl font-bold mt-1 text-gray-900">Rp 1.250.000</p>
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
            <span className="badge badge-danger">3 Belum Lunas</span>
          </div>
          <h3 className="text-text-secondary text-sm font-medium">Iuran Pending</h3>
          <p className="text-2xl font-bold mt-1 text-gray-900">Rp 450.000</p>
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
            <span className="badge badge-warning">Perlu Beli</span>
          </div>
          <h3 className="text-text-secondary text-sm font-medium">Status Stok Galon</h3>
          <p className="text-2xl font-bold mt-1 text-gray-900">Sisa 1 Galon</p>
        </div>
        <Link to="/dashboard/gallons" className="text-sm font-semibold text-[#10B981] hover:text-[#047857] mt-4 flex items-center">
          Tracker Galon <ArrowRight className="w-4 h-4 ml-1" />
        </Link>
      </div>

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
            <span className="badge badge-danger">Jatuh Tempo</span>
          </div>
          <h3 className="text-text-secondary text-sm font-medium">Tagihan Anda</h3>
          <p className="text-2xl font-bold mt-1 text-gray-900">Rp 150.000</p>
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
          Anda login sebagai <span className="font-semibold text-[#10B981] capitalize">{profile?.role || 'user'}</span>. 
          {profile?.role === 'super admin' && ' Pantau dan atur seluruh aktivitas sistem dari sini.'}
          {profile?.role === 'admin' && ' Kelola operasional kos, iuran, dan kebutuhan galon.'}
          {profile?.role === 'user' && ' Jangan lupa cek tagihan dan jadwal piket Anda.'}
        </p>
      </div>

      <QuickActions onOpenTransaction={() => setIsTransactionModalOpen(true)} />

      {/* Render Specific Dashboard Cards Based on Role */}
      {profile?.role === 'super admin' && renderSuperAdminDashboard()}
      {profile?.role === 'admin' && renderAdminDashboard()}
      {profile?.role === 'user' && renderUserDashboard()}

      <JournalEntryModal 
        isOpen={isTransactionModalOpen} 
        onClose={() => setIsTransactionModalOpen(false)} 
      />
    </div>
  )
}
