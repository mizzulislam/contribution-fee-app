import { spreadsheetApi } from '@/services/sheets-client'

interface UserRow {
  id?: string | number
  full_name?: string
  nickname?: string
  room_number?: string | number
}

interface BillRow {
  id?: string | number
  status?: string
  resident_name?: string
  room_number?: string | number
  amount?: string | number
  due_date?: string
  contributions?: string | { title?: string; contribution_types?: { name?: string } }
  title?: string
  description?: string
  payment_source?: string
  accounting_journal_id?: string | number
  paid_at?: string
  updated_at?: string
}

interface JournalLine {
  accountNumber?: string
  amount?: string | number
}

interface JournalEntryRow {
  id?: string | number
  date?: string
  description?: string
  debits?: string | JournalLine[]
  credits?: string | JournalLine[]
}

function normalizeText(value: string | number | undefined) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function containsPhrase(text: string, phrase: string) {
  if (!phrase || phrase.length < 2) return false
  return ` ${text} `.includes(` ${phrase} `)
}

function parseDate(value?: string) {
  if (!value) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate())
}

function isSameAccountingPeriod(billDate?: string, journalDate?: string) {
  const bill = parseDate(billDate)
  const journal = parseDate(journalDate)
  if (!bill || !journal) return true
  return bill.getFullYear() === journal.getFullYear() && bill.getMonth() === journal.getMonth()
}

function parseLines(lines: string | JournalLine[] | undefined): JournalLine[] {
  if (!lines) return []
  if (Array.isArray(lines)) return lines

  try {
    const parsed = JSON.parse(lines)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function parseAmount(value: string | number | undefined) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (!value) return 0

  const normalized = String(value)
    .replace(/[^\d,.-]/g, '')
    .replace(/\.(?=\d{3}(\D|$))/g, '')
    .replace(',', '.')

  const amount = Number(normalized)
  return Number.isFinite(amount) ? amount : 0
}

function getJournalAmount(entry: JournalEntryRow) {
  const debitTotal = parseLines(entry.debits).reduce((sum, line) => sum + parseAmount(line.amount), 0)
  const creditTotal = parseLines(entry.credits).reduce((sum, line) => sum + parseAmount(line.amount), 0)
  return Math.max(debitTotal, creditTotal)
}

function getContributionData(bill: BillRow) {
  const contrib = bill.contributions

  if (typeof contrib === 'string') {
    try {
      return JSON.parse(contrib)
    } catch {
      const titleMatch = contrib.match(/title=([^,}]+)/)
      const nameMatch = contrib.match(/name=([^,}]+)/)
      return {
        title: titleMatch ? titleMatch[1].trim() : contrib,
        contribution_types: { name: nameMatch ? nameMatch[1].trim() : 'Kustom' },
      }
    }
  }

  return contrib || {
    title: bill.title || bill.description || '',
    contribution_types: { name: 'Kustom' },
  }
}

function isOpenBillStatus(status?: string) {
  const normalized = normalizeText(status || 'unpaid')
  return ['unpaid', 'belum bayar', 'pending', 'menunggu konfirmasi', 'rejected', 'ditolak'].includes(normalized)
}

function isGallonBill(bill: BillRow) {
  const contribution = getContributionData(bill)
  const label = normalizeText(`${contribution.title || ''} ${contribution.contribution_types?.name || ''} ${bill.title || ''} ${bill.description || ''}`)
  return label.includes('galon') && (label.includes('iuran') || label.includes('air') || label.includes('tagihan'))
}

function isOfficialPaymentSource(source: string) {
  const normalized = normalizeText(source)
  if (!normalized) return false
  const isManualSource = ['manual_journal', 'manual_adjusting', 'manual_closing', 'manual_reversing'].some(keyword => normalized.includes(keyword))
  if (isManualSource) return false
  return normalized.includes('payment') || normalized.includes('verifikasi')
}

function isDebtCompensationJournal(entry: JournalEntryRow) {
  const description = normalizeText(entry.description)
  const source = normalizeText(String((entry as any).source || ''))
  return source.includes('debt_compensation') || description.includes('kompensasi utang')
}

