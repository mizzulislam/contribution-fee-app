import { GeneralLedger } from './GeneralLedger'
import type { FinancialStatements } from './types'

export class FinancialStatementsGenerator {
  private ledger: GeneralLedger

  constructor(ledger: GeneralLedger) {
    this.ledger = ledger
  }

  public generate(): FinancialStatements {
    const ledgers = this.ledger.getAllLedgers()
    
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

    // Categorize balances based on Account Type and Number (Simplified Classification)
    ledgers.forEach(l => {
      const bal = l.currentBalance
      if (bal === 0) return

      const type = l.account.accountType
      const num = l.account.accountNumber

      if (type === 'Revenues') revenues += bal
      if (type === 'Expenses') expenses += bal
      
      if (type === 'Assets') {
        // Updated heuristic for 4-digit account numbers: 1000-1499 Current, 1500-1899 PPE (including contra-asset), 1900+ Intangible
        const n = parseInt(num, 10)
        if (n >= 1000 && n < 1500) currentAssets += bal
        else if (n >= 1500 && n < 1900) {
          // Note: Accumulated Depreciation has normal balance Credit calculated as negative usually in net PPE
          propertyPlantEquipment += bal
        }
        else intangibleAssets += bal
      }

      if (type === 'Liabilities') {
        // Updated: 2000-2499 Current, 2500+ Long-Term
        const n = parseInt(num, 10)
        if (n >= 2000 && n < 2500) currentLiabilities += bal
        else longTermLiabilities += bal
      }

      if (type === 'Equity') {
        // Aligned standard accounts: 3101/311 modal, 3201/320 laba ditahan, 3301/332 prive
        if (num === '3101' || num === '311') commonStock += bal
        if (num === '3201' || num === '320') retainedEarnings += bal
        if (num === '3301' || num === '332') dividends += bal // Dividends have normal balance Debit
      }
    })

    // 1. Income Statement
    const netIncome = revenues - expenses

    // 2. Retained Earnings Statement
    const endingRetainedEarnings = retainedEarnings + netIncome - dividends

    // 3. Balance Sheet
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
}
