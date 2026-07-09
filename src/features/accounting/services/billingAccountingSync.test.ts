import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { syncBillsWithAccountingEntries } from './billingAccountingSync'
import { spreadsheetApi } from '@/services/sheets-client'

describe('billingAccountingSync', () => {
  const mockUsers = [
    { id: 'U-1', full_name: 'Siti Aminah', nickname: 'Siti', room_number: '101' },
  ]

  const openBill = {
    id: 'B-1',
    resident_name: 'Siti Aminah',
    room_number: '101',
    amount: 120000,
    status: 'unpaid',
    due_date: '2026-06-15',
    contributions: JSON.stringify({ title: 'Iuran Galon Juni', contribution_types: { name: 'Iuran Galon' } }),
  }

  const paymentJournal = {
    id: 'PAY-1',
    date: '2026-06-15',
    description: 'Penerimaan Pembayaran Iuran Galon Juni - Siti Aminah',
    debits: JSON.stringify([{ accountNumber: '1102', amount: 120000 }]),
    credits: JSON.stringify([{ accountNumber: '1104', amount: 120000 }]),
    source: 'debt_compensation',
  }

  const manualJournal = {
    ...paymentJournal,
    id: 'JE-1',
    source: 'manual_journal',
  }

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('matches a payment journal entry and returns a paid bill without writing when persist is false', async () => {
    const putSpy = vi.spyOn(spreadsheetApi, 'put').mockResolvedValue({ success: true, error: null })
    const result = await syncBillsWithAccountingEntries({
      bills: [openBill],
      journalEntries: [paymentJournal],
      users: mockUsers,
      persist: false,
    })

    expect(result.syncedCount).toBe(1)
    expect(result.bills[0].status).toBe('paid')
    expect(result.bills[0].payment_source).toBe('accounting_journal')
    expect(putSpy).not.toHaveBeenCalled()
  })

  it('does not sync a manual journal entry even if description looks like a payment', async () => {
    const putSpy = vi.spyOn(spreadsheetApi, 'put').mockResolvedValue({ success: true, error: null })
    const result = await syncBillsWithAccountingEntries({
      bills: [openBill],
      journalEntries: [manualJournal],
      users: mockUsers,
      persist: true,
    })

    expect(result.syncedCount).toBe(0)
    expect(result.bills[0].status).toBe('unpaid')
    expect(putSpy).not.toHaveBeenCalled()
  })

  it('persists matched bill updates when persist is true', async () => {
    const putSpy = vi.spyOn(spreadsheetApi, 'put').mockResolvedValue({ success: true, error: null })
    const result = await syncBillsWithAccountingEntries({
      bills: [openBill],
      journalEntries: [paymentJournal],
      users: mockUsers,
      persist: true,
    })

    expect(result.syncedCount).toBe(1)
    expect(putSpy).toHaveBeenCalledTimes(1)
    expect(putSpy).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ id: 'B-1', status: 'paid' }))
  })
})
