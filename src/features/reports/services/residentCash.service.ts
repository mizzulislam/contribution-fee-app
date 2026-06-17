import { defaultEngine, syncAccountingWithSheet } from '@/features/accounting'
import type { Account, FinancialStatements, JournalEntry, JournalEntryLine } from '@/features/accounting'
import { buildPeriodAccountingEngine, type PeriodFilter } from '@/features/accounting/calculations/period'

export interface ResidentCashMutation {
  id: string
  date: string
  category: string
  description: string
  moneyIn: number
  moneyOut: number
  balanceAfter: number
  sourceStatus: string
}

export interface ResidentCashSummary {
  balance: number
  incomingThisMonth: number
  outgoingThisMonth: number
  totalIncoming: number
  totalOutgoing: number
}

export interface ResidentFinancialReport {
  statements: FinancialStatements
  rows: {
    label: string
    value: number
    tone: 'neutral' | 'success' | 'danger'
  }[]
}

export interface ResidentCashTransparencyData {
  summary: ResidentCashSummary
  mutations: ResidentCashMutation[]
  categories: string[]
  report: ResidentFinancialReport
}

function normalizeAmount(value: unknown) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (!value) return 0

  const amount = Number(
    String(value)
      .replace(/[^\d,.-]/g, '')
      .replace(/\.(?=\d{3}(\D|$))/g, '')
      .replace(',', '.')
  )

  return Number.isFinite(amount) ? amount : 0
}

function normalizeLines(lines: JournalEntryLine[]) {
  return lines.map(line => ({
    accountNumber: String(line.accountNumber),
    amount: normalizeAmount(line.amount),
  }))
}

function formatDateKey(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().split('T')[0]
}

function isThisMonth(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return false

  const now = new Date()
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()
}

function getAccount(accountNumber: string) {
  return defaultEngine.coa.getAccount(accountNumber)
}

function isCashAccount(accountNumber: string) {
  const account = getAccount(accountNumber)
  if (!account || account.accountType !== 'Assets') return false

  const accountName = account.accountName.toLowerCase()
  return /\bkas\b|bank|gopay|cash/.test(accountName)
}

function getCounterpartAccounts(lines: JournalEntryLine[]) {
  return lines
    .filter(line => !isCashAccount(String(line.accountNumber)))
    .map(line => getAccount(String(line.accountNumber)))
    .filter((account): account is Account => Boolean(account))
}

function getResidentCategory(entry: JournalEntry, moneyIn: number) {
  const source = String(entry.source || '').toLowerCase()
  const description = String(entry.description || '').toLowerCase()
  const counterpartAccounts = moneyIn > 0
    ? getCounterpartAccounts(entry.credits)
    : getCounterpartAccounts(entry.debits)

  if (source.includes('bill') || source.includes('payment') || description.includes('tagihan') || description.includes('pembayaran')) {
    return 'Pembayaran Warga'
  }

  if (counterpartAccounts.some(account => account.accountType === 'Revenues')) {
    return 'Pemasukan Kos'
  }

  if (counterpartAccounts.some(account => account.accountType === 'Expenses')) {
    return 'Kebutuhan Operasional'
  }

  if (description.includes('galon')) {
    return moneyIn > 0 ? 'Kas Galon' : 'Kebutuhan Galon'
  }

  if (counterpartAccounts.some(account => account.accountType === 'Liabilities')) {
    return 'Titipan atau Hutang'
  }

  if (counterpartAccounts.some(account => account.accountType === 'Equity')) {
    return moneyIn > 0 ? 'Setoran Modal' : 'Penarikan Pemilik'
  }

  return moneyIn > 0 ? 'Pemasukan Lainnya' : 'Pengeluaran Lainnya'
}

function getSourceStatus(entry: JournalEntry) {
  const source = String(entry.source || '').toLowerCase()

  if (source.includes('billing') || source.includes('bill')) return 'Dari Modul Tagihan'
  if (source.includes('payment')) return 'Dari Modul Pembayaran'
  if (source.includes('expense')) return 'Dari Modul Pengeluaran'
  if (source.includes('gallon')) return 'Dari Modul Galon'
  if (source.includes('closing')) return 'Jurnal Penutup'
  if (source.includes('adjust')) return 'Penyesuaian Admin'
  return 'Tersinkron dari Akuntansi'
}

