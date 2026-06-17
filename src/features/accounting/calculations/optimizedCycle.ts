import { ChartOfAccounts } from './ChartOfAccounts'
import { GeneralLedger } from './GeneralLedger'
import type { 
  JournalEntry, 
  JournalEntryLine, 
  AdjustedTrialBalanceItem, 
  FinancialStatements, 
  AccountType,
  AssetItem
} from './types'

/**
 * Parser helper to extract target month-year pairs from a string (e.g. "Juni - Agustus 2026")
 * and map them to their corresponding 0-indexed month and year.
 */
export function parseTargetMonths(
  monthStr: string, 
  paymentDateStr?: string, 
  defaultYear?: number
): { year: number; month: number }[] {
  const cleanStr = (monthStr || '').toLowerCase().trim()
  const currentYear = defaultYear || new Date().getFullYear()

  // Match 4-digit years in the string
  const yearRegex = /\b(20\d{2})\b/g
  const years = cleanStr.match(yearRegex)
  let baseYear = currentYear
  if (years && years.length > 0) {
    baseYear = parseInt(years[years.length - 1], 10)
  } else if (paymentDateStr) {
    const d = new Date(paymentDateStr)
    if (!isNaN(d.getTime())) {
      baseYear = d.getFullYear()
    }
  }

  const MONTHS_MAP: Record<string, number> = {
    januari: 0, jan: 0,
    februari: 1, feb: 1, pebruari: 1,
    maret: 2, mar: 2,
    april: 3, apr: 3,
    mei: 4, may: 4,
    juni: 5, jun: 5,
    juli: 6, jul: 6,
    agustus: 7, agt: 7, ags: 7,
    september: 8, sep: 8, sept: 8,
    oktober: 9, okt: 9,
    november: 10, nov: 10,
    desember: 11, des: 11, dec: 11
  }

  // Check for range of months, e.g. "Juni - Agustus" or "Juni sd Agustus"
  const parts = cleanStr.split(/[-–—/]|sd|s\.d\.|sampai|hingga|dan/)
  if (parts.length >= 2) {
    const startPart = parts[0].trim()
    const endPart = parts[parts.length - 1].trim()

    let startMonthIdx = -1
    let endMonthIdx = -1

    for (const [key, val] of Object.entries(MONTHS_MAP)) {
      if (startPart.includes(key)) {
        startMonthIdx = val
        break
      }
    }
    for (const [key, val] of Object.entries(MONTHS_MAP)) {
      if (endPart.includes(key)) {
        endMonthIdx = val
        break
      }
    }

    if (startMonthIdx !== -1 && endMonthIdx !== -1) {
      const list: { year: number; month: number }[] = []
      let currentMonth = startMonthIdx
      let currentY = baseYear

      // If the range crosses a year boundary (e.g. Desember 2025 - Februari 2026)
      if (startMonthIdx > endMonthIdx && years && years.length >= 2) {
        const startYear = parseInt(years[0], 10)
        const endYear = parseInt(years[1], 10)
        currentY = startYear
        while (currentY < endYear || (currentY === endYear && currentMonth <= endMonthIdx)) {
          list.push({ year: currentY, month: currentMonth })
          currentMonth++
          if (currentMonth > 11) {
            currentMonth = 0
            currentY++
          }
        }
        return list
      } else {
        // Standard range within the same year
        for (let m = startMonthIdx; m <= endMonthIdx; m++) {
          list.push({ year: baseYear, month: m })
        }
        return list
      }
    }
  }

  // Format check for YYYY-MM (e.g. 2026-06)
  const yyyymm = cleanStr.match(/\b(20\d{2})[-/](0[1-9]|1[0-2])\b/)
  if (yyyymm) {
    return [{ year: parseInt(yyyymm[1], 10), month: parseInt(yyyymm[2], 10) - 1 }]
  }

  // Search for any individual month name
  for (const [key, val] of Object.entries(MONTHS_MAP)) {
    if (cleanStr.includes(key)) {
      return [{ year: baseYear, month: val }]
    }
  }

  // Fallback: use paymentDateStr if parseable
  if (paymentDateStr) {
    const d = new Date(paymentDateStr)
    if (!isNaN(d.getTime())) {
      return [{ year: d.getFullYear(), month: d.getMonth() }]
    }
  }

  return [{ year: baseYear, month: new Date().getMonth() }]
}

