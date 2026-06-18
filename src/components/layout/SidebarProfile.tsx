import { useState, useRef, useEffect } from 'react'
import { LogOut, Settings, UserCircle, ChevronUp } from 'lucide-react'
import { cn } from '@/utils/styles'
import { Link } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useSidebarStore } from '@/stores/sidebar-store'

interface SidebarProfileProps {
  collapsed?: boolean
}

export function SidebarProfile({ collapsed }: SidebarProfileProps) {
  const { profile, signOut } = useAuth()
  const { isCollapsed: storeCollapsed } = useSidebarStore()
  const isCollapsed = collapsed !== undefined ? collapsed : storeCollapsed
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const [photoUrl, setPhotoUrl] = useState<string | null>(() => {
    return profile?.id ? localStorage.getItem(`profile_photo_${profile.id}`) : null
  })

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  useEffect(() => {
    const handleUpdate = () => {
      if (profile?.id) {
        setPhotoUrl(localStorage.getItem(`profile_photo_${profile.id}`))
      }
    }

    window.addEventListener('profile_photo_updated', handleUpdate)
    return () => window.removeEventListener('profile_photo_updated', handleUpdate)
  }, [profile?.id])

  const initial = profile?.full_name?.charAt(0)?.toUpperCase() || 'U'
  const isSuperAdmin = profile?.role === 'super admin'

  return (
    <div className="relative mt-auto" ref={menuRef}>
      {/* Dropdown Menu */}
      {isOpen && (
        <div 
          className={cn(
            "absolute z-50 bg-white border border-gray-100 rounded-xl shadow-lg py-2 min-w-[200px] overflow-hidden transform animate-in fade-in slide-in-from-bottom-2 duration-200",
            isCollapsed ? "left-full bottom-0 ml-2" : "bottom-full left-0 mb-2 w-full"
          )}
        >
          {isCollapsed && (
            <div className="px-4 py-2 border-b border-gray-100 mb-1">
              <p className="text-sm font-semibold text-gray-900 truncate">{profile?.full_name}</p>
              <p className="text-xs text-gray-500 truncate capitalize">{profile?.role}</p>
            </div>
          )}
          
          <Link
            to="/dashboard/profile"
            onClick={() => setIsOpen(false)}
            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors"
          >
            <UserCircle className="w-4 h-4 mr-3 text-gray-400" />
            Profil
          </Link>
          
          {isSuperAdmin && (
            <Link
              to="/dashboard/settings"
              onClick={() => setIsOpen(false)}
              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors"
            >
              <Settings className="w-4 h-4 mr-3 text-gray-400" />
              Pengaturan
            </Link>
          )}

          <div className="h-px bg-gray-100 my-1"></div>
          
          <button
            onClick={() => {
              setIsOpen(false)
              signOut()
            }}
            className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4 mr-3" />
            Keluar
          </button>
        </div>
      )}

      {/* Trigger Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center p-2 rounded-xl text-left transition-colors w-full",
          "hover:bg-white/10 text-white/90 focus:outline-none focus:bg-white/10",
          isOpen && "bg-white/10",
          isCollapsed ? "justify-center" : "justify-between"
        )}
      >
        <div className="flex items-center min-w-0">
          <div className="flex-shrink-0 w-9 h-9 rounded-full bg-primary-dark border border-white/20 flex items-center justify-center font-bold text-sm shadow-sm overflow-hidden text-white/90">
            {photoUrl ? (
              <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              initial
            )}
          </div>
          {!isCollapsed && (
            <div className="ml-3 min-w-0">
              <p className="text-sm font-semibold truncate text-white">
                {profile?.full_name || 'User'}
              </p>
              <p className="text-[11px] text-white/70 truncate capitalize">
                {profile?.role || 'Guest'}
              </p>
            </div>
          )}
        </div>
        {!isCollapsed && (
          <ChevronUp className={cn(
            "w-4 h-4 text-white/50 shrink-0 transition-transform duration-200",
            isOpen && "rotate-180"
          )} />
        )}
      </button>
    </div>
  )
}
