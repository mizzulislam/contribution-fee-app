import { describe, it, expect } from 'vitest'
import { buildTrialBalance, generateFinancialStatements, generateClosingEntries, generateAdjustingEntries } from './optimizedCycle'

describe('optimizedCycle', () => {
  const mockCOA = [
    { account_number: '1102', account_name: 'Kas di Bank BCA', account_type: 'Harta', status: 'Aktif' },
    { account_number: '1104', account_name: 'Piutang Penghuni', account_type: 'Harta', status: 'Aktif' },
    { account_number: '1501', account_name: 'Peralatan Kos', account_type: 'Harta', status: 'Aktif' },
    { account_number: '1502', account_name: 'Akumulasi Penyusutan', account_type: 'Harta', status: 'Aktif' },
    { account_number: '2102', account_name: 'Uang Muka Sewa', account_type: 'Kewajiban', status: 'Aktif' },
    { account_number: '3101', account_name: 'Modal Pemilik', account_type: 'Modal', status: 'Aktif' },
    { account_number: '3201', account_name: 'Laba Ditahan', account_type: 'Modal', status: 'Aktif' },
    { account_number: '3301', account_name: 'Prive Pemilik', account_type: 'Modal', status: 'Aktif' },
    { account_number: '3500', account_name: 'Ikhtisar Laba Rugi', account_type: 'Modal', status: 'Aktif' },
    { account_number: '4101', account_name: 'Pendapatan Sewa Kamar', account_type: 'Pendapatan', status: 'Aktif' },
    { account_number: '5101', account_name: 'Beban Listrik & Air', account_type: 'Beban', status: 'Aktif' },
    { account_number: '5107', account_name: 'Beban Penyusutan', account_type: 'Beban', status: 'Aktif' },
  ]

  const mockJournalEntries = [
    {
      id: 'JE-1',
      date: '2026-06-01',
      description: 'Modal awal pemilik',
      debits: JSON.stringify([{ accountNumber: '1102', amount: 10000000 }]),
      credits: JSON.stringify([{ accountNumber: '3101', amount: 10000000 }]),
    },
    {
      id: 'JE-2',
      date: '2026-06-10',
      description: 'Penerimaan sewa di muka',
      debits: JSON.stringify([{ accountNumber: '1102', amount: 3000000 }]),
      credits: JSON.stringify([{ accountNumber: '2102', amount: 3000000 }]),
    },
    {
      id: 'JE-3',
      date: '2026-06-15',
      description: 'Beban listrik berjalan',
      debits: JSON.stringify([{ accountNumber: '5101', amount: 400000 }]),
      credits: JSON.stringify([{ accountNumber: '1102', amount: 400000 }]),
    },
    {
      id: 'JE-4',
      date: '2026-06-20',
      description: 'Pengambilan prive pemilik',
      debits: JSON.stringify([{ accountNumber: '3301', amount: 500000 }]),
      credits: JSON.stringify([{ accountNumber: '1102', amount: 500000 }]),
    }
  ]

  it('should build a balanced Trial Balance correctly from mock COA and Journal Entries', () => {
    const items = buildTrialBalance(mockCOA, mockJournalEntries)
    
    // Check that total debit equals total credit
    const totalDebit = items.reduce((sum, i) => sum + i.debit, 0)
    const totalCredit = items.reduce((sum, i) => sum + i.credit, 0)
    
    expect(totalDebit).toBe(13000000)
    expect(totalCredit).toBe(13000000)

    // Check specific account ending balances
    const cashAcc = items.find(i => i.accountNumber === '1102')
    expect(cashAcc).toBeDefined()
    expect(cashAcc?.debit).toBe(12100000)
    expect(cashAcc?.credit).toBe(0)

    const revenueAcc = items.find(i => i.accountNumber === '4101')
    expect(revenueAcc?.debit).toBe(0)
    expect(revenueAcc?.credit).toBe(0) // No revenue recorded yet
  })

  it('should generate financial statements correctly from trial balance items', () => {
    const jEntriesWithRevenue = [
      ...mockJournalEntries,
      {
        id: 'JE-5',
        date: '2026-06-25',
        description: 'Realisasi pendapatan piutang sewa',
        debits: JSON.stringify([{ accountNumber: '1104', amount: 1500000 }]),
        credits: JSON.stringify([{ accountNumber: '4101', amount: 1500000 }]),
      }
    ]

    const tbItems = buildTrialBalance(mockCOA, jEntriesWithRevenue)
    const statements = generateFinancialStatements(tbItems)

    // Check Income Statement
    expect(statements.incomeStatement.revenues).toBe(1500000)
    expect(statements.incomeStatement.expenses).toBe(400000)
    expect(statements.incomeStatement.netIncome).toBe(1100000)

    // Check Retained Earnings
    expect(statements.retainedEarningsStatement.endingRetainedEarnings).toBe(600000) // 0 + 1.1M - 500k prive

    // Check Balance Sheet
    expect(statements.balanceSheet.assets.totalAssets).toBe(13600000) // 12.1M cash + 1.5M piutang
    expect(statements.balanceSheet.liabilities.totalLiabilities).toBe(3000000) // 3M unearned rent
    expect(statements.balanceSheet.equity.totalEquity).toBe(10600000) // 10M stock + 600k ending RE
    expect(statements.balanceSheet.totalLiabilitiesAndEquity).toBe(13600000)
  })

  it('should generate correct closing entries at the end of the period', () => {
    const jEntriesForClosing = [
      ...mockJournalEntries,
      {
        id: 'JE-5',
        date: '2026-06-25',
        description: 'Pendapatan sewa',
        debits: JSON.stringify([{ accountNumber: '1102', amount: 2000000 }]),
        credits: JSON.stringify([{ accountNumber: '4101', amount: 2000000 }]),
      }
    ]

    const tbItems = buildTrialBalance(mockCOA, jEntriesForClosing)
    const closingEntries = generateClosingEntries(tbItems, '2026-06-30')

    expect(closingEntries.length).toBeGreaterThan(0)

    // There should be a closing entry for Revenue
    const revClosing = closingEntries.find(e => e.id.startsWith('CL-REV'))
    expect(revClosing).toBeDefined()
    expect(revClosing?.debits[0].accountNumber).toBe('4101')
    expect(revClosing?.debits[0].amount).toBe(2000000)
    expect(revClosing?.credits[0].accountNumber).toBe('3500')
    expect(revClosing?.credits[0].amount).toBe(2000000)

    // There should be a closing entry for Expense
    const expClosing = closingEntries.find(e => e.id.startsWith('CL-EXP'))
    expect(expClosing).toBeDefined()
    expect(expClosing?.debits[0].accountNumber).toBe('3500')
    expect(expClosing?.debits[0].amount).toBe(400000)
    expect(expClosing?.credits[0].accountNumber).toBe('5101')
    expect(expClosing?.credits[0].amount).toBe(400000)

    // Net income close: total Revenue (2M) - total Expense (400k) = 1.6M net income
    const incClosing = closingEntries.find(e => e.id.startsWith('CL-INC'))
    expect(incClosing).toBeDefined()
    expect(incClosing?.debits[0].accountNumber).toBe('3500')
    expect(incClosing?.debits[0].amount).toBe(1600000)
    expect(incClosing?.credits[0].accountNumber).toBe('3201')
    expect(incClosing?.credits[0].amount).toBe(1600000)

    // Prive close: 500k
    const divClosing = closingEntries.find(e => e.id.startsWith('CL-DIV'))
    expect(divClosing).toBeDefined()
    expect(divClosing?.debits[0].accountNumber).toBe('3201')
    expect(divClosing?.debits[0].amount).toBe(500000)
    expect(divClosing?.credits[0].accountNumber).toBe('3301')
    expect(divClosing?.credits[0].amount).toBe(500000)
  })

  it('should generate rent and depreciation adjusting entries correctly', () => {
    // 1. Rent: resident verified payment covers 3 months (June, July, August 2026), amount = 3,000,000.
    const payments = [
      {
        id: 'PAY-1',
        status: 'paid',
        amount: 3000000,
        month: 'Juni - Agustus 2026',
        resident_name: 'Dian',
        room_number: '101',
        date: '2026-06-01'
      }
    ]

    // 2. Asset: AC purchase price 6M, useful life 60 months (5 years), salvage 0. Monthly depr = 100,000.
    const assets = [
      {
        id: 'AST-1',
        name: 'AC Kamar 101',
        cost: 6000000,
        salvageValue: 0,
        usefulLifeMonths: 60,
        purchaseDate: '2026-06-01'
      }
    ]

    const adjEntries = generateAdjustingEntries(payments, assets, '2026-06-30')
    expect(adjEntries.length).toBe(2)

    // Rent adjustment: 3,000,000 / 3 months = 1,000,000 earned
    const rentAdj = adjEntries.find(e => e.source === 'unearned_rent')
    expect(rentAdj).toBeDefined()
    expect(rentAdj?.debits[0].accountNumber).toBe('2102')
    expect(rentAdj?.debits[0].amount).toBe(1000000)
    expect(rentAdj?.credits[0].accountNumber).toBe('4101')
    expect(rentAdj?.credits[0].amount).toBe(1000000)

    // Depreciation adjustment: 6,000,000 / 60 months = 100,000 depr
    const deprAdj = adjEntries.find(e => e.source === 'depreciation')
    expect(deprAdj).toBeDefined()
    expect(deprAdj?.debits[0].accountNumber).toBe('5107')
    expect(deprAdj?.debits[0].amount).toBe(100000)
    expect(deprAdj?.credits[0].accountNumber).toBe('1502')
    expect(deprAdj?.credits[0].amount).toBe(100000)
  })
})
