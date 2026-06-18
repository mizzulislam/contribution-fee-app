import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CalendarDays, FileText, Filter, ReceiptText, SearchCheck, BellRing } from 'lucide-react'
import { cn } from '@/utils/styles'
import Select from '@/components/ui/Select'
import { getPeriodLabel, getPresetPeriod, type PeriodFilter, type PeriodPreset } from '@/features/accounting/calculations/period'

// Import Sub-pages
import ContributionsList from '@/features/billing/pages/ContributionsPage'
import BillsPayments from '@/features/billing/components/BillsPaymentsList'
import Verification from '@/features/payments/pages/PaymentVerificationPage'
import Reminders from '@/features/billing/components/BillingReminders'

export default function BillingDashboard() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')
  const [activeTab, setActiveTab] = useState(tabParam || 'bills')
  const [isPeriodOpen, setIsPeriodOpen] = useState(false)
  const [period, setPeriod] = useState<PeriodFilter>({ preset: 'all' })
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const periodDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (tabParam && ['bills', 'contributions', 'verification', 'reminders'].includes(tabParam)) {
      setActiveTab(tabParam)
    }
  }, [tabParam])

  const handleTabChange = (id: string) => {
    setActiveTab(id)
    setSearchParams({ tab: id }, { replace: true })
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!periodDropdownRef.current?.contains(event.target as Node)) {
        setIsPeriodOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const applyPresetPeriod = (preset: PeriodPreset) => {
    if (preset === 'custom') {
      setPeriod({ preset, startDate: customStartDate || undefined, endDate: customEndDate || undefined })
    } else {
      setPeriod(getPresetPeriod(preset))
    }
    setIsPeriodOpen(false)
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
      <div className="bg-white rounded-[20px] p-2 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2 shadow-sm border border-gray-100">
        {/* Desktop Tabs */}
        <div className="hidden lg:flex flex-wrap gap-2">
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

        {/* Desktop Filter Button (Only rendered on desktop) */}
        {/* Mobile Dropdown Tab */}
        <div className="block lg:hidden w-full">
          <Select
            options={tabs.map(t => ({
              label: t.label,
              value: t.id,
              icon: <t.icon className="w-4 h-4" />
            }))}
            value={activeTab}
            onChange={handleTabChange}
          />
        </div>

        {/* Filter Button (w-full on mobile, auto on desktop) */}
        <div ref={periodDropdownRef} className="relative w-full lg:w-auto flex lg:block">
          <button
            type="button"
            onClick={() => setIsPeriodOpen(prev => !prev)}
            className="w-full lg:w-auto form-input flex items-center justify-between bg-white cursor-pointer hover:border-primary/50 transition-colors text-left"
          >
            <span className="flex items-center gap-2 truncate text-gray-900 font-medium">
              <span className="flex-shrink-0">
                <Filter className="h-4 w-4 text-emerald-600" />
              </span>
              Filter: {getPeriodLabel(period)}
            </span>
            <CalendarDays className="h-4 w-4 text-gray-400 flex-shrink-0 ml-2" />
          </button>

          {isPeriodOpen && (
            <div className="absolute right-0 z-40 mt-2 w-full lg:w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-gray-100 bg-white p-4 shadow-xl shadow-gray-200/60">
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
        {activeTab === 'bills' && <BillsPayments period={period} />}
        {activeTab === 'contributions' && <ContributionsList />}
        {activeTab === 'verification' && <Verification period={period} />}
        {activeTab === 'reminders' && <Reminders period={period} />}
      </div>
    </div>
  )
}
