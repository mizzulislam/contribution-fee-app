export type AccountType = 'Assets' | 'Liabilities' | 'Equity' | 'Revenues' | 'Expenses'

export type NormalBalance = 'Debit' | 'Credit'

export interface Account {
  accountNumber: string
  accountName: string
  accountType: AccountType
  normalBalance: NormalBalance
}

export interface JournalEntryLine {
  accountNumber: string
  amount: number
}

export interface JournalEntry {
  id: string
  date: string
  debits: JournalEntryLine[]
  credits: JournalEntryLine[]
  description: string
}

export interface LedgerAccount {
  account: Account
  entries: {
    date: string
    description: string
    debit: number
    credit: number
    balance: number // Running balance
  }[]
  currentBalance: number
}

export interface TrialBalanceItem {
  accountNumber: string
  accountName: string
  debit: number
  credit: number
}

export interface FinancialStatements {
  incomeStatement: {
    revenues: number
    expenses: number
    netIncome: number
  }
  retainedEarningsStatement: {
    beginningRetainedEarnings: number
    netIncome: number
    dividends: number
    endingRetainedEarnings: number
  }
  balanceSheet: {
    assets: {
      currentAssets: number
      propertyPlantEquipment: number
      intangibleAssets: number
      totalAssets: number
    }
    liabilities: {
      currentLiabilities: number
      longTermLiabilities: number
      totalLiabilities: number
    }
    equity: {
      stockholdersEquity: number // Includes ending retained earnings
      totalEquity: number
    }
    totalLiabilitiesAndEquity: number
  }
}
