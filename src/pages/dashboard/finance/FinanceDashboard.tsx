import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { LayoutDashboard, BookOpen, ScrollText, Scale, FileBarChart, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

import { defaultEngine } from '@/lib/accounting'
import { spreadsheetApi } from '@/lib/spreadsheet'
import { mergeAccounts } from '@/lib/chartOfAccounts'

// IFRS Views
import GeneralJournalView from './views/GeneralJournalView'
import GeneralLedgerView from './views/GeneralLedgerView'
import TrialBalanceView from './views/TrialBalanceView'
import FinancialStatementsView from './views/FinancialStatementsView'

export default function FinanceDashboard() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')
  const [activeTab, setActiveTab] = useState(tabParam || 'journal')
  const [isSyncing, setIsSyncing] = useState(true)

  useEffect(() => {
    if (tabParam && ['journal', 'ledger', 'trial_balance', 'statements'].includes(tabParam)) {
      setActiveTab(tabParam)
    }
  }, [tabParam])

  useEffect(() => {
    const initData = async () => {
      setIsSyncing(true)
      try {
        const { data: coaData } = await spreadsheetApi.get('MasterData')
        const merged = mergeAccounts(coaData && Array.isArray(coaData) ? coaData : [])
        
        const typeMap: Record<string, any> = {
          'Harta': 'Assets',
          'Kewajiban': 'Liabilities',
          'Modal': 'Equity',
          'Pendapatan': 'Revenues',
          'Beban': 'Expenses'
        }

        defaultEngine.journal.getEntries().length = 0
        
        merged.forEach(acc => {
          if (acc.status === 'Aktif') {
            const mappedType = typeMap[acc.account_type] || 'Expenses'
            defaultEngine.coa.addAccount(acc.account_number, acc.account_name, mappedType)
            defaultEngine.ledger.ensureLedger(acc.account_number)
          }
        })

        const { data: journalData } = await spreadsheetApi.get('JournalEntries')
        if (journalData && Array.isArray(journalData)) {
          journalData.forEach(je => {
            try {
              const debits = typeof je.debits === 'string' ? JSON.parse(je.debits) : (je.debits || [])
              const credits = typeof je.credits === 'string' ? JSON.parse(je.credits) : (je.credits || [])
              
              if (debits.length > 0 || credits.length > 0) {
                defaultEngine.recordTransaction(
                  je.date || new Date().toISOString().split('T')[0],
                  debits,
                  credits,
                  je.description || 'Tanpa Deskripsi'
                )
              }
            } catch (e) {}
          })
        }
      } catch (err) {
        console.error("Gagal sinkronisasi akuntansi:", err)
      } finally {
        setIsSyncing(false)
      }
    }
    initData()
  }, [])

  const handleTabChange = (id: string) => {
    setActiveTab(id)
    setSearchParams({ tab: id }, { replace: true })
  }

  const tabs = [
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
        {isSyncing ? (
          <div className="flex flex-col items-center justify-center py-20 text-emerald-700">
             <Loader2 className="w-10 h-10 animate-spin mb-4" />
             <p className="font-medium">Mensinkronisasi Data Keuangan...</p>
          </div>
        ) : (
          <>
            {activeTab === 'journal' && <GeneralJournalView />}
            {activeTab === 'ledger' && <GeneralLedgerView />}
            {activeTab === 'trial_balance' && <TrialBalanceView />}
            {activeTab === 'statements' && <FinancialStatementsView />}
          </>
        )}
      </div>
    </div>
  )
}