/**
 * Task 1: Adjusting Entries Module (Jurnal Penyesuaian)
 * Generates adjusting entries for Deferrals (Unearned Rent Revenue) and Accruals (Asset Depreciation).
 */
export function generateAdjustingEntries(
  payments: any[], 
  assets: AssetItem[], 
  date: string
): JournalEntry[] {
  const entries: JournalEntry[] = []
  const adjDateObj = new Date(date)
  if (isNaN(adjDateObj.getTime())) return []

  const adjYear = adjDateObj.getFullYear()
  const adjMonth = adjDateObj.getMonth()
  const timestampStr = Date.now().toString()

  // 1. Unearned Rent Logic (Deferred Revenue adjustment)
  // For each payment, if it is lunas/verified, we determine the portion earned in the adjustment month.
  // Debit: Unearned Rent Revenue (2102), Credit: Rent Revenue (4101).
  const validPayments = Array.isArray(payments) ? payments : []
  validPayments.forEach((p, idx) => {
    const isPaid = ['paid', 'verified', 'Lunas'].includes(p.status)
    if (!isPaid || !p.amount) return

    const targetMonths = parseTargetMonths(
      p.month || p.title || '', 
      p.date || p.date_submitted || p.created_at, 
      adjYear
    )
    if (targetMonths.length === 0) return

    // Check if the current adjustment month falls within the target months covered by this payment
    const coversCurrentMonth = targetMonths.some(m => m.year === adjYear && m.month === adjMonth)
    if (coversCurrentMonth) {
      // Straight-line allocation of payment amount to target months
      const monthlyEarnedAmount = Math.round(Number(p.amount) / targetMonths.length)

      if (monthlyEarnedAmount > 0) {
        entries.push({
          id: `ADJ-RENT-${idx}-${timestampStr.slice(-5)}`,
          date,
          debits: [{ accountNumber: '2102', amount: monthlyEarnedAmount }], // Debit Unearned Rent (Liability decrease)
          credits: [{ accountNumber: '4101', amount: monthlyEarnedAmount }], // Credit Rent Revenue (Revenue increase)
          description: `Penyesuaian Sewa Kamar: Realisasi Uang Muka ${p.resident_name || 'Penghuni'} (Kamar ${p.room_number || '-'})`,
          source: 'unearned_rent',
          source_id: String(p.id)
        })
      }
    }
  })

  // 2. Depreciation Logic (Straight-line monthly asset depreciation)
  // Monthly Depreciation = (Cost - Salvage Value) / Useful Life in Months.
  // Debit: Depreciation Expense (5107), Credit: Accumulated Depreciation (1502).
  const validAssets = Array.isArray(assets) ? assets : []
  validAssets.forEach((asset, idx) => {
    if (!asset.cost || !asset.purchaseDate) return

    const purchaseDateObj = new Date(asset.purchaseDate)
    if (isNaN(purchaseDateObj.getTime())) return

    const purchaseYear = purchaseDateObj.getFullYear()
    const purchaseMonth = purchaseDateObj.getMonth()

    // Useful life in months (defaulting to 5 years / 60 months if not specified)
    let usefulLifeMonths = asset.usefulLifeMonths
    if (!usefulLifeMonths && asset.usefulLifeYears) {
      usefulLifeMonths = asset.usefulLifeYears * 12
    }
    if (!usefulLifeMonths) {
      usefulLifeMonths = 60 // 5 years default
    }

    // Number of months since purchase
    const monthsElapsed = (adjYear - purchaseYear) * 12 + (adjMonth - purchaseMonth)

    // Depreciation is recorded starting from the purchase month up to the end of its useful life
    if (monthsElapsed >= 0 && monthsElapsed < usefulLifeMonths) {
      const salvage = asset.salvageValue || 0
      const monthlyDepr = Math.round((asset.cost - salvage) / usefulLifeMonths)

      if (monthlyDepr > 0) {
        entries.push({
          id: `ADJ-DEPR-${idx}-${timestampStr.slice(-5)}`,
          date,
          debits: [{ accountNumber: '5107', amount: monthlyDepr }], // Debit Depreciation Expense
          credits: [{ accountNumber: '1502', amount: monthlyDepr }], // Credit Accumulated Depreciation
          description: `Penyesuaian Penyusutan Aset Tetap: ${asset.name}`,
          source: 'depreciation',
          source_id: String(asset.id)
        })
      }
    }
  })

  return entries
}

