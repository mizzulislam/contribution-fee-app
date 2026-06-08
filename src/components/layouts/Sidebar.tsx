import { useLocation } from "react-router-dom"
import {
  LayoutDashboard, Users, ReceiptText, WalletCards,
  ArrowDownCircle, Droplets, CalendarCheck, LogOut, Bell,
  Settings, ShieldCheck, Database, FileText, Activity, AlertTriangle, Shield,
  BadgeDollarSign, SearchCheck, RefreshCw, FileLineChart, Store, BellRing, UserCircle, Sparkles
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useSidebarStore } from "@/stores/sidebar-store"
import { SidebarLogo } from "./SidebarLogo"
import { SidebarToggle } from "./SidebarToggle"
import { SidebarNavItem } from "./SidebarNavItem"
import { SidebarProfile } from "./SidebarProfile"
import { useAuth } from "@/hooks/useAuth"

export function Sidebar() {
  const location = useLocation()
  const { profile, activeRole, signOut } = useAuth()
  const { isCollapsed, isMobileOpen, toggleCollapsed, closeMobile } = useSidebarStore()

  // --- NAVIGATION MENUS PER ROLE ---
  const superAdminNav = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Manajemen Warga', path: '/dashboard/warga', icon: Users },
    { name: 'Role & Permission', path: '/dashboard/roles', icon: ShieldCheck },
    { name: 'Data Master', path: '/dashboard/master', icon: Database },
    { name: 'Audit Log', path: '/dashboard/audit', icon: Activity },
    { name: 'Notifikasi', path: '/dashboard/notifications-settings', icon: Bell },
    { name: 'Backup Data', path: '/dashboard/backup', icon: RefreshCw },
  ]

  const adminNav = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Kelola Tagihan', path: '/dashboard/billing', icon: WalletCards },
    { name: 'Akuntansi & Laporan', path: '/dashboard/finance', icon: ArrowDownCircle },
    { name: 'Sistem Galon', path: '/dashboard/gallons-management', icon: Droplets },
    { name: 'Jadwal Piket', path: '/dashboard/duties', icon: CalendarCheck },
  ]

  const userNav = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Tagihan Saya', path: '/dashboard/bills', icon: WalletCards },
    { name: 'Konfirmasi Bayar', path: '/dashboard/payment-confirm', icon: SearchCheck },
    { name: 'Riwayat Bayar', path: '/dashboard/payment-history', icon: ReceiptText },
    { name: 'Kas Kos', path: '/dashboard/cash-reports', icon: FileLineChart },
    { name: 'Info Galon', path: '/dashboard/gallons-info', icon: Droplets },
    { name: 'Piket Saya', path: '/dashboard/duties-mine', icon: CalendarCheck },
    { name: 'Lapor Piket', path: '/dashboard/duties-confirm', icon: ShieldCheck },
    { name: 'Notifikasi', path: '/dashboard/notifications', icon: Bell },
    { name: 'Pengumuman', path: '/dashboard/announcements', icon: FileText },
  ]

  let navItems = userNav
  if (activeRole === 'super admin') navItems = superAdminNav
  else if (activeRole === 'admin') navItems = adminNav

  return (
    <>
      <div
        onClick={closeMobile}
        className={cn(
          "fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 md:hidden",
          isMobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-[100dvh] border-r border-white/10 flex flex-col",
          "bg-[#047857] text-white shadow-2xl",
          "transition-[width,transform] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
          isCollapsed ? "md:w-[84px]" : "md:w-[280px]",
          "w-[280px]",
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-white/30 via-white/5 to-transparent mix-blend-overlay pointer-events-none" />

        <div>
          <SidebarLogo 
            collapsed={isCollapsed} 
            onClick={() => {
              if (window.innerWidth >= 768) {
                toggleCollapsed()
              } else {
                closeMobile()
              }
            }} 
          />
        </div>

        <nav className="flex-1 overflow-y-auto space-y-1 px-3 pt-4 pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {navItems.map((item) => {
            const active = location.pathname === item.path

            return (
              <SidebarNavItem
                key={item.path}
                href={item.path}
                label={item.name}
                icon={item.icon}
                active={active}
                collapsed={isCollapsed}
              />
            )
          })}
        </nav>

        <div className="p-3 mt-auto">
          <SidebarProfile />
        </div>
      </aside>
    </>
  )
}
