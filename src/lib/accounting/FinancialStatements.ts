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
        // Simplified heuristic: 100-149 Current, 150-189 PPE (including contra-asset), 190+ Intangible
        const n = parseInt(num, 10)
        if (n >= 100 && n < 150) currentAssets += bal
        else if (n >= 150 && n < 190) {
          // Note: Accumulated Depreciation has normal balance Debit calculated as negative usually, 
          // or if Normal Balance is Credit, it subtracts. In our GL logic, if an asset gets a credit, balance reduces.
          // So the balance is net PPE.
          propertyPlantEquipment += bal
        }
        else intangibleAssets += bal
      }

      if (type === 'Liabilities') {
        // Simplified: 200-249 Current, 250+ Long-Term
        const n = parseInt(num, 10)
        if (n >= 200 && n < 250) currentLiabilities += bal
        else longTermLiabilities += bal
      }

      if (type === 'Equity') {
        if (num === '311') commonStock += bal
        if (num === '320') retainedEarnings += bal
        if (num === '332') dividends += bal // Dividends have normal balance Debit, so GL calculates it as positive if debited
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
