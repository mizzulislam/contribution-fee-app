import { Outlet, Link, useLocation, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Bell } from 'lucide-react'
import { useSidebarStore } from '@/stores/sidebar-store'
import { Sidebar } from './Sidebar'
import { cn } from '@/lib/utils'

export default function DashboardLayout() {
  const { profile, signOut } = useAuth()
  const location = useLocation()

  if (!profile) {
    return <Navigate to="/login" replace />
  }

  const { isCollapsed, toggleMobile } = useSidebarStore()

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col md:flex-row">
      
      <Sidebar />

      {/* Main Content Area */}
      <div 
        className={cn(
          "flex-1 flex flex-col min-h-[100dvh] pb-16 md:pb-0 transition-[padding,margin] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
          isCollapsed ? "md:ml-[84px]" : "md:ml-[280px]"
        )}
      >
        
        {/* Top Header */}
        <header className="bg-white border-b border-border h-16 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-10">
          <div className="md:hidden flex items-center space-x-2">
            <button
              type="button"
              onClick={toggleMobile}
              className="inline-flex size-10 items-center justify-center rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
            </button>
            <span className="font-bold text-gray-900 ml-1">Soematra</span>
          </div>
          
          <div className="hidden md:block">
            <div className="text-sm text-text-muted">
              Role Aktif: <span className="font-semibold text-primary capitalize">{profile.role}</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-50 relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full"></span>
            </button>
            <div className="flex items-center space-x-3 pl-4 border-l border-border">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-medium text-gray-900">{profile.full_name}</div>
                <div className="text-xs text-text-muted capitalize">{profile.role}</div>
              </div>
              <div className="w-9 h-9 rounded-full bg-primary-light flex items-center justify-center text-primary-dark font-bold text-sm">
                {profile.full_name.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
