import { Link } from 'react-router-dom'
import { PlusCircle, SearchCheck, ReceiptText, ShieldAlert, CalendarCheck, Bell, Droplets, type LucideIcon } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

type ActionTone = 'emerald' | 'blue' | 'rose' | 'orange' | 'purple' | 'amber'

const actionToneClasses: Record<ActionTone, {
  border: string
  background: string
  glow: string
  icon: string
  eyebrow: string
}> = {
  emerald: {
    border: 'border-emerald-100 hover:border-emerald-200',
    background: 'bg-gradient-to-br from-white via-white to-emerald-50/70',
    glow: 'bg-emerald-100/60',
    icon: 'bg-emerald-100 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white',
    eyebrow: 'text-emerald-700',
  },
  blue: {
    border: 'border-blue-100 hover:border-blue-200',
    background: 'bg-gradient-to-br from-white via-white to-blue-50/70',
    glow: 'bg-blue-100/70',
    icon: 'bg-blue-100 text-blue-700 group-hover:bg-blue-600 group-hover:text-white',
    eyebrow: 'text-blue-700',
  },
  rose: {
    border: 'border-rose-100 hover:border-rose-200',
    background: 'bg-gradient-to-br from-white via-white to-rose-50/70',
    glow: 'bg-rose-100/70',
    icon: 'bg-rose-100 text-rose-700 group-hover:bg-rose-600 group-hover:text-white',
    eyebrow: 'text-rose-700',
  },
  orange: {
    border: 'border-orange-100 hover:border-orange-200',
    background: 'bg-gradient-to-br from-white via-white to-orange-50/70',
    glow: 'bg-orange-100/70',
    icon: 'bg-orange-100 text-orange-700 group-hover:bg-orange-600 group-hover:text-white',
    eyebrow: 'text-orange-700',
  },
  purple: {
    border: 'border-purple-100 hover:border-purple-200',
    background: 'bg-gradient-to-br from-white via-white to-purple-50/70',
    glow: 'bg-purple-100/70',
    icon: 'bg-purple-100 text-purple-700 group-hover:bg-purple-600 group-hover:text-white',
    eyebrow: 'text-purple-700',
  },
  amber: {
    border: 'border-amber-100 hover:border-amber-200',
    background: 'bg-gradient-to-br from-white via-white to-amber-50/70',
    glow: 'bg-amber-100/70',
    icon: 'bg-amber-100 text-amber-700 group-hover:bg-amber-600 group-hover:text-white',
    eyebrow: 'text-amber-700',
  },
}

interface QuickActionItem {
  icon: LucideIcon
  label: string
  onClick?: () => void
  to?: string
  tone: ActionTone
}

function QuickActionCard({ icon: Icon, label, onClick, to, tone }: QuickActionItem) {
  const toneClass = actionToneClasses[tone]
  const className = `group relative flex min-h-[128px] flex-col justify-between overflow-hidden rounded-2xl border ${toneClass.border} ${toneClass.background} p-5 text-left shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md`
  const content = (
    <>
      <div className={`absolute right-0 top-0 h-20 w-20 ${toneClass.glow} blur-2xl`} />
      <div className="relative flex items-start justify-between gap-3">
        <p className={`text-xs font-bold uppercase tracking-wide ${toneClass.eyebrow}`}>Aksi Cepat</p>
        <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl transition-colors ${toneClass.icon}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <span className="relative mt-6 text-base font-bold text-gray-900">{label}</span>
    </>
  )

  if (to) {
    return (
      <Link to={to} className={className}>
        {content}
      </Link>
    )
  }

  return (
    <button type="button" onClick={onClick} className={`${className} w-full`}>
      {content}
    </button>
  )
}

function QuickActionGrid({ actions }: { actions: QuickActionItem[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {actions.map(action => (
        <QuickActionCard key={action.label} {...action} />
      ))}
    </div>
  )
}

export function QuickActions({ onOpenTransaction }: { onOpenTransaction?: () => void }) {
  const { activeRole } = useAuth()

  if (activeRole === 'super admin') {
    return <QuickActionGrid actions={[
      { label: 'Tambah Warga', to: '/dashboard/warga', icon: PlusCircle, tone: 'emerald' },
      { label: 'Data Master', to: '/dashboard/master', icon: SearchCheck, tone: 'blue' },
      { label: 'Audit Log', to: '/dashboard/audit', icon: ShieldAlert, tone: 'amber' },
      { label: 'Laporan', to: '/dashboard/finance?tab=statements', icon: ReceiptText, tone: 'purple' },
    ]} />
  }

  if (activeRole === 'admin') {
    return <QuickActionGrid actions={[
      { label: 'Manajemen Iuran', to: '/dashboard/billing', icon: ReceiptText, tone: 'blue' },
      { label: 'Verifikasi Bayar', to: '/dashboard/billing?tab=verification', icon: SearchCheck, tone: 'emerald' },
      { label: 'Catat Transaksi', onClick: onOpenTransaction, icon: PlusCircle, tone: 'rose' },
      { label: 'Laporan Kas', to: '/dashboard/finance?tab=statements', icon: ShieldAlert, tone: 'purple' },
    ]} />
  }

  // User role actions
  return <QuickActionGrid actions={[
    { label: 'Pusat Pembayaran', to: '/dashboard/billing-user', icon: ReceiptText, tone: 'emerald' },
    { label: 'Kalender Kos', to: '/dashboard/duties-mine', icon: CalendarCheck, tone: 'blue' },
    { label: 'Pusat Informasi', to: '/dashboard/information', icon: Bell, tone: 'orange' },
    { label: 'Info Galon', to: '/dashboard/gallons-info', icon: Droplets, tone: 'purple' },
  ]} />
}
