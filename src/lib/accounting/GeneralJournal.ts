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
  public journalize(date: string, debits: JournalEntryLine[], credits: JournalEntryLine[], description: string, existingId?: string): JournalEntry {
    // 1. Validate
    this.engine.validate(debits, credits)

    // 2. Generate ID or use existing
    let id = existingId
    if (!id) {
      const timestampStr = Date.now().toString()
      const randomPart = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
      const shortId = timestampStr.slice(-5)
      id = `JE-${shortId}-${randomPart}`
    }
    
    const entry: JournalEntry = {
      id,
      date,
      debits,
      credits,
      description
    }

    // 3. Record
    this.entries.push(entry)
    
    return entry
  }

  public getEntries(): JournalEntry[] {
    return [...this.entries]
  }

  public clear(): void {
    this.entries = []
  }
}
