import { describe, it, expect, beforeEach } from 'vitest'
import { DoubleEntryEngine } from './DoubleEntryEngine'
import { ChartOfAccounts } from './ChartOfAccounts'

describe('DoubleEntryEngine', () => {
  let coa: ChartOfAccounts
  let engine: DoubleEntryEngine

  beforeEach(() => {
    coa = new ChartOfAccounts()
    coa.clear()
    coa.addAccount('1102', 'Kas di Bank BCA', 'Assets')
    coa.addAccount('1104', 'Piutang Penghuni', 'Assets')
    coa.addAccount('4101', 'Pendapatan Sewa Kamar', 'Revenues')
    engine = new DoubleEntryEngine(coa)
  })

  it('should validate balanced double entry transactions successfully', () => {
    const debits = [{ accountNumber: '1102', amount: 500000 }]
    const credits = [{ accountNumber: '1104', amount: 500000 }]

    expect(() => engine.validate(debits, credits)).not.toThrow()
  })

  it('should throw error if transaction has no debit or credit lines', () => {
    expect(() => engine.validate([], [])).toThrow('Transaction must have at least one entry.')
    expect(() => engine.validate([{ accountNumber: '1102', amount: 500000 }], [])).toThrow('Transaction must have at least one debit and one credit')
    expect(() => engine.validate([], [{ accountNumber: '1104', amount: 500000 }])).toThrow('Transaction must have at least one debit and one credit')
  })

  it('should throw error if debits and credits are not balanced', () => {
    const debits = [{ accountNumber: '1102', amount: 500000 }]
    const credits = [{ accountNumber: '1104', amount: 490000 }]

    expect(() => engine.validate(debits, credits)).toThrow('Transaction is not balanced!')
  })

  it('should throw error if account is not found in COA', () => {
    const debits = [{ accountNumber: '9999', amount: 500000 }]
    const credits = [{ accountNumber: '1104', amount: 500000 }]

    expect(() => engine.validate(debits, credits)).toThrow('Debit Account 9999 not found')
  })

  it('should throw error if amount is zero or negative', () => {
    const debits1 = [{ accountNumber: '1102', amount: 0 }]
    expect(() => engine.validate(debits1, [{ accountNumber: '1104', amount: 500000 }])).toThrow('Debit amounts must be greater than zero')

    const debits2 = [{ accountNumber: '1102', amount: -100 }]
    expect(() => engine.validate(debits2, [{ accountNumber: '1104', amount: 500000 }])).toThrow('Debit amounts must be greater than zero')
  })
})
