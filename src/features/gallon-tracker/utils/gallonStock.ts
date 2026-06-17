export const GALLON_CAPACITY = 2
export const JOURNAL_REFILL_MIN_AMOUNT = 40000
export const MIN_USAGE_RECORDS_FOR_PREDICTION = 3
export const MIN_AVG_CONSUMPTION_FOR_PREDICTION = 0.1

interface GallonStockRow {
  id?: string | number
  date?: string
  created_at?: string
  type?: string
  quantity?: string | number
  note?: string
}

interface JournalLine {
  accountNumber?: string
  amount?: string | number
}

interface JournalEntryRow {
  id?: string | number
  date?: string
  created_at?: string
  description?: string
  debits?: string | JournalLine[]
  credits?: string | JournalLine[]
}

export interface GallonStockEvent {
  key: string
  date: Date
  type: 'refill' | 'usage'
  quantity: number
  source: 'gallons' | 'journal'
}

export interface GallonStockSummary {
  capacity: number
  refilled: number
  used: number
  stock: number
  events: GallonStockEvent[]
}

const DAY_MS = 24 * 60 * 60 * 1000
const monthMap: Record<string, number> = {
  jan: 0,
  januari: 0,
  feb: 1,
  februari: 1,
  mar: 2,
  maret: 2,
  apr: 3,
  april: 3,
  mei: 4,
  may: 4,
  jun: 5,
  juni: 5,
  jul: 6,
  juli: 6,
  aug: 7,
  agustus: 7,
  agu: 7,
  sep: 8,
  september: 8,
  oct: 9,
  okt: 9,
  oktober: 9,
  nov: 10,
  november: 10,
  dec: 11,
  des: 11,
  desember: 11,
}

export function parseGallonQuantity(quantity: string | number | undefined) {
  if (typeof quantity === 'number') return Number.isFinite(quantity) ? quantity : 0
  if (!quantity) return 0

  const normalized = String(quantity).trim()
  if (!normalized) return 0

  const value = normalized.includes(',')
    ? Number(normalized.replace(/\./g, '').replace(',', '.'))
    : Number(normalized)

  return Number.isFinite(value) ? value : 0
}

function parseCurrencyValue(value: string | number | undefined) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (!value) return 0

  const normalized = String(value)
    .replace(/[^\d,.-]/g, '')
    .replace(/\.(?=\d{3}(\D|$))/g, '')
    .replace(',', '.')

  const amount = Number(normalized)
  return Number.isFinite(amount) ? amount : 0
}

export function parseGallonStockDate(value: string | undefined) {
  if (!value) return new Date(0)

  const trimmed = String(value).trim()
  const isoDate = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (isoDate) {
    return new Date(Number(isoDate[1]), Number(isoDate[2]) - 1, Number(isoDate[3]))
  }

  const localDate = trimmed.match(/^(\d{1,2})[/-]([A-Za-zÀ-ÿ]+|\d{1,2})[/-](\d{4})/)
  if (localDate) {
    const day = Number(localDate[1])
    const monthToken = localDate[2].toLowerCase()
    const month = Number.isNaN(Number(monthToken))
      ? monthMap[monthToken]
      : Number(monthToken) - 1
    const year = Number(localDate[3])

    if (Number.isFinite(day) && Number.isFinite(month) && Number.isFinite(year)) {
      return new Date(year, month, day)
    }
  }

  const parsed = new Date(trimmed)
  return Number.isNaN(parsed.getTime()) ? new Date(0) : parsed
}