/**
 * Task 2: Ledger & Trial Balance Aggregator (Buku Besar & Neraca Saldo)
 * Iterates through journal entries and aggregates running and ending balances.
 * Guarantees that Total Debits strictly equals Total Credits.
 */
export function buildTrialBalance(
  masterData: any[], 
  journalEntries: any[]
): AdjustedTrialBalanceItem[] {
  const coa = new ChartOfAccounts()
  coa.clear()

  const typeMap: Record<string, AccountType> = {
    'harta': 'Assets',
    'kewajiban': 'Liabilities',
    'modal': 'Equity',
    'pendapatan': 'Revenues',
    'beban': 'Expenses',
    'assets': 'Assets',
    'liabilities': 'Liabilities',
    'equity': 'Equity',
    'revenues': 'Revenues',
    'expenses': 'Expenses'
  }

  const validMasterData = Array.isArray(masterData) ? masterData : []
  validMasterData.forEach(acc => {
    const status = acc.status || 'Aktif'
    if (status === 'Aktif') {
      const typeStr = (acc.account_type || acc.type || 'Beban').toLowerCase()
      const mappedType = typeMap[typeStr] || 'Expenses'
      coa.addAccount(
        String(acc.account_number || acc.accountNumber), 
        acc.account_name || acc.accountName || 'Akun Tanpa Nama', 
        mappedType
      )
    }
  })

  const ledger = new GeneralLedger(coa)

  const parseLines = (lines: any): JournalEntryLine[] => {
    if (!lines) return []
    if (Array.isArray(lines)) {
      return lines.map(l => ({
        accountNumber: String(l.accountNumber || l.account_number),
        amount: Number(l.amount) || 0
      }))
    }
    if (typeof lines === 'string') {
      try {
        const parsed = JSON.parse(lines)
        return Array.isArray(parsed) ? parsed.map((l: any) => ({
          accountNumber: String(l.accountNumber || l.account_number),
          amount: Number(l.amount) || 0
        })) : []
      } catch {
        return []
      }
    }
    return []
  }

  const validEntries = Array.isArray(journalEntries) ? journalEntries : []
  validEntries.forEach(je => {
    const debits = parseLines(je.debits)
    const credits = parseLines(je.credits)
    if (debits.length > 0 || credits.length > 0) {
      ledger.postEntry({
        id: String(je.id),
        date: je.date || '',
        description: je.description || '',
        debits,
        credits
      })
    }
  })

  const items: AdjustedTrialBalanceItem[] = []
  coa.getAllAccounts().forEach(acc => {
    const ledgerAcc = ledger.getLedger(acc.accountNumber)
    const currentBalance = ledgerAcc ? ledgerAcc.currentBalance : 0

    let debit = 0
    let credit = 0

    if (acc.normalBalance === 'Debit') {
      if (currentBalance >= 0) {
        debit = currentBalance
      } else {
        credit = Math.abs(currentBalance)
      }
    } else {
      if (currentBalance >= 0) {
        credit = currentBalance
      } else {
        debit = Math.abs(currentBalance)
      }
    }

    items.push({
      accountNumber: acc.accountNumber,
      accountName: acc.accountName,
      accountType: acc.accountType,
      debit,
      credit
    })
  })

  return items.sort((a, b) => a.accountNumber.localeCompare(b.accountNumber))
}

