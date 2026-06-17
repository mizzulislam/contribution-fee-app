import { useSearchParams } from 'react-router-dom'
import { WalletCards, SearchCheck, History } from 'lucide-react'
import { cn } from '@/utils/styles'

// Import Sub-pages
import ResidentBillsList from '@/features/billing/components/ResidentBillsList'
import PaymentConfirm from '@/features/payments/components/PaymentConfirmForm'
import PaymentHistory from '@/features/payments/components/PaymentHistoryTable'

export default function UserBillingDashboard() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')
  const activeTab = tabParam && ['bills', 'confirm', 'history'].includes(tabParam) ? tabParam : 'bills'

  const handleTabChange = (id: string) => {
    setSearchParams({ tab: id }, { replace: true })
  }

  const tabs = [
    { id: 'bills', label: 'Tagihan Saya', icon: WalletCards },
    { id: 'confirm', label: 'Konfirmasi Bayar', icon: SearchCheck },
    { id: 'history', label: 'Riwayat Bayar', icon: History },
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
        {activeTab === 'bills' && <ResidentBillsList />}
        {activeTab === 'confirm' && <PaymentConfirm />}
        {activeTab === 'history' && <PaymentHistory />}
      </div>
    </div>
  )
}
