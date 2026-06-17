import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { BookOpen, ScrollText, Scale, FileBarChart, Loader2, CalendarDays, Filter, Sliders, Archive } from 'lucide-react'
import { cn } from '@/utils/styles'

import { syncAccountingWithSheet } from '@/features/accounting'
import { getPeriodLabel, getPresetPeriod, type PeriodFilter, type PeriodPreset } from '@/features/accounting/calculations/period'

// IFRS Views
import GeneralJournalView from '@/features/accounting/components/GeneralJournalView'
import GeneralLedgerView from '@/features/accounting/components/GeneralLedgerView'
import TrialBalanceView from '@/features/accounting/components/TrialBalanceView'
import FinancialStatementsView from '@/features/accounting/components/FinancialStatementsView'
import AdjustingEntriesView from '@/features/accounting/components/AdjustingEntriesView'
import ClosingProcessView from '@/features/accounting/components/ClosingProcessView'

export default function FinanceDashboard() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')
  const activeTab = tabParam && ['journal', 'ledger', 'trial_balance', 'statements', 'adjusting', 'closing'].includes(tabParam) ? tabParam : 'journal'
  const [isSyncing, setIsSyncing] = useState(true)
  const [isPeriodOpen, setIsPeriodOpen] = useState(false)
  const [period, setPeriod] = useState<PeriodFilter>({ preset: 'all' })
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const periodDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const initData = async () => {
      setIsSyncing(true)
      try {
        await syncAccountingWithSheet()
      } catch (err) {
        console.error("Gagal sinkronisasi akuntansi:", err)
      } finally {
        setIsSyncing(false)
      }
    }
    initData()
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!periodDropdownRef.current?.contains(event.target as Node)) {
        setIsPeriodOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleTabChange = (id: string) => {
    setSearchParams({ tab: id }, { replace: true })
  }

  const applyPresetPeriod = (preset: PeriodPreset) => {
    if (preset === 'custom') {
      setPeriod({ preset, startDate: customStartDate || undefined, endDate: customEndDate || undefined })
    } else {
      setPeriod(getPresetPeriod(preset))
    }
    setIsPeriodOpen(false)
  }

  const tabs = [
    { id: 'journal', label: 'Jurnal Umum', icon: BookOpen },
    { id: 'ledger', label: 'Buku Besar', icon: ScrollText },
    { id: 'trial_balance', label: 'Neraca Saldo', icon: Scale },
    { id: 'statements', label: 'Laporan Keuangan', icon: FileBarChart },
    { id: 'adjusting', label: 'Penyesuaian', icon: Sliders },
    { id: 'closing', label: 'Tutup Buku', icon: Archive },
  ]

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="bg-white rounded-[20px] p-2 flex flex-row items-center justify-between gap-4 shadow-sm border border-gray-100 overflow-hidden w-full">
        <div 
          className="flex-1 flex items-center gap-2 overflow-x-auto no-scrollbar"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <style>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  "flex-shrink-0 flex items-center px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300",
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
        
        <div ref={periodDropdownRef} className="flex-shrink-0 relative flex justify-end">
          <button
            type="button"
            onClick={() => setIsPeriodOpen(prev => !prev)}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            <Filter className="h-4 w-4 text-emerald-600" />
            <span className="hidden sm:inline">Filter:</span>
            <span>{getPeriodLabel(period)}</span>
            <CalendarDays className="h-4 w-4 text-gray-400" />
          </button>

          {isPeriodOpen && (
            <div className="absolute right-0 z-40 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-gray-100 bg-white p-4 shadow-xl shadow-gray-200/60">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Semua', value: 'all' },
                  { label: 'Bulan Ini', value: 'this_month' },
                  { label: 'Bulan Lalu', value: 'last_month' },
                  { label: 'Tahun Ini', value: 'this_year' },
                ].map(item => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => applyPresetPeriod(item.value as PeriodPreset)}
                    className={cn(
                      "rounded-xl border px-3 py-2 text-sm font-medium transition-colors",
                      period.preset === item.value
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="mt-4 border-t border-gray-100 pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="text-xs font-semibold text-gray-600">
                    Dari
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={event => setCustomStartDate(event.target.value)}
                      className="form-input mt-1 h-10 text-sm"
                    />
                  </label>
                  <label className="text-xs font-semibold text-gray-600">
                    Sampai
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={event => setCustomEndDate(event.target.value)}
                      className="form-input mt-1 h-10 text-sm"
                    />
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => applyPresetPeriod('custom')}
                  className="btn-primary mt-3 w-full justify-center py-2 text-sm"
                >
                  Terapkan Periode Custom
                </button>
              </div>
            </div>
          )}
        </div>
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
            {activeTab === 'journal' && <GeneralJournalView period={period} />}
            {activeTab === 'ledger' && <GeneralLedgerView period={period} />}
            {activeTab === 'trial_balance' && <TrialBalanceView period={period} />}
            {activeTab === 'statements' && <FinancialStatementsView period={period} />}
            {activeTab === 'adjusting' && <AdjustingEntriesView period={period} />}
            {activeTab === 'closing' && <ClosingProcessView period={period} />}
          </>
        )}
      </div>
    </div>
  )
}
