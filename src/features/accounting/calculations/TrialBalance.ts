import { GeneralLedger } from './GeneralLedger'
import { GeneralJournal } from './GeneralJournal'
import type { TrialBalanceItem, JournalEntryLine } from './types'

export class TrialBalance {
  private ledger: GeneralLedger
  private journal: GeneralJournal

  constructor(ledger: GeneralLedger, journal: GeneralJournal) {
    this.ledger = ledger
    this.journal = journal
  }

  /**
   * Generates Trial Balance from Ledger balances
   * Helps prove that Total Debits = Total Credits
   */
  public generate(): TrialBalanceItem[] {
    const items: TrialBalanceItem[] = []
    
    this.ledger.getAllLedgers().forEach(l => {
      if (l.currentBalance === 0) return // Skip empty accounts if desired, but usually we list them if they had activity

      let debit = 0
      let credit = 0

      if (l.account.normalBalance === 'Debit') {
        debit = l.currentBalance
      } else {
        credit = l.currentBalance
      }

      items.push({
        accountNumber: l.account.accountNumber,
        accountName: l.account.accountName,
        debit,
        credit
      })
    })

    return items.sort((a, b) => a.accountNumber.localeCompare(b.accountNumber))
  }

  public verifyEquality(items: TrialBalanceItem[]): boolean {
    const totalDebit = items.reduce((sum, item) => sum + item.debit, 0)
    const totalCredit = items.reduce((sum, item) => sum + item.credit, 0)

    return Math.abs(totalDebit - totalCredit) < 0.001
  }

  /**
   * Processes adjusting entries for Deferrals and Accruals at the end of the period.
   * e.g., type: 'Deferral', description: 'Record expiration of prepaid insurance'
   */
  public adjustingEntries(date: string, type: 'Deferral' | 'Accrual', debits: JournalEntryLine[], credits: JournalEntryLine[], description: string): void {
    const fullDescription = `[Adjusting Entry - ${type}] ${description}`
    
    // Journalize the adjusting entry
    const entry = this.journal.journalize(date, debits, credits, fullDescription)
    
    // Post directly to ledger
    this.ledger.postEntry(entry)
  }
}
