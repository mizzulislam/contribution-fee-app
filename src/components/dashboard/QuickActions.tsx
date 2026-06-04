import { Link } from 'react-router-dom'
import { PlusCircle, SearchCheck, ReceiptText, ShieldAlert } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export function QuickActions({ onOpenTransaction }: { onOpenTransaction?: () => void }) {
  const { profile } = useAuth()

  if (profile?.role === 'super admin') {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
        <Link to="/dashboard/warga" className="group flex flex-col items-center justify-center p-4 rounded-2xl bg-white border border-gray-100 hover:border-emerald-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white flex items-center justify-center mb-3 transition-colors">
            <PlusCircle className="w-6 h-6" />
          </div>
          <span className="text-sm font-medium text-gray-700 group-hover:text-emerald-700">Tambah Warga</span>
        </Link>
        <Link to="/dashboard/master" className="group flex flex-col items-center justify-center p-4 rounded-2xl bg-white border border-gray-100 hover:border-emerald-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white flex items-center justify-center mb-3 transition-colors">
            <SearchCheck className="w-6 h-6" />
          </div>
          <span className="text-sm font-medium text-gray-700 group-hover:text-emerald-700">Data Master</span>
        </Link>
        <Link to="/dashboard/audit" className="group flex flex-col items-center justify-center p-4 rounded-2xl bg-white border border-gray-100 hover:border-emerald-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white flex items-center justify-center mb-3 transition-colors">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <span className="text-sm font-medium text-gray-700 group-hover:text-emerald-700">Audit Log</span>
        </Link>
        <Link to="/dashboard/finance?tab=statements" className="group flex flex-col items-center justify-center p-4 rounded-2xl bg-white border border-gray-100 hover:border-emerald-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white flex items-center justify-center mb-3 transition-colors">
            <ReceiptText className="w-6 h-6" />
          </div>
          <span className="text-sm font-medium text-gray-700 group-hover:text-emerald-700">Laporan</span>
        </Link>
      </div>
    )
  }

  if (profile?.role === 'admin') {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
        <Link to="/dashboard/billing" className="group flex flex-col items-center justify-center p-4 rounded-2xl bg-white border border-gray-100 hover:border-blue-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 group-hover:bg-blue-500 group-hover:text-white flex items-center justify-center mb-3 transition-colors">
            <ReceiptText className="w-6 h-6" />
          </div>
          <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">Manajemen Iuran</span>
        </Link>
        <Link to="/dashboard/billing?tab=verification" className="group flex flex-col items-center justify-center p-4 rounded-2xl bg-white border border-gray-100 hover:border-emerald-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white flex items-center justify-center mb-3 transition-colors">
            <SearchCheck className="w-6 h-6" />
          </div>
          <span className="text-sm font-medium text-gray-700 group-hover:text-emerald-700">Verifikasi Bayar</span>
        </Link>
        <button onClick={() => onOpenTransaction && onOpenTransaction()} className="group flex flex-col items-center justify-center p-4 rounded-2xl bg-white border border-gray-100 hover:border-red-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 w-full">
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 group-hover:bg-red-500 group-hover:text-white flex items-center justify-center mb-3 transition-colors">
            <PlusCircle className="w-6 h-6" />
          </div>
          <span className="text-sm font-medium text-gray-700 group-hover:text-red-700">Catat Transaksi</span>
        </button>
        <Link to="/dashboard/finance?tab=statements" className="group flex flex-col items-center justify-center p-4 rounded-2xl bg-white border border-gray-100 hover:border-purple-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
          <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 group-hover:bg-purple-500 group-hover:text-white flex items-center justify-center mb-3 transition-colors">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <span className="text-sm font-medium text-gray-700 group-hover:text-purple-700">Laporan Kas</span>
        </Link>
      </div>
    )
  }

  // User role actions
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
      <Link to="/dashboard/bills" className="group flex flex-col items-center justify-center p-4 rounded-2xl bg-white border border-gray-100 hover:border-emerald-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
        <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white flex items-center justify-center mb-3 transition-colors">
          <ReceiptText className="w-6 h-6" />
        </div>
        <span className="text-sm font-medium text-gray-700 group-hover:text-emerald-700">Bayar Iuran</span>
      </Link>
      <Link to="/dashboard/duties-confirm" className="group flex flex-col items-center justify-center p-4 rounded-2xl bg-white border border-gray-100 hover:border-blue-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
        <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 group-hover:bg-blue-500 group-hover:text-white flex items-center justify-center mb-3 transition-colors">
          <SearchCheck className="w-6 h-6" />
        </div>
        <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">Lapor Piket</span>
      </Link>
    </div>
  )
}
