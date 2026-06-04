import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { LayoutDashboard, BookOpen, ScrollText, Scale, FileBarChart } from 'lucide-react'
import { cn } from '@/lib/utils'

// IFRS Views
import FinancialSummaryView from './views/FinancialSummaryView'
import GeneralJournalView from './views/GeneralJournalView'
import GeneralLedgerView from './views/GeneralLedgerView'
import TrialBalanceView from './views/TrialBalanceView'
import FinancialStatementsView from './views/FinancialStatementsView'

export default function FinanceDashboard() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')
  const [activeTab, setActiveTab] = useState(tabParam || 'summary')

  useEffect(() => {
    if (tabParam && ['summary', 'journal', 'ledger', 'trial_balance', 'statements'].includes(tabParam)) {
      setActiveTab(tabParam)
    }
  }, [tabParam])

  const handleTabChange = (id: string) => {
    setActiveTab(id)
    setSearchParams({ tab: id }, { replace: true })
  }

  const tabs = [
    { id: 'summary', label: 'Dashboard Keuangan', icon: LayoutDashboard },
    { id: 'journal', label: 'Jurnal Umum', icon: BookOpen },
    { id: 'ledger', label: 'Buku Besar', icon: ScrollText },
    { id: 'trial_balance', label: 'Neraca Saldo', icon: Scale },
    { id: 'statements', label: 'Laporan Keuangan', icon: FileBarChart },
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
        {activeTab === 'summary' && <FinancialSummaryView />}
        {activeTab === 'journal' && <GeneralJournalView />}
        {activeTab === 'ledger' && <GeneralLedgerView />}
        {activeTab === 'trial_balance' && <TrialBalanceView />}
        {activeTab === 'statements' && <FinancialStatementsView />}
      </div>
    </div>
  )
}
