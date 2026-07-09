import { describe, it, expect } from 'vitest'
import { normalizeData, parseGoogleSheetsObject } from './sheets-client'

describe('Spreadsheet normalizeData utility', () => {
  it('should return an empty array if input data is null, undefined, or not an array', () => {
    expect(normalizeData('Users', null)).toEqual([])
    expect(normalizeData('Users', undefined)).toEqual([])
    expect(normalizeData('Users', {})).toEqual([])
    expect(normalizeData('Users', 'not an array')).toEqual([])
  })

  it('should generate a fallback ID if id is missing in raw row data', () => {
    const rawData = [{ full_name: 'Resident Budi' }]
    const normalized = normalizeData('Users', rawData)
    
    expect(normalized).toHaveLength(1)
    expect(normalized[0].id).toBeDefined()
    expect(typeof normalized[0].id).toBe('string')
    expect(normalized[0].id.startsWith('gen_')).toBe(true)
    expect(normalized[0].full_name).toBe('Resident Budi')
  })

  it('should retain existing id if it is present', () => {
    const rawData = [{ id: 'USR-123', full_name: 'Resident Budi' }]
    const normalized = normalizeData('Users', rawData)
    
    expect(normalized).toHaveLength(1)
    expect(normalized[0].id).toBe('USR-123')
  })

  it('should normalize Users sheet data structure', () => {
    const rawData = [
      { id: '1', name: 'Alfi', email: 'alfi@test.com', role: 'admin', room_number: 10, status: 'Aktif' },
      { id: '2', email: 'budi@test.com' } // missing fields
    ]
    const normalized = normalizeData('Users', rawData)

    expect(normalized[0]).toEqual({
      id: '1',
      name: 'Alfi',
      full_name: 'Alfi',
      email: 'alfi@test.com',
      role: 'admin',
      room_number: '10',
      status: 'Aktif'
    })

    expect(normalized[1].full_name).toBe('budi') // derived from email split
    expect(normalized[1].role).toBe('user') // default role
    expect(normalized[1].room_number).toBe('') // default room
    expect(normalized[1].status).toBe('Aktif') // default status
  })

  it('should normalize Bills sheet data structure', () => {
    const rawData = [
      { id: 'B-1', amount: '200000', status: 'paid', due_date: '2026-06-12', resident_email: 'budi@test.com', resident_name: 'Budi', room_number: '101' },
      { id: 'B-2' } // missing fields
    ]
    const normalized = normalizeData('Bills', rawData)

    expect(normalized[0]).toEqual({
      id: 'B-1',
      amount: 200000,
      status: 'paid',
      due_date: '2026-06-12',
      resident_email: 'budi@test.com',
      resident_name: 'Budi',
      room_number: '101',
      month: 'Juni'
    })

    expect(normalized[1].amount).toBe(0)
    expect(normalized[1].status).toBe('unpaid')
    expect(normalized[1].due_date).toBeDefined()
    expect(normalized[1].room_number).toBe('')
  })

  it('should normalize Payments sheet data structure', () => {
    const rawData = [
      { id: 'P-1', amount: '150000', status: 'verified', date: '2026-06-15', date_submitted: '2026-06-15T08:00:00Z', billId: 'B-1' },
      { id: 'P-2', bill_id: 'B-2' } // using bill_id fallback
    ]
    const normalized = normalizeData('Payments', rawData)

    expect(normalized[0]).toEqual({
      id: 'P-1',
      amount: 150000,
      status: 'verified',
      date: '2026-06-15',
      date_submitted: '2026-06-15T08:00:00Z',
      billId: 'B-1'
    })

    expect(normalized[1].amount).toBe(0)
    expect(normalized[1].status).toBe('pending_verification')
    expect(normalized[1].billId).toBe('B-2')
  })

  it('should normalize Expenses sheet data structure', () => {
    const rawData = [
      { id: 'E-1', amount: '50000', category: 'Air & Galon', date: '2026-06-10' },
      { id: 'E-2' }
    ]
    const normalized = normalizeData('Expenses', rawData)

    expect(normalized[0]).toEqual({
      id: 'E-1',
      amount: 50000,
      category: 'Air & Galon',
      date: '2026-06-10'
    })

    expect(normalized[1].amount).toBe(0)
    expect(normalized[1].category).toBe('Lainnya')
    expect(normalized[1].date).toBeDefined()
  })

  it('should normalize JournalEntries sheet data structure and parse debits/credits strings safely', () => {
    const rawData = [
      {
        id: 'JE-1',
        date: '2026-06-17',
        debits: '[{"accountNumber":"1104","amount":200000}]',
        credits: '[{"accountNumber":"4101","amount":200000}]'
      },
      {
        id: 'JE-2',
        debits: [{ accountNumber: '1102', amount: 50000 }], // already parsed array
        credits: [{ accountNumber: '1104', amount: 50000 }]
      },
      {
        id: 'JE-3',
        debits: 'invalid json string', // invalid json string
        credits: undefined
      }
    ]
    const normalized = normalizeData('JournalEntries', rawData)

    expect(normalized[0].debits).toEqual([{ accountNumber: '1104', amount: 200000 }])
    expect(normalized[0].credits).toEqual([{ accountNumber: '4101', amount: 200000 }])

    expect(normalized[1].debits).toEqual([{ accountNumber: '1102', amount: 50000 }])
    expect(normalized[1].credits).toEqual([{ accountNumber: '1104', amount: 50000 }])

    expect(normalized[2].debits).toEqual([])
    expect(normalized[2].credits).toEqual([])
  })

  it('should normalize MasterData sheet data structure', () => {
    const rawData = [
      { id: 'M-1', account_number: 1102, account_name: 'Kas BCA', account_type: 'Aset' },
      { id: 'M-2' }
    ]
    const normalized = normalizeData('MasterData', rawData)

    expect(normalized[0]).toEqual({
      id: 'M-1',
      account_number: '1102',
      account_name: 'Kas BCA',
      account_type: 'Aset'
    })

    expect(normalized[1].account_number).toBe('')
    expect(normalized[1].account_name).toBe('')
    expect(normalized[1].account_type).toBe('')
  })

  it('should normalize Gallons sheet data structure', () => {
    const rawData = [
      { id: 'G-1', quantity: '1.5', type: 'Pembelian', date: '2026-06-11' },
      { id: 'G-2' }
    ]
    const normalized = normalizeData('Gallons', rawData)

    expect(normalized[0].quantity).toBe(1.5)
    expect(normalized[0].type).toBe('Pembelian')
    expect(normalized[0].date).toBe('2026-06-11')

    expect(normalized[1].quantity).toBe(0)
    expect(normalized[1].type).toBe('Penggunaan')
    expect(normalized[1].date).toBeDefined()
  })

  it('should normalize GallonContainers sheet data structure', () => {
    const rawData = [
      { id: 'GC-1', capacity: '0.75', type: 'Botol' },
      { id: 'GC-2' }
    ]
    const normalized = normalizeData('GallonContainers', rawData)

    expect(normalized[0].capacity).toBe(0.75)
    expect(normalized[0].type).toBe('Botol')

    expect(normalized[1].capacity).toBe(0.6)
    expect(normalized[1].type).toBe('Tumbler')
  })

  it('should normalize Contributions and parse contribution_types', () => {
    const rawData = [
      { id: 'C-1', amount: '28000', status: 'active', due_date: 13, contribution_types: '{name=Iuran Wajib, period_type=Bulanan}' }
    ]
    const normalized = normalizeData('Contributions', rawData)

    expect(normalized[0].amount).toBe(28000)
    expect(normalized[0].status).toBe('active')
    expect(normalized[0].due_date).toBe('13')
    expect(normalized[0].contribution_types).toEqual({
      name: 'Iuran Wajib',
      period_type: 'Bulanan'
    })
  })
})

describe('Spreadsheet parseGoogleSheetsObject utility', () => {
  it('should return raw value if not formatted with braces', () => {
    expect(parseGoogleSheetsObject('simple string')).toBe('simple string')
    expect(parseGoogleSheetsObject(null as any)).toBeNull()
  })

  it('should parse shallow object keys and values', () => {
    const raw = '{name=Iuran Wajib, period_type=Bulanan, amount=28000, active=true}'
    const parsed = parseGoogleSheetsObject(raw)
    expect(parsed).toEqual({
      name: 'Iuran Wajib',
      period_type: 'Bulanan',
      amount: 28000,
      active: true
    })
  })

  it('should parse nested Google Sheets objects recursively', () => {
    const raw = '{contribution_types={name=Kustom, val=12.5}, title=Iuran Galon}'
    const parsed = parseGoogleSheetsObject(raw)
    expect(parsed).toEqual({
      contribution_types: {
        name: 'Kustom',
        val: 12.5
      },
      title: 'Iuran Galon'
    })
  })
})

