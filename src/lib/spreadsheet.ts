import type { User, Bill, Payment, Expense, JournalEntry, MasterData, Gallon, GallonContainer } from '@/types/database'

/**
 * Soematra Kost - Spreadsheet API Integration
 * URL Web App (Google Apps Script) akan diletakkan di sini.
 */
const SPREADSHEET_API_URL = import.meta.env.VITE_SPREADSHEET_API_URL || 'https://script.google.com/macros/s/AKfycbwYOUR_SCRIPT_ID/exec'
const SOEMATRA_API_TOKEN = import.meta.env.VITE_SOEMATRA_API_TOKEN || ''

function buildHeaders() {
  const headers: Record<string, string> = {
    'Content-Type': 'text/plain;charset=utf-8', // URL encoded for GAS bypass CORS
  }

  if (SOEMATRA_API_TOKEN) {
    headers['X-Soematra-Token'] = SOEMATRA_API_TOKEN
  }

  return headers
}

function getRequesterContext() {
  try {
    const sessionStr = localStorage.getItem('soematra_session')
    const activeRole = localStorage.getItem('soematra_active_role')
    
    if (sessionStr) {
      const parsed = JSON.parse(sessionStr)
      return {
        userEmail: parsed?.profile?.email || '',
        userRole: activeRole || parsed?.profile?.role || 'user'
      }
    }
    return { userEmail: '', userRole: '' }
  } catch {
    return { userEmail: '', userRole: '' }
  }
}

function withAuthContext<T extends Record<string, unknown>>(payload: T) {
  const { userEmail, userRole } = getRequesterContext()
  const contextPayload = {
    ...payload,
    userEmail,
    userRole
  }
  return SOEMATRA_API_TOKEN ? { ...contextPayload, token: SOEMATRA_API_TOKEN } : contextPayload
}

export const spreadsheetApi = {
  /**
   * Mengambil data dari sheet tertentu
   * @param sheetName Nama tab pada Google Sheets (contoh: 'Users', 'Contributions')
   */
  async get(sheetName: string) {
    if (SPREADSHEET_API_URL.includes('YOUR_SCRIPT_ID')) {
      return { data: null, error: new Error('Spreadsheet API belum dikonfigurasi; data real tidak tersedia.') }
    }
    try {
      const { userEmail, userRole } = getRequesterContext()
      const emailParam = userEmail ? `&userEmail=${encodeURIComponent(userEmail)}` : ''
      const roleParam = userRole ? `&userRole=${encodeURIComponent(userRole)}` : ''
      const tokenParam = SOEMATRA_API_TOKEN ? `&token=${encodeURIComponent(SOEMATRA_API_TOKEN)}` : ''
      
      const response = await fetch(`${SPREADSHEET_API_URL}?action=get&sheet=${sheetName}${tokenParam}${emailParam}${roleParam}`, {
        headers: SOEMATRA_API_TOKEN ? { 'X-Soematra-Token': SOEMATRA_API_TOKEN } : undefined,
      })
      if (!response.ok) throw new Error('Network response was not ok')
      const result = await response.json()
      const normalizedData = normalizeData(sheetName, result.data)
      return { data: normalizedData, error: null }
    } catch (error) {
      console.error('Spreadsheet GET Error:', error)
      return { data: null, error }
    }
  },

  /**
   * Mengirim data baru ke sheet tertentu
   * @param sheetName Nama tab pada Google Sheets
   * @param data Objek data yang ingin disimpan (key harus sesuai header kolom spreadsheet)
   */
  async post(sheetName: string, data: unknown) {
    if (SPREADSHEET_API_URL.includes('YOUR_SCRIPT_ID')) {
      return { success: false, error: new Error('Spreadsheet API belum dikonfigurasi; data tidak disimpan.') }
    }
    try {
      const response = await fetch(SPREADSHEET_API_URL, {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify(withAuthContext({ action: 'post', sheet: sheetName, data }))
      })
      
      const result = await response.json()
      if (result.status !== 'success') throw new Error(result.message)
      
      return { success: true, error: null }
    } catch (error) {
      console.error('Spreadsheet POST Error:', error)
      return { success: false, error }
    }
  },

  /**
   * Memperbarui data pada sheet tertentu berdasarkan id
   */
  async put(sheetName: string, data: unknown) {
    if (SPREADSHEET_API_URL.includes('YOUR_SCRIPT_ID')) {
      return { success: false, error: new Error('Spreadsheet API belum dikonfigurasi; data tidak diperbarui.') }
    }
    try {
      const response = await fetch(SPREADSHEET_API_URL, {
        method: 'POST', // GAS usually uses POST for all mutations
        headers: buildHeaders(),
        body: JSON.stringify(withAuthContext({ action: 'put', sheet: sheetName, data }))
      })
      const result = await response.json()
      if (result.status !== 'success') throw new Error(result.message)
      return { success: true, error: null }
    } catch (error) {
      console.error('Spreadsheet PUT Error:', error)
      return { success: false, error }
    }
  },

  /**
   * Menghapus baris pada sheet berdasarkan id
   */
  async del(sheetName: string, id: string | number) {
    if (SPREADSHEET_API_URL.includes('YOUR_SCRIPT_ID')) {
      return { success: false, error: new Error('Spreadsheet API belum dikonfigurasi; data tidak dihapus.') }
    }
    try {
      const response = await fetch(SPREADSHEET_API_URL, {
        method: 'POST', 
        headers: buildHeaders(),
        body: JSON.stringify(withAuthContext({ action: 'delete', sheet: sheetName, id }))
      })
      const result = await response.json()
      if (result.status !== 'success') throw new Error(result.message)
      return { success: true, error: null }
    } catch (error) {
      console.error('Spreadsheet DELETE Error:', error)
      return { success: false, error }
    }
  },

  /**
   * Mengembalikan data (restore) ke sheet tertentu, menimpa data yang ada
   */
  async restore(sheetName: string, data: unknown[]) {
    if (SPREADSHEET_API_URL.includes('YOUR_SCRIPT_ID')) {
      return { success: false, error: new Error('Spreadsheet API belum dikonfigurasi; data tidak dipulihkan.') }
    }
    try {
      const response = await fetch(SPREADSHEET_API_URL, {
        method: 'POST', 
        headers: buildHeaders(),
        body: JSON.stringify(withAuthContext({ action: 'restore', sheet: sheetName, data }))
      })
      const result = await response.json()
      if (result.status !== 'success') throw new Error(result.message)
      return { success: true, error: null }
    } catch (error) {
      console.error('Spreadsheet RESTORE Error:', error)
      return { success: false, error }
    }
  }
}

