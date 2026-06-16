import { AccountingEngine } from './AccountingEngine'
import { defaultEngine } from './index'
import type { JournalEntry } from './types'

export type PeriodPreset = 'all' | 'this_month' | 'last_month' | 'this_year' | 'custom'

export interface PeriodFilter {
  preset: PeriodPreset
  startDate?: string
  endDate?: string
}

function parseDateOnly(value?: string) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function toInputDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function getPresetPeriod(preset: PeriodPreset): PeriodFilter {
  const now = new Date()

  if (preset === 'this_month') {
    return {
      preset,
      startDate: toInputDate(new Date(now.getFullYear(), now.getMonth(), 1)),
      endDate: toInputDate(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
    }
  }

  if (preset === 'last_month') {
    return {
      preset,
      startDate: toInputDate(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
      endDate: toInputDate(new Date(now.getFullYear(), now.getMonth(), 0)),
    }
  }

  if (preset === 'this_year') {
    return {
      preset,
      startDate: toInputDate(new Date(now.getFullYear(), 0, 1)),
      endDate: toInputDate(new Date(now.getFullYear(), 11, 31)),
    }
  }

  return { preset: 'all' }
}

export function isDateInPeriod(dateValue: string, period: PeriodFilter) {
  if (period.preset === 'all') return true

  const date = parseDateOnly(dateValue)
  const start = parseDateOnly(period.startDate)
  const end = parseDateOnly(period.endDate)

  if (!date) return false
  if (start && date < start) return false
  if (end && date > end) return false
  return true
}

export function filterJournalEntriesByPeriod(entries: JournalEntry[], period: PeriodFilter) {
  return entries.filter(entry => isDateInPeriod(entry.date, period))
}

export function getPeriodLabel(period: PeriodFilter) {
  const format = (value?: string) => {
    const date = parseDateOnly(value)
    return date ? date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : ''
  }

  if (period.preset === 'all') return 'Semua Periode'
  if (period.preset === 'this_month') return 'Bulan Ini'
  if (period.preset === 'last_month') return 'Bulan Lalu'
  if (period.preset === 'this_year') return 'Tahun Ini'
  return `${format(period.startDate) || 'Awal'} - ${format(period.endDate) || 'Akhir'}`
}

export function buildPeriodAccountingEngine(period: PeriodFilter) {
  const engine = new AccountingEngine()
  engine.coa.clear()
  engine.reset()

  defaultEngine.coa.getAllAccounts().forEach(account => {
    engine.coa.addAccount(account.accountNumber, account.accountName, account.accountType)
    engine.ledger.ensureLedger(account.accountNumber)
  })

  filterJournalEntriesByPeriod(defaultEngine.journal.getEntries(), period)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .forEach(entry => {
      engine.recordTransaction(entry.date, entry.debits, entry.credits, entry.description, entry.id)
    })

  return engine
}
