import { ChartOfAccounts } from './ChartOfAccounts'
import type { JournalEntry, LedgerAccount, NormalBalance } from './types'

export class GeneralLedger {
  private coa: ChartOfAccounts
  private ledgers: Map<string, LedgerAccount> = new Map()

  constructor(coa: ChartOfAccounts) {
    this.coa = coa
    this.initializeLedgers()
  }

  private initializeLedgers(): void {
    const accounts = this.coa.getAllAccounts()
    accounts.forEach(acc => {
      this.ensureLedger(acc.accountNumber)
    })
  }

  /**
   * Dynamically ensure a ledger exists for a newly added account
   */
  public ensureLedger(accountNumber: string): void {
    if (!this.ledgers.has(accountNumber)) {
      const acc = this.coa.getAccount(accountNumber)
      if (acc) {
        this.ledgers.set(accountNumber, {
          account: acc,
          entries: [],
          currentBalance: 0
        })
      }
    }
  }

  /**
   * Recalculates balance based on Normal Balance rule.
   * If Normal Balance is Debit: Balance = Debit - Credit
   * If Normal Balance is Credit: Balance = Credit - Debit
   */
  private computeBalance(normalBalance: NormalBalance, debit: number, credit: number, previousBalance: number): number {
    if (normalBalance === 'Debit') {
      return previousBalance + debit - credit
    } else {
      return previousBalance + credit - debit
    }
  }

  /**
   * Post a single Journal Entry to the Ledger
   */
  public postEntry(entry: JournalEntry): void {
    entry.debits.forEach(d => {
      const ledger = this.ledgers.get(d.accountNumber)
      if (ledger) {
        ledger.currentBalance = this.computeBalance(ledger.account.normalBalance, d.amount, 0, ledger.currentBalance)
        ledger.entries.push({
          date: entry.date,
          description: entry.description,
          debit: d.amount,
          credit: 0,
          balance: ledger.currentBalance
        })
      }
    })

    entry.credits.forEach(c => {
      const ledger = this.ledgers.get(c.accountNumber)
      if (ledger) {
        ledger.currentBalance = this.computeBalance(ledger.account.normalBalance, 0, c.amount, ledger.currentBalance)
        ledger.entries.push({
          date: entry.date,
          description: entry.description,
          debit: 0,
          credit: c.amount,
          balance: ledger.currentBalance
        })
      }
    })
  }

  /**
   * Post multiple entries (e.g. from GeneralJournal)
   */
  public postToLedger(entries: JournalEntry[]): void {
    entries.forEach(entry => this.postEntry(entry))
  }

  public getLedger(accountNumber: string): LedgerAccount | undefined {
    return this.ledgers.get(accountNumber)
  }

  public getAllLedgers(): LedgerAccount[] {
    return Array.from(this.ledgers.values())
  }

  public clear(): void {
    this.ledgers.clear()
    this.initializeLedgers()
  }
}