/**
 * Normalisasi data mentah dari Google Sheets untuk mencegah crash di UI jika ada format yang tidak lengkap/null.
 */
export function normalizeData(sheetName: string, data: unknown): Record<string, any>[] {
  if (!data || !Array.isArray(data)) {
    return []
  }
  
  return data.map((item: Record<string, any>, idx: number) => {
    if (!item || typeof item !== 'object') return {}
    
    // Pastikan selalu ada ID unik
    const id = item.id !== undefined && item.id !== null ? String(item.id) : `gen_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 5)}`
    
    const normalized: Record<string, any> = { ...item, id }
    
    // Normalisasi spesifik tab/sheet
    if (sheetName === 'Users') {
      normalized.full_name = item.full_name || item.name || item.email?.split('@')[0] || 'User'
      normalized.email = item.email || ''
      normalized.role = item.role || 'user'
      normalized.room_number = item.room_number !== undefined ? String(item.room_number) : ''
      normalized.status = item.status || 'Aktif'
    } else if (sheetName === 'Bills') {
      normalized.amount = Number(item.amount) || 0
      normalized.status = item.status || 'unpaid'
      normalized.due_date = item.due_date || new Date().toISOString()
      normalized.resident_email = item.resident_email || ''
      normalized.resident_name = item.resident_name || ''
      normalized.room_number = item.room_number !== undefined ? String(item.room_number) : ''
    } else if (sheetName === 'Payments') {
      normalized.amount = Number(item.amount) || 0
      normalized.status = item.status || 'pending_verification'
      normalized.date = item.date || new Date().toISOString().split('T')[0]
      normalized.date_submitted = item.date_submitted || item.created_at || new Date().toISOString()
      normalized.billId = item.billId || item.bill_id || ''
    } else if (sheetName === 'Expenses') {
      normalized.amount = Number(item.amount) || 0
      normalized.category = item.category || 'Lainnya'
      normalized.date = item.date || new Date().toISOString().split('T')[0]
    } else if (sheetName === 'JournalEntries') {
      normalized.date = item.date || new Date().toISOString().split('T')[0]
      
      // Parse debits dan credits ke format array
      if (typeof item.debits === 'string') {
        try {
          normalized.debits = JSON.parse(item.debits)
        } catch {
          normalized.debits = []
        }
      } else {
        normalized.debits = Array.isArray(item.debits) ? item.debits : []
      }
      
      if (typeof item.credits === 'string') {
        try {
          normalized.credits = JSON.parse(item.credits)
        } catch {
          normalized.credits = []
        }
      } else {
        normalized.credits = Array.isArray(item.credits) ? item.credits : []
      }
    } else if (sheetName === 'MasterData') {
      normalized.account_number = item.account_number !== undefined ? String(item.account_number) : ''
      normalized.account_name = item.account_name || ''
      normalized.account_type = item.account_type || ''
    } else if (sheetName === 'Gallons') {
      normalized.quantity = Number(item.quantity) || 0
      normalized.type = item.type || 'Penggunaan'
      normalized.date = item.date || new Date().toISOString().split('T')[0]
    } else if (sheetName === 'GallonContainers') {
      normalized.capacity = Number(item.capacity) || 0.6
      normalized.type = item.type || 'Tumbler'
    }
    
    return normalized
  })
}