/**
 * Task 3: Financial Statements Generator (Laporan Keuangan)
 * Maps Trial Balance accounts to Multiple-Step Income Statement, Retained Earnings Statement,
 * and Classified Balance Sheet (IFRS/GAAP compliant).
 */
export function generateFinancialStatements(
  trialBalance: AdjustedTrialBalanceItem[]
): FinancialStatements {
  let revenues = 0
  let expenses = 0

  let currentAssets = 0
  let propertyPlantEquipment = 0
  let intangibleAssets = 0

  let currentLiabilities = 0
  let longTermLiabilities = 0

  let commonStock = 0
  let retainedEarnings = 0
  let dividends = 0

  const items = Array.isArray(trialBalance) ? trialBalance : []
  items.forEach(item => {
    const type = item.accountType
    const num = item.accountNumber
    const bal = item.debit - item.credit // Net debit
    const creditBal = item.credit - item.debit // Net credit

    if (type === 'Revenues') {
      revenues += creditBal
    } else if (type === 'Expenses') {
      expenses += bal
    } else if (type === 'Assets') {
      const n = parseInt(num, 10)
      if (n >= 1000 && n < 1500) {
        currentAssets += bal
      } else if (n >= 1500 && n < 1900) {
        propertyPlantEquipment += bal // Contra-assets (Accumulated Depreciation) are naturally subtracted here (net PPE)
      } else {
        intangibleAssets += bal
      }
    } else if (type === 'Liabilities') {
      const n = parseInt(num, 10)
      if (n >= 2000 && n < 2500) {
        currentLiabilities += creditBal
      } else {
        longTermLiabilities += creditBal
      }
    } else if (type === 'Equity') {
      if (num === '3101' || num === '311') {
        commonStock += creditBal
      } else if (num === '3201' || num === '320') {
        retainedEarnings += creditBal
      } else if (num === '3301' || num === '332') {
        dividends += bal
      } else {
        commonStock += creditBal
      }
    }
  })

  // 1. Multiple-Step Income Statement
  const netIncome = revenues - expenses

  // 2. Retained Earnings Statement
  const endingRetainedEarnings = retainedEarnings + netIncome - dividends

  // 3. Classified Balance Sheet
  const totalAssets = currentAssets + propertyPlantEquipment + intangibleAssets
  const totalLiabilities = currentLiabilities + longTermLiabilities
  const totalEquity = commonStock + endingRetainedEarnings
  const totalLiabilitiesAndEquity = totalLiabilities + totalEquity

  return {
    incomeStatement: {
      revenues,
      expenses,
      netIncome
    },
    retainedEarningsStatement: {
      beginningRetainedEarnings: retainedEarnings,
      netIncome,
      dividends,
      endingRetainedEarnings
    },
    balanceSheet: {
      assets: {
        currentAssets,
        propertyPlantEquipment,
        intangibleAssets,
        totalAssets
      },
      liabilities: {
        currentLiabilities,
        longTermLiabilities,
        totalLiabilities
      },
      equity: {
        stockholdersEquity: totalEquity,
        totalEquity
      },
      totalLiabilitiesAndEquity
    }
  }
}

/**
 * Task 4: Closing the Books Module (Jurnal Penutup)
 * Generates year-end journal entries to close out nominal accounts to Retained Earnings.
 */