function buildMutations(entries: JournalEntry[]) {
  let runningBalance = 0

  return [...entries]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime() || String(a.id).localeCompare(String(b.id)))
    .reduce<ResidentCashMutation[]>((mutations, entry) => {
      const debits = normalizeLines(entry.debits)
      const credits = normalizeLines(entry.credits)
      const cashIn = debits
        .filter(line => isCashAccount(line.accountNumber))
        .reduce((sum, line) => sum + line.amount, 0)
      const cashOut = credits
        .filter(line => isCashAccount(line.accountNumber))
        .reduce((sum, line) => sum + line.amount, 0)
      const netCash = cashIn - cashOut

      runningBalance += netCash

      if (netCash === 0) return mutations

      const moneyIn = Math.max(netCash, 0)
      const moneyOut = Math.max(-netCash, 0)

      mutations.push({
        id: entry.id,
        date: formatDateKey(entry.date) || entry.date,
        category: getResidentCategory(entry, moneyIn),
        description: entry.description || 'Transaksi kas kos',
        moneyIn,
        moneyOut,
        balanceAfter: runningBalance,
        sourceStatus: getSourceStatus(entry),
      })

      return mutations
    }, [])
}

function buildSummary(mutations: ResidentCashMutation[]): ResidentCashSummary {
  return mutations.reduce<ResidentCashSummary>((summary, mutation) => {
    summary.balance = mutation.balanceAfter
    summary.totalIncoming += mutation.moneyIn
    summary.totalOutgoing += mutation.moneyOut

    if (isThisMonth(mutation.date)) {
      summary.incomingThisMonth += mutation.moneyIn
      summary.outgoingThisMonth += mutation.moneyOut
    }

    return summary
  }, {
    balance: 0,
    incomingThisMonth: 0,
    outgoingThisMonth: 0,
    totalIncoming: 0,
    totalOutgoing: 0,
  })
}

function buildReport(statements: FinancialStatements, cashBalance: number): ResidentFinancialReport {
  const netIncome = statements.incomeStatement.netIncome

  return {
    statements,
    rows: [
      { label: 'Total Pemasukan', value: statements.incomeStatement.revenues, tone: 'success' },
      { label: 'Total Pengeluaran', value: statements.incomeStatement.expenses, tone: 'danger' },
      { label: netIncome >= 0 ? 'Sisa Hasil Operasional' : 'Defisit Operasional', value: netIncome, tone: netIncome >= 0 ? 'success' : 'danger' },
      { label: 'Saldo Kas Saat Ini', value: cashBalance, tone: 'neutral' },
      { label: 'Total Aset Tercatat', value: statements.balanceSheet.assets.totalAssets, tone: 'neutral' },
      { label: 'Kewajiban Tercatat', value: statements.balanceSheet.liabilities.totalLiabilities, tone: 'neutral' },
      { label: 'Arus Kas Bersih', value: statements.cashFlowStatement.netCashFlow, tone: statements.cashFlowStatement.netCashFlow >= 0 ? 'success' : 'danger' },
    ],
  }
}

export async function getResidentCashTransparency(period?: PeriodFilter): Promise<ResidentCashTransparencyData> {
  await syncAccountingWithSheet()

  const mutations = buildMutations(defaultEngine.journal.getEntries())
  const summary = buildSummary(mutations)
  const periodEngine = period && period.preset !== 'all' ? buildPeriodAccountingEngine(period) : defaultEngine
  const statements = periodEngine.getFinancialStatements()

  return {
    summary,
    mutations: [...mutations].reverse(),
    categories: Array.from(new Set(mutations.map(mutation => mutation.category))).sort((a, b) => a.localeCompare(b)),
    report: buildReport(statements, summary.balance),
  }
}

export async function getResidentCashSnapshot() {
  const data = await getResidentCashTransparency()
  return data.summary
}
