import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { FileText, ReceiptText, SearchCheck, BellRing } from 'lucide-react'
import { cn } from '@/lib/utils'

// Import Sub-pages
import ContributionsList from '../contributions/ContributionsList'
import BillsPayments from './BillsPayments'
import Verification from './Verification'
import Reminders from './Reminders'

export default function BillingDashboard() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')
  const [activeTab, setActiveTab] = useState(tabParam || 'bills')

  useEffect(() => {
    if (tabParam && ['bills', 'contributions', 'verification', 'reminders'].includes(tabParam)) {
      setActiveTab(tabParam)
    }
  }, [tabParam])

  const handleTabChange = (id: string) => {
    setActiveTab(id)
    setSearchParams({ tab: id }, { replace: true })
  }

  const tabs = [
    { id: 'bills', label: 'Daftar Tagihan', icon: ReceiptText },
    { id: 'contributions', label: 'Katalog Iuran', icon: FileText },
    { id: 'verification', label: 'Verifikasi Bayar', icon: SearchCheck },
    { id: 'reminders', label: 'Pengingat', icon: BellRing },
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
        {activeTab === 'bills' && <BillsPayments />}
        {activeTab === 'contributions' && <ContributionsList />}
        {activeTab === 'verification' && <Verification />}
        {activeTab === 'reminders' && <Reminders />}
      </div>
    </div>
  )
}