function getResidentAliases(bill: BillRow, users: UserRow[]) {
  const aliases = new Set<string>()
  const billName = normalizeText(bill.resident_name)
  const ignoredSingleNameTokens = new Set(['muhammad', 'mohammad', 'muhamad', 'ahmad', 'islam'])
  const addNameParts = (value?: string) => {
    normalizeText(value)
      .split(' ')
      .filter(part => part.length >= 3 && !ignoredSingleNameTokens.has(part))
      .forEach(part => aliases.add(part))
  }

  if (billName) aliases.add(billName)
  addNameParts(bill.resident_name)
  if (bill.room_number) aliases.add(`kamar ${bill.room_number}`)

  const matchingUser = users.find(user => {
    const fullName = normalizeText(user.full_name)
    const nickname = normalizeText(user.nickname)
    return Boolean(
      (billName && (billName === fullName || billName === nickname || fullName.includes(billName) || billName.includes(fullName))) ||
      (bill.room_number && String(user.room_number || '') === String(bill.room_number))
    )
  })

  if (matchingUser?.full_name) aliases.add(normalizeText(matchingUser.full_name))
  if (matchingUser?.nickname) aliases.add(normalizeText(matchingUser.nickname))
  addNameParts(matchingUser?.full_name)
  addNameParts(matchingUser?.nickname)

  return Array.from(aliases).filter(alias => alias.length >= 3)
}

function isAmountMatch(billAmount: number, journalAmount: number) {
  if (billAmount <= 0 || journalAmount <= 0) return false
  const tolerance = Math.max(1000, billAmount * 0.02)
  return Math.abs(journalAmount - billAmount) <= tolerance
}

function findMatchingJournalEntry(bill: BillRow, journalEntries: JournalEntryRow[], users: UserRow[]) {
  const aliases = getResidentAliases(bill, users)
  if (aliases.length === 0) return null

  const billAmount = parseAmount(bill.amount)
  if (billAmount <= 0) return null

  return journalEntries.find(entry => {
    if (!isDebtCompensationJournal(entry)) return false
    if (!isSameAccountingPeriod(bill.due_date, entry.date)) return false

    const description = normalizeText(entry.description)
    const hasResidentName = aliases.some(alias => containsPhrase(description, alias))
    if (!hasResidentName) return false

    const journalAmount = getJournalAmount(entry)
    return isAmountMatch(billAmount, journalAmount)
  }) || null
}

function findPartialMatchingJournalEntry(bill: BillRow, journalEntries: JournalEntryRow[], users: UserRow[]) {
  const aliases = getResidentAliases(bill, users)
  if (aliases.length === 0) return null

  const billAmount = parseAmount(bill.amount)
  if (billAmount <= 0) return null

  const contribution = getContributionData(bill)
  const billTitle = normalizeText(contribution.title || bill.title || bill.description || '')

  return journalEntries.find(entry => {
    if (!isDebtCompensationJournal(entry)) return false
    if (!isSameAccountingPeriod(bill.due_date, entry.date)) return false

    const description = normalizeText(entry.description)
    const hasResidentName = aliases.some(alias => containsPhrase(description, alias))
    if (!hasResidentName) return false

    if (billTitle && !description.includes(billTitle)) return false

    const journalAmount = getJournalAmount(entry)
    return journalAmount > 0 && journalAmount < billAmount
  }) || null
}

export async function syncBillsWithAccountingEntries({
  bills,
  journalEntries,
  users,
  persist = false,
}: {
  bills: BillRow[]
  journalEntries: JournalEntryRow[]
  users: UserRow[]
  persist?: boolean
}) {
  let syncedCount = 0
  const updates: BillRow[] = []

  const syncedBills = (Array.isArray(bills) ? bills : []).map(bill => {
    if (!bill.id) return bill

    // 1. Check for full match
    const matchingEntry = findMatchingJournalEntry(bill, journalEntries, users)
    if (matchingEntry) {
      if (bill.status === 'paid') {
        return {
          ...bill,
          paid_amount: parseAmount(bill.amount)
        }
      }
      syncedCount += 1
      const updatedBill = {
        ...bill,
        status: 'paid',
        payment_source: 'accounting_journal',
        accounting_journal_id: matchingEntry.id || '',
        paid_at: matchingEntry.date || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        paid_amount: parseAmount(bill.amount)
      }
      updates.push(updatedBill)
      return updatedBill
    }

    // 2. Check for partial match
    const matchingPartialEntry = findPartialMatchingJournalEntry(bill, journalEntries, users)
    if (matchingPartialEntry) {
      const journalAmount = getJournalAmount(matchingPartialEntry)
      if (bill.status === 'partially_paid' && (bill as any).paid_amount === journalAmount) {
        return {
          ...bill,
          paid_amount: journalAmount
        }
      }
      syncedCount += 1
      const updatedBill = {
        ...bill,
        status: 'partially_paid',
        payment_source: 'accounting_journal',
        accounting_journal_id: matchingPartialEntry.id || '',
        paid_at: matchingPartialEntry.date || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        paid_amount: journalAmount
      }
      updates.push(updatedBill)
      return updatedBill
    }

    return bill
  })

  if (persist && updates.length > 0) {
    await Promise.all(updates.map(bill => spreadsheetApi.put('Bills', bill)))
  }

  return { bills: syncedBills, syncedCount }
}
