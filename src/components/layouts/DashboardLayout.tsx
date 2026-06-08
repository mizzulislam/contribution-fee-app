import { Outlet, Link, useLocation, Navigate, useNavigate } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import { useAuth, type Role } from '@/hooks/useAuth'
import { Bell, ArrowRightLeft, ChevronDown, Check } from 'lucide-react'
import { useSidebarStore } from '@/stores/sidebar-store'
import { Sidebar } from './Sidebar'
import { cn } from '@/lib/utils'

export default function DashboardLayout() {
  const { profile, activeRole, setActiveRole } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false)
  const [isSwitching, setIsSwitching] = useState(false)
  const roleDropdownRef = useRef<HTMLDivElement>(null)

  const availableRoles = profile?.role ? String(profile.role).split(',').map(r => r.trim().toLowerCase()) : []

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(event.target as Node)) {
        setIsRoleDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])


  if (!profile) {
    return <Navigate to="/login" replace />
  }

  const { isCollapsed, toggleMobile } = useSidebarStore()

  const handleRoleSwitch = (role: string) => {
    setIsRoleDropdownOpen(false)
    setIsSwitching(true)
    setTimeout(() => {
      setActiveRole(role as Role)
      navigate('/dashboard', { replace: true })
      setTimeout(() => setIsSwitching(false), 400)
    }, 600)
  }

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
        <header className="bg-white border-b border-border h-16 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-40">
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
            {/* Removed role text to declutter header */}
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            {availableRoles.length > 1 && (
              <div className="relative" ref={roleDropdownRef}>
                <button
                  onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                  className="flex items-center bg-gray-50 hover:bg-gray-100 border border-border rounded-xl px-3 py-2 transition-all duration-200 group"
                >
                  <div className="w-6 h-6 rounded-md bg-primary-soft text-primary flex items-center justify-center mr-2.5">
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-left hidden sm:block mr-3">
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider leading-none mb-1">Mode Aktif</p>
                    <p className="text-sm font-bold text-gray-900 leading-none">
                      {activeRole === 'super admin' ? 'Super Admin' : activeRole === 'admin' ? 'Bendahara' : 'Warga'}
                    </p>
                  </div>
                  <ChevronDown className={cn(
                    "w-4 h-4 text-gray-400 transition-transform duration-200 group-hover:text-gray-600",
                    isRoleDropdownOpen && "rotate-180"
                  )} />
                </button>

                {isRoleDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-border rounded-xl shadow-lg shadow-gray-200/50 overflow-hidden py-1.5 animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                    {availableRoles.map(role => (
                      <button
                        key={role}
                        onClick={() => handleRoleSwitch(role)}
                        className={cn(
                          "w-full px-4 py-2.5 text-left text-sm font-medium flex items-center justify-between transition-colors",
                          activeRole === role 
                            ? "bg-primary-soft/80 text-primary-dark" 
                            : "text-gray-700 hover:bg-gray-50"
                        )}
                      >
                        <span className="capitalize">Mode {role === 'super admin' ? 'Super Admin' : role === 'admin' ? 'Bendahara' : 'Warga'}</span>
                        {activeRole === role && <Check className="w-4 h-4 text-primary" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            <button 
              onClick={() => navigate('/dashboard/information?tab=notifications')}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-50 relative"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full"></span>
            </button>
            {/* Removed profile dropdown since it's now in the sidebar */}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          
          {/* Overlay Loader for Role Switch */}
          <div className={cn(
            "fixed inset-0 z-[100] bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center transition-all duration-300",
            isSwitching ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          )}>
            <div className="w-12 h-12 rounded-full border-4 border-gray-100 border-t-primary animate-spin mb-4"></div>
            <p className="text-gray-600 font-medium animate-pulse">Mengganti Mode Operasi...</p>
          </div>

          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
