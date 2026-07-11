import { useState, useEffect } from "react"
import { useLocation } from "react-router-dom"
import {
  LayoutDashboard, Users, WalletCards,
  ArrowDownCircle, Droplets, CalendarCheck, Bell,
  Settings, ShieldCheck, Database, Activity,
  RefreshCw, FileLineChart, Megaphone, LayoutGrid,
  Calculator
} from "lucide-react"
import { cn } from "@/utils/styles"
import { useSidebarStore } from "@/stores/sidebar-store"
import { SidebarLogo } from "./SidebarLogo"
import { SidebarNavItem } from "./SidebarNavItem"
import { SidebarProfile } from "./SidebarProfile"
import { useAuth } from "@/features/auth/hooks/useAuth"
import { spreadsheetApi } from "@/services/sheets-client"

export function Sidebar() {
  const location = useLocation()
  const { activeRole } = useAuth()
  const { isCollapsed, isMobileOpen, toggleCollapsed, closeMobile } = useSidebarStore()

  const [isMobile, setIsMobile] = useState(false)
  const [disabledPages, setDisabledPages] = useState<string[]>(() => {
    try {
      const cached = localStorage.getItem('soematra_disabled_pages')
      return cached ? JSON.parse(cached) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    async function loadSettings() {
      try {
        const { data } = await spreadsheetApi.get('Settings')
        if (data && data.length > 0) {
          const settings = data[0]
          if (settings.disabledPages) {
            const parsed = JSON.parse(settings.disabledPages)
            setDisabledPages(parsed)
            localStorage.setItem('soematra_disabled_pages', JSON.stringify(parsed))
          }
        }
      } catch (err) {
        console.error("Gagal memuat setting halaman di sidebar:", err)
      }
    }
    loadSettings()

    const handleSync = (e: Event) => {
      const customEvent = e as CustomEvent
      if (customEvent.detail.sheetName === 'Settings') {
        loadSettings()
      }
    }
    window.addEventListener('soematra-sync-event', handleSync)
    return () => window.removeEventListener('soematra-sync-event', handleSync)
  }, [])

  const displayCollapsed = isCollapsed && !isMobile

  // --- NAVIGATION MENUS PER ROLE ---
  const superAdminNav = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Manajemen Warga', path: '/dashboard/warga', icon: Users },
    { name: 'Manajemen Halaman', path: '/dashboard/page-control', icon: LayoutGrid },
    { name: 'Role & Permission', path: '/dashboard/roles', icon: ShieldCheck },
    { name: 'Data Master', path: '/dashboard/master', icon: Database },
    { name: 'Audit Log', path: '/dashboard/audit', icon: Activity },
    { name: 'Notifikasi', path: '/dashboard/notifications-settings', icon: Bell },
    { name: 'Backup Data', path: '/dashboard/backup', icon: RefreshCw },
    { name: 'System Settings', path: '/dashboard/settings', icon: Settings },
  ]

  const adminNav = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Kelola Tagihan', path: '/dashboard/billing', icon: WalletCards },
    { name: 'Akuntansi & Laporan', path: '/dashboard/finance', icon: ArrowDownCircle },
    { name: 'Sistem Galon', path: '/dashboard/gallons-management', icon: Droplets },
    { name: 'Jadwal Piket', path: '/dashboard/duties', icon: CalendarCheck },
    { name: 'Kalkulator Split Bill', path: '/dashboard/split-bill', icon: Calculator },
  ]

  const userNav = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Pusat Pembayaran', path: '/dashboard/billing-user', icon: WalletCards },
    { name: 'Kas Kos', path: '/dashboard/cash-reports', icon: FileLineChart },
    { name: 'Info Galon', path: '/dashboard/gallons-info', icon: Droplets },
    { name: 'Kalender Kos', path: '/dashboard/duties-mine', icon: CalendarCheck },
    { name: 'Pusat Informasi', path: '/dashboard/information', icon: Megaphone },
    { name: 'Kalkulator Split Bill', path: '/dashboard/split-bill', icon: Calculator },
  ]

  let navItems = userNav
  if (activeRole === 'super admin') navItems = superAdminNav
  else if (activeRole === 'admin') navItems = adminNav

  const filteredNavItems = navItems.filter(item => !disabledPages.includes(item.path))

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
            collapsed={displayCollapsed} 
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
          {filteredNavItems.map((item) => {
            const active = location.pathname === item.path

            return (
              <SidebarNavItem
                key={item.path}
                href={item.path}
                label={item.name}
                icon={item.icon}
                active={active}
                collapsed={displayCollapsed}
              />
            )
          })}
        </nav>

        <div className="p-3 mt-auto">
          <SidebarProfile collapsed={displayCollapsed} />
        </div>
      </aside>
    </>
  )
}