function formatDateKey(date: Date) {
  if (Number.isNaN(date.getTime())) return 'unknown'
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseJournalLines(lines: string | JournalLine[] | undefined): JournalLine[] {
  if (!lines) return []
  if (Array.isArray(lines)) return lines

  try {
    const parsed = JSON.parse(lines)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function getJournalAmount(entry: JournalEntryRow) {
  const debitTotal = parseJournalLines(entry.debits).reduce((sum, line) => sum + parseCurrencyValue(line.amount), 0)
  const creditTotal = parseJournalLines(entry.credits).reduce((sum, line) => sum + parseCurrencyValue(line.amount), 0)
  return Math.max(debitTotal, creditTotal)
}

function getRefillQuantityFromDescription(description: string, amount: number) {
  const normalized = description.toLowerCase()
  const isGallonRefill = normalized.includes('galon') && /isi\s*ulang|refill/.test(normalized)
  if (!isGallonRefill) return 0

  const explicitQty = normalized.match(/(\d+(?:[.,]\d+)?)\s*galon/)
  if (explicitQty) {
    return Math.min(GALLON_CAPACITY, parseGallonQuantity(explicitQty[1]))
  }

  return amount >= JOURNAL_REFILL_MIN_AMOUNT ? GALLON_CAPACITY : 0
}

function normalizeRefillQuantity(quantity: number) {
  if (quantity <= 0) return 0
  return Math.min(GALLON_CAPACITY, quantity)
}

function buildEvents(gallonRows: GallonStockRow[], journalEntries: JournalEntryRow[]) {
  const events: GallonStockEvent[] = []
  const seenJournalRefills = new Set<string>()

  ;(Array.isArray(gallonRows) ? gallonRows : []).forEach((row, index) => {
    const type = String(row.type || '').toLowerCase()
    const rawQuantity = parseGallonQuantity(row.quantity)
    const date = parseGallonStockDate(row.date || row.created_at)
    const dateKey = formatDateKey(date)

    if (type === 'penggunaan') {
      events.push({
        key: `gallons-usage-${row.id || index}`,
        date,
        type: 'usage',
        quantity: rawQuantity,
        source: 'gallons',
      })
    }

    if (['pembelian', 'isi ulang', 'refill'].includes(type)) {
      events.push({
        key: `gallons-refill-${dateKey}-${normalizeRefillQuantity(rawQuantity)}`,
        date,
        type: 'refill',
        quantity: normalizeRefillQuantity(rawQuantity),
        source: 'gallons',
      })
    }
  })

  ;(Array.isArray(journalEntries) ? journalEntries : []).forEach((entry) => {
    const description = String(entry.description || '')
    const amount = getJournalAmount(entry)
    const refillQuantity = getRefillQuantityFromDescription(description, amount)
    if (refillQuantity <= 0) return

    const date = parseGallonStockDate(entry.date || entry.created_at)
    const fingerprint = [
      formatDateKey(date),
      description.trim().toLowerCase(),
      amount,
      refillQuantity,
    ].join('|')

    if (seenJournalRefills.has(fingerprint)) return
    seenJournalRefills.add(fingerprint)

    events.push({
      key: `journal-refill-${entry.id || fingerprint}`,
      date,
      type: 'refill',
      quantity: refillQuantity,
      source: 'journal',
    })
  })

  return events
    .filter(event => event.quantity > 0)
    .sort((a, b) => a.date.getTime() - b.date.getTime())
}

export function calculateGallonStock({
  gallonRows = [],
  journalEntries = [],
}: {
  gallonRows?: GallonStockRow[]
  journalEntries?: JournalEntryRow[]
}): GallonStockSummary {
  const events = buildEvents(gallonRows, journalEntries)
  let stock = 0
  let refilled = 0
  let used = 0

  events.forEach((event) => {
    if (event.type === 'refill') {
      refilled += event.quantity
      stock = Math.min(GALLON_CAPACITY, stock + event.quantity)
    } else {
      used += event.quantity
      stock = Math.max(0, stock - event.quantity)
    }
  })

  return {
    capacity: GALLON_CAPACITY,
    refilled,
    used,
    stock,
    events,
  }
}

export function calculateGallonStockFromRows(rows: GallonStockRow[]) {
  return calculateGallonStock({ gallonRows: rows })
}

export function isReliableGallonPrediction(usageCount: number, avgConsumption: number) {
  return usageCount >= MIN_USAGE_RECORDS_FOR_PREDICTION && avgConsumption >= MIN_AVG_CONSUMPTION_FOR_PREDICTION
}

export function daysBetween(startDate: Date, endDate: Date) {
  const diff = Math.ceil((endDate.getTime() - startDate.getTime()) / DAY_MS)
  return Math.max(1, diff)
}

export function formatGallonQuantity(value: number) {
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value)
}
