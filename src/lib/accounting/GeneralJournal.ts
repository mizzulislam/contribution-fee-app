import type { JournalEntry, JournalEntryLine } from './types'
import { DoubleEntryEngine } from './DoubleEntryEngine'

export class GeneralJournal {
  private engine: DoubleEntryEngine
  private entries: JournalEntry[] = []

  constructor(engine: DoubleEntryEngine) {
    this.engine = engine
  }

  /**
   * Records a new transaction into the General Journal.
   * Validates the transaction using DoubleEntryEngine before recording.
   */
  public journalize(date: string, debits: JournalEntryLine[], credits: JournalEntryLine[], description: string): JournalEntry {
    // 1. Validate
    this.engine.validate(debits, credits)

    // 2. Generate ID (simple UUID mock for this example)
    // Generate a concise ID like JE-69727 (last 5 digits of timestamp)
    const timestampStr = Date.now().toString()
    const shortId = timestampStr.slice(-5)
    
    const entry: JournalEntry = {
      id: `JE-${shortId}`,
      date,
      debits,
      credits,
      description
    }

    // 3. Record
    this.entries.push(entry)
    
    // In a real app, you would emit an event here to trigger GeneralLedger posting,
    // or just rely on the Facade/Engine to coordinate.
    
    return entry
  }

  public getEntries(): JournalEntry[] {
    return [...this.entries]
  }

  public clear(): void {
    this.entries = []
  }
}
