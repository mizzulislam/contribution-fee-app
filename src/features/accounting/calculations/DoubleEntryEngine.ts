import { ChartOfAccounts } from './ChartOfAccounts'
import type { JournalEntryLine } from './types'

export class DoubleEntryEngine {
  private coa: ChartOfAccounts

  constructor(coa: ChartOfAccounts) {
    this.coa = coa
  }

  /**
   * Validate double entry logic
   * 1. Must have at least one debit and one credit
   * 2. Total Debits must equal Total Credits
   * 3. All accounts must exist in Chart of Accounts
   * 4. Amounts must be positive
   */
  public validate(debits: JournalEntryLine[], credits: JournalEntryLine[]): void {
    if (debits.length === 0 && credits.length === 0) {
      throw new Error('Transaction must have at least one entry.')
    }

    if (debits.length === 0 || credits.length === 0) {
      throw new Error('Transaction must have at least one debit and one credit (Double-Entry Principle).')
    }

    let totalDebit = 0
    let totalCredit = 0

    debits.forEach(d => {
      if (d.amount <= 0) throw new Error('Debit amounts must be greater than zero.')
      if (!this.coa.getAccount(d.accountNumber)) {
        throw new Error(`Debit Account ${d.accountNumber} not found in Chart of Accounts.`)
      }
      totalDebit += d.amount
    })

    credits.forEach(c => {
      if (c.amount <= 0) throw new Error('Credit amounts must be greater than zero.')
      if (!this.coa.getAccount(c.accountNumber)) {
        throw new Error(`Credit Account ${c.accountNumber} not found in Chart of Accounts.`)
      }
      totalCredit += c.amount
    })

    // To avoid floating point issues, we compare up to 2 decimal places by rounding, or simply use integers.
    // Assuming amounts are integers/cents, or standard floats, but let's do a safe comparison:
    if (Math.abs(totalDebit - totalCredit) > 0.001) {
      throw new Error(`Transaction is not balanced! Total Debits: ${totalDebit}, Total Credits: ${totalCredit}`)
    }
  }
}