export function generateClosingEntries(
  trialBalance: AdjustedTrialBalanceItem[], 
  date: string
): JournalEntry[] {
  const entries: JournalEntry[] = []
  const timestampStr = Date.now().toString()

  const incomeSummaryAcc = '3500'
  const retainedEarningsAcc = '3201'
  const dividendsAcc = '3301'

  // Step 1: Debit Revenue accounts, Credit Income Summary
  const revenueLinesToClose: JournalEntryLine[] = []
  let totalRevenue = 0

  const items = Array.isArray(trialBalance) ? trialBalance : []
  items.forEach(item => {
    if (item.accountType === 'Revenues') {
      const balance = item.credit - item.debit
      if (balance > 0) {
        revenueLinesToClose.push({ accountNumber: item.accountNumber, amount: balance })
        totalRevenue += balance
      }
    }
  })

  if (revenueLinesToClose.length > 0) {
    entries.push({
      id: `CL-REV-${timestampStr.slice(-5)}`,
      date,
      debits: revenueLinesToClose,
      credits: [{ accountNumber: incomeSummaryAcc, amount: totalRevenue }],
      description: 'Jurnal Penutup: Menutup Akun Pendapatan ke Ikhtisar Laba Rugi'
    })
  }

  // Step 2: Debit Income Summary, Credit Expense accounts
  const expenseLinesToClose: JournalEntryLine[] = []
  let totalExpense = 0

  items.forEach(item => {
    if (item.accountType === 'Expenses') {
      const balance = item.debit - item.credit
      if (balance > 0) {
        expenseLinesToClose.push({ accountNumber: item.accountNumber, amount: balance })
        totalExpense += balance
      }
    }
  })

  if (expenseLinesToClose.length > 0) {
    entries.push({
      id: `CL-EXP-${timestampStr.slice(-5)}`,
      date,
      debits: [{ accountNumber: incomeSummaryAcc, amount: totalExpense }],
      credits: expenseLinesToClose,
      description: 'Jurnal Penutup: Menutup Akun Beban ke Ikhtisar Laba Rugi'
    })
  }

  // Step 3: Close Income Summary to Retained Earnings
  const netIncome = totalRevenue - totalExpense
  if (netIncome > 0) {
    // Net Income (Credit Balance): Debit Income Summary, Credit Retained Earnings
    entries.push({
      id: `CL-INC-${timestampStr.slice(-5)}`,
      date,
      debits: [{ accountNumber: incomeSummaryAcc, amount: netIncome }],
      credits: [{ accountNumber: retainedEarningsAcc, amount: netIncome }],
      description: 'Jurnal Penutup: Menutup Laba Tahun Berjalan ke Laba Ditahan'
    })
  } else if (netIncome < 0) {
    // Net Loss (Debit Balance): Credit Income Summary, Debit Retained Earnings
    entries.push({
      id: `CL-INC-${timestampStr.slice(-5)}`,
      date,
      debits: [{ accountNumber: retainedEarningsAcc, amount: Math.abs(netIncome) }],
      credits: [{ accountNumber: incomeSummaryAcc, amount: Math.abs(netIncome) }],
      description: 'Jurnal Penutup: Menutup Rugi Tahun Berjalan ke Laba Ditahan'
    })
  }

  // Step 4: Close Dividends / Prive Pemilik to Retained Earnings
  let totalDividends = 0
  items.forEach(item => {
    if (item.accountNumber === dividendsAcc || item.accountNumber === '332') {
      const balance = item.debit - item.credit
      if (balance > 0) {
        totalDividends += balance
      }
    }
  })

  if (totalDividends > 0) {
    entries.push({
      id: `CL-DIV-${timestampStr.slice(-5)}`,
      date,
      debits: [{ accountNumber: retainedEarningsAcc, amount: totalDividends }],
      credits: [{ accountNumber: dividendsAcc, amount: totalDividends }],
      description: 'Jurnal Penutup: Menutup Akun Prive Pemilik ke Laba Ditahan'
    })
  }

  return entries
}
