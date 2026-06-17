import { GeneralJournal } from './GeneralJournal'
import { GeneralLedger } from './GeneralLedger'
import type { JournalEntryLine } from './types'

export class ClosingProcess {
  private ledger: GeneralLedger
  private journal: GeneralJournal

  constructor(ledger: GeneralLedger, journal: GeneralJournal) {
    this.ledger = ledger
    this.journal = journal
  }

  /**
   * Close the books at the end of the accounting period.
   * Four steps:
   * 1. Close Revenues to Income Summary
   * 2. Close Expenses to Income Summary
   * 3. Close Income Summary to Retained Earnings
   * 4. Close Dividends to Retained Earnings
   */
  public closeBooks(date: string): void {
    const ledgers = this.ledger.getAllLedgers()
    
    const revenueDebits: JournalEntryLine[] = []
    let totalRevenue = 0
    
    const expenseCredits: JournalEntryLine[] = []
    let totalExpense = 0
    
    let dividendsToClose = 0

    ledgers.forEach(l => {
      const bal = l.currentBalance
      if (bal === 0) return

      if (l.account.accountType === 'Revenues') {
        // Normal balance is Credit. To close, we Debit it.
        revenueDebits.push({ accountNumber: l.account.accountNumber, amount: bal })
        totalRevenue += bal
      }
      
      if (l.account.accountType === 'Expenses') {
        // Normal balance is Debit. To close, we Credit it.
        expenseCredits.push({ accountNumber: l.account.accountNumber, amount: bal })
        totalExpense += bal
      }

      if (l.account.accountNumber === '3301' || l.account.accountNumber === '332') { // Prive Pemilik / Dividends
        dividendsToClose += bal
      }
    })

    const incomeSummaryAcc = '3500' // Income Summary
    const retainedEarningsAcc = '3201' // Retained Earnings

    // Step 1: Close Revenues
    if (revenueDebits.length > 0) {
      const entry = this.journal.journalize(
        date, 
        revenueDebits, 
        [{ accountNumber: incomeSummaryAcc, amount: totalRevenue }], 
        'Closing Entry: Close Revenues to Income Summary'
      )
      this.ledger.postEntry(entry)
    }

    // Step 2: Close Expenses
    if (expenseCredits.length > 0) {
      const entry = this.journal.journalize(
        date, 
        [{ accountNumber: incomeSummaryAcc, amount: totalExpense }], 
        expenseCredits, 
        'Closing Entry: Close Expenses to Income Summary'
      )
      this.ledger.postEntry(entry)
    }

    // Step 3: Close Income Summary to Retained Earnings
    // Get the updated Income Summary balance
    const incomeSummaryLedger = this.ledger.getLedger(incomeSummaryAcc)
    const netIncome = incomeSummaryLedger ? incomeSummaryLedger.currentBalance : 0

    if (netIncome > 0) {
      // Net Income (Credit balance). To close, Debit Income Summary, Credit RE.
      const entry = this.journal.journalize(
        date,
        [{ accountNumber: incomeSummaryAcc, amount: netIncome }],
        [{ accountNumber: retainedEarningsAcc, amount: netIncome }],
        'Closing Entry: Close Net Income to Retained Earnings'
      )
      this.ledger.postEntry(entry)
    } else if (netIncome < 0) {
      // Net Loss (would be handled differently based on exact logic, but for simplicity we assume Math.abs logic)
      const entry = this.journal.journalize(
        date,
        [{ accountNumber: retainedEarningsAcc, amount: Math.abs(netIncome) }],
        [{ accountNumber: incomeSummaryAcc, amount: Math.abs(netIncome) }],
        'Closing Entry: Close Net Loss to Retained Earnings'
      )
      this.ledger.postEntry(entry)
    }

    // Step 4: Close Dividends
    if (dividendsToClose > 0) {
      const divAcc = this.ledger.getLedger('3301') ? '3301' : '332'
      // Dividends have Debit balance. To close, Credit Dividends, Debit RE.
      const entry = this.journal.journalize(
        date,
        [{ accountNumber: retainedEarningsAcc, amount: dividendsToClose }],
        [{ accountNumber: divAcc, amount: dividendsToClose }],
        'Closing Entry: Close Dividends to Retained Earnings'
      )
      this.ledger.postEntry(entry)
    }
  }
}
