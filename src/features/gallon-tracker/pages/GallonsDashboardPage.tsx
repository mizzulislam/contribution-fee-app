import { useState } from 'react'
import { Droplets, Store } from 'lucide-react'
import { cn } from '@/utils/styles'

// Import Sub-pages
import GallonTracker from '@/features/gallon-tracker/components/GallonTransactionsList'
import Vendors from '@/features/gallon-tracker/pages/GallonVendorsPage'

export default function GallonsDashboard() {
  const [activeTab, setActiveTab] = useState('tracker')

  const tabs = [
    { id: 'tracker', label: 'Stok Galon & AI', icon: Droplets },
    { id: 'vendors', label: 'Daftar Kios', icon: Store },
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
              onClick={() => setActiveTab(tab.id)}
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
        {activeTab === 'tracker' && <GallonTracker />}
        {activeTab === 'vendors' && <Vendors />}
      </div>
    </div>
  )
}
