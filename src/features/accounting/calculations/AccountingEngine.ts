import { ChartOfAccounts } from './ChartOfAccounts'
import { DoubleEntryEngine } from './DoubleEntryEngine'
import { GeneralJournal } from './GeneralJournal'
import { GeneralLedger } from './GeneralLedger'
import { TrialBalance } from './TrialBalance'
import { FinancialStatementsGenerator } from './FinancialStatements'
import { ClosingProcess } from './ClosingProcess'
import type { JournalEntryLine, JournalEntry, TrialBalanceItem, FinancialStatements, LedgerAccount } from './types'

export class AccountingEngine {
  public coa: ChartOfAccounts
  public validator: DoubleEntryEngine
  public journal: GeneralJournal
  public ledger: GeneralLedger
  public trialBalance: TrialBalance
  public statements: FinancialStatementsGenerator
  public closing: ClosingProcess

  constructor() {
    this.coa = new ChartOfAccounts()
    this.coa.seedDefaultAccounts()

    this.validator = new DoubleEntryEngine(this.coa)
    this.journal = new GeneralJournal(this.validator)
    this.ledger = new GeneralLedger(this.coa)
    
    this.trialBalance = new TrialBalance(this.ledger, this.journal)
    this.statements = new FinancialStatementsGenerator(this.ledger)
    this.closing = new ClosingProcess(this.ledger, this.journal)
  }

  /**
   * Facade method: Record a transaction and immediately post it to ledger
   */
  public recordTransaction(date: string, debits: JournalEntryLine[], credits: JournalEntryLine[], description: string, existingId?: string): JournalEntry {
    const entry = this.journal.journalize(date, debits, credits, description, existingId)
    this.ledger.postEntry(entry)
    return entry
  }

  /**
   * Facade method: Get Trial Balance
   */
  public getTrialBalance(): TrialBalanceItem[] {
    return this.trialBalance.generate()
  }

  /**
   * Facade method: Get full Financial Statements
   */
  public getFinancialStatements(): FinancialStatements {
    return this.statements.generate()
  }

  /**
   * Facade method: Close the books
   */
  public closeBooks(date: string): void {
    this.closing.closeBooks(date)
  }

  /**
   * Facade method: Reset engine
   */
  public reset(): void {
    this.journal.clear()
    this.ledger.clear()
  }
}
