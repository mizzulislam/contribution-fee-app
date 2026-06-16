import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Megaphone, Bell } from 'lucide-react'
import { cn } from '@/lib/utils'

// Import Sub-pages
import Announcements from './Announcements'
import Notifications from './Notifications'

export default function UserInformationDashboard() {
  const location = useLocation()
  const navigate = useNavigate()
  
  const queryParams = new URLSearchParams(location.search)
  const defaultTab = queryParams.get('tab') || 'announcements'
  
  const [activeTab, setActiveTab] = useState(defaultTab)

  // Update tab state if URL changes externally
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const tab = params.get('tab')
    if (tab && (tab === 'announcements' || tab === 'notifications') && tab !== activeTab) {
      const timer = setTimeout(() => {
        setActiveTab(tab)
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [location.search, activeTab])

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId)
    navigate(`/dashboard/information?tab=${tabId}`, { replace: true })
  }

  const tabs = [
    { id: 'announcements', label: 'Pengumuman', icon: Megaphone },
    { id: 'notifications', label: 'Notifikasi', icon: Bell },
  ]

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="bg-white rounded-[20px] p-2 flex flex-wrap gap-2 shadow-sm border border-gray-100">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                "flex items-center px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300",
                isActive 
                  ? "bg-emerald-50 text-emerald-700 shadow-sm" 
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Icon className={cn("w-4 h-4 mr-2", isActive ? "text-emerald-600" : "text-gray-400")} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Render Active Component */}
      <div className="pt-2">
        {activeTab === 'announcements' && <Announcements />}
        {activeTab === 'notifications' && <Notifications />}
      </div>
    </div>
  )
}
