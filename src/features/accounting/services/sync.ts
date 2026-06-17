import { defaultEngine } from '@/features/accounting'
import { spreadsheetApi } from '@/services/sheets-client'
import { mergeAccounts } from '@/features/accounting/data/chartOfAccounts'
import type { JournalEntryLine } from '@/features/accounting/calculations/types'

interface JournalEntryRow {
  id?: string | number
  date?: string
  description?: string
  debits?: string | JournalEntryLine[]
  credits?: string | JournalEntryLine[]
  source?: string | number
  source_id?: string | number
}

let syncQueue: Promise<void> = Promise.resolve()

function parseLines(lines: string | JournalEntryLine[] | undefined): JournalEntryLine[] {
  if (!lines) return []
  if (Array.isArray(lines)) return lines

  try {
    const parsed = JSON.parse(lines)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function normalizeLines(lines: JournalEntryLine[]) {
  return lines
    .map(line => ({
      accountNumber: String(line.accountNumber),
      amount: Number(line.amount) || 0,
    }))
    .sort((a, b) => a.accountNumber.localeCompare(b.accountNumber) || a.amount - b.amount)
}

function getEntryFingerprint(entry: JournalEntryRow, debits: JournalEntryLine[], credits: JournalEntryLine[]) {
  return [
    entry.date || '',
    entry.description || '',
    JSON.stringify(normalizeLines(debits)),
    JSON.stringify(normalizeLines(credits)),
  ].join('|')
}

async function runAccountingSync(): Promise<void> {
  const { data: coaData, error: coaError } = await spreadsheetApi.get('MasterData')
  if (coaError) throw coaError

  const merged = mergeAccounts(coaData && Array.isArray(coaData) ? coaData : [])
  
  const typeMap: Record<string, 'Assets' | 'Liabilities' | 'Equity' | 'Revenues' | 'Expenses'> = {
    'Harta': 'Assets',
    'Kewajiban': 'Liabilities',
    'Modal': 'Equity',
    'Pendapatan': 'Revenues',
    'Beban': 'Expenses'
  }

  defaultEngine.reset()
  
  merged.forEach(acc => {
    if (acc.status === 'Aktif') {
      const mappedType = typeMap[acc.account_type] || 'Expenses'
      defaultEngine.coa.addAccount(acc.account_number, acc.account_name, mappedType)
      defaultEngine.ledger.ensureLedger(acc.account_number)
    }
  })

  const { data: journalData, error: journalError } = await spreadsheetApi.get('JournalEntries')
  if (journalError) throw journalError

  if (journalData && Array.isArray(journalData)) {
    // Sort oldest to newest initially when recording so the ledger balances build up correctly in chronological order
    const sorted = [...journalData].sort((a: JournalEntryRow, b: JournalEntryRow) => new Date(a.date || '').getTime() - new Date(b.date || '').getTime())
    const seenEntryIds = new Set<string>()
    const seenEntryFingerprints = new Set<string>()

    sorted.forEach((je: JournalEntryRow) => {
      try {
        const debits = parseLines(je.debits)
        const credits = parseLines(je.credits)
        const entryId = je.id ? String(je.id) : ''
        const fingerprint = getEntryFingerprint(je, debits, credits)

        if ((entryId && seenEntryIds.has(entryId)) || seenEntryFingerprints.has(fingerprint)) return
        if (entryId) seenEntryIds.add(entryId)
        seenEntryFingerprints.add(fingerprint)
        
        if (debits.length > 0 || credits.length > 0) {
          defaultEngine.recordTransaction(
            je.date || new Date().toISOString().split('T')[0],
            debits,
            credits,
            je.description || 'Tanpa Deskripsi',
            je.id ? String(je.id) : undefined,
            je.source ? String(je.source) : undefined,
            je.source_id ? String(je.source_id) : undefined
          )
        }
      } catch {
        // Skip malformed journal rows so the rest of the report can still render.
      }
    })
  }
}

export function syncAccountingWithSheet(): Promise<void> {
  syncQueue = syncQueue
    .catch(() => undefined)
    .then(runAccountingSync)

  return syncQueue
}
