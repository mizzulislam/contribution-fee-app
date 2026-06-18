import type { User, Bill, Payment, Expense, JournalEntry, MasterData, Gallon, GallonContainer } from '@/types/database'

/**
 * Soematra Kost - Spreadsheet API Integration
 * URL Web App (Google Apps Script) akan diletakkan di sini.
 */
const SPREADSHEET_API_URL = import.meta.env.VITE_SPREADSHEET_API_URL || 'https://script.google.com/macros/s/AKfycbwYOUR_SCRIPT_ID/exec'
const SOEMATRA_API_TOKEN = import.meta.env.VITE_SOEMATRA_API_TOKEN || ''

if (typeof window !== 'undefined') {
  if (!import.meta.env.VITE_SOEMATRA_API_TOKEN) {
    console.warn('⚠️ SOEMATRA WARNING: VITE_SOEMATRA_API_TOKEN is not defined in environment variables! Requests will fail authorization.')
  } else if (import.meta.env.VITE_SOEMATRA_API_TOKEN.trim() !== import.meta.env.VITE_SOEMATRA_API_TOKEN) {
    console.warn('⚠️ SOEMATRA WARNING: VITE_SOEMATRA_API_TOKEN has leading or trailing whitespace. This may cause authentication to fail.')
  } else if (
    (import.meta.env.VITE_SOEMATRA_API_TOKEN.startsWith('"') && import.meta.env.VITE_SOEMATRA_API_TOKEN.endsWith('"')) ||
    (import.meta.env.VITE_SOEMATRA_API_TOKEN.startsWith("'") && import.meta.env.VITE_SOEMATRA_API_TOKEN.endsWith("'"))
  ) {
    console.warn('⚠️ SOEMATRA WARNING: VITE_SOEMATRA_API_TOKEN has surrounding quotes! Please configure it without quotes in Vercel settings.')
  }

  if (!import.meta.env.VITE_SPREADSHEET_API_URL || import.meta.env.VITE_SPREADSHEET_API_URL.includes('YOUR_SCRIPT_ID')) {
    console.warn('⚠️ SOEMATRA WARNING: VITE_SPREADSHEET_API_URL is missing or using fallback value.')
  }
}

function buildHeaders() {
  return {
    'Content-Type': 'text/plain;charset=utf-8', // URL encoded for GAS bypass CORS
  }
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 15000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error: any) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      throw new Error('Koneksi ke Google Sheets timeout (melebihi 15 detik). Silakan coba lagi.');
    }
    throw error;
  }
}

interface RequesterContext {
  userEmail?: string
  userRole?: string
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
  async get(sheetName: string, requester?: RequesterContext) {
    if (SPREADSHEET_API_URL.includes('YOUR_SCRIPT_ID')) {
      return { data: null, error: new Error('Spreadsheet API belum dikonfigurasi; data real tidak tersedia.') }
    }
    try {
      const sessionContext = getRequesterContext()
      const userEmail = requester?.userEmail ?? sessionContext.userEmail
      const userRole = requester?.userRole ?? sessionContext.userRole
      const emailParam = userEmail ? `&userEmail=${encodeURIComponent(userEmail)}` : ''
      const roleParam = userRole ? `&userRole=${encodeURIComponent(userRole)}` : ''
      const tokenParam = SOEMATRA_API_TOKEN ? `&token=${encodeURIComponent(SOEMATRA_API_TOKEN)}` : ''
      
      const response = await fetchWithTimeout(`${SPREADSHEET_API_URL}?action=get&sheet=${sheetName}${tokenParam}${emailParam}${roleParam}`, {
        credentials: 'omit'
      })
      if (!response.ok) throw new Error('Network response was not ok')
      const result = await response.json()
      if (result.status === 'error') throw new Error(result.message || 'Spreadsheet API mengembalikan error.')
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
      const response = await fetchWithTimeout(SPREADSHEET_API_URL, {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify(withAuthContext({ action: 'post', sheet: sheetName, data })),
        credentials: 'omit'
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
      const response = await fetchWithTimeout(SPREADSHEET_API_URL, {
        method: 'POST', // GAS usually uses POST for all mutations
        headers: buildHeaders(),
        body: JSON.stringify(withAuthContext({ action: 'put', sheet: sheetName, data })),
        credentials: 'omit'
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
      const response = await fetchWithTimeout(SPREADSHEET_API_URL, {
        method: 'POST', 
        headers: buildHeaders(),
        body: JSON.stringify(withAuthContext({ action: 'delete', sheet: sheetName, id })),
        credentials: 'omit'
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
      const response = await fetchWithTimeout(SPREADSHEET_API_URL, {
        method: 'POST', 
        headers: buildHeaders(),
        body: JSON.stringify(withAuthContext({ action: 'restore', sheet: sheetName, data })),
        credentials: 'omit'
      })
      const result = await response.json()
      if (result.status !== 'success') throw new Error(result.message)
      return { success: true, error: null }
    } catch (error) {
      console.error('Spreadsheet RESTORE Error:', error)
      return { success: false, error }
    }
  },

  /**
   * Mengirim aksi khusus (custom action) ke backend Google Apps Script
   */
  async sendCustomAction(action: string, payload: Record<string, any>) {
    if (SPREADSHEET_API_URL.includes('YOUR_SCRIPT_ID')) {
      return { success: false, error: new Error('Spreadsheet API belum dikonfigurasi.') }
    }
    try {
      const response = await fetchWithTimeout(SPREADSHEET_API_URL, {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify(withAuthContext({ action, ...payload })),
        credentials: 'omit'
      })
      const result = await response.json()
      if (result.status !== 'success') throw new Error(result.message || 'Custom action failed')
      return { success: true, data: result, error: null }
    } catch (error) {
      console.error(`Spreadsheet Action ${action} Error:`, error)
      return { success: false, error }
    }
  }
}

/**
 * Melakukan parsing string objek bawaan Google Sheets (seperti "{name=Iuran, period_type=Bulanan}")
 * menjadi objek Javascript standar secara rekursif.
 */
export function parseGoogleSheetsObject(str: string): any {
  if (!str || typeof str !== 'string') return str
  const trimmed = str.trim()
  if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) {
    try {
      return JSON.parse(trimmed)
    } catch {
      return str
    }
  }

  try {
    const parseObj = (s: string): any => {
      const inner = s.substring(1, s.length - 1).trim()
      const result: any = {}
      let currentKey = ''
      let currentValue = ''
      let depth = 0
      let inValue = false

      for (let i = 0; i < inner.length; i++) {
        const char = inner[i]
        if (char === '{') {
          depth++
          currentValue += char
        } else if (char === '}') {
          depth--
          currentValue += char
        } else if (char === '=' && depth === 0) {
          inValue = true
        } else if (char === ',' && depth === 0) {
          result[currentKey.trim()] = parseVal(currentValue.trim())
          currentKey = ''
          currentValue = ''
          inValue = false
        } else {
          if (inValue) {
            currentValue += char
          } else {
            currentKey += char
          }
        }
      }
      if (currentKey) {
        result[currentKey.trim()] = parseVal(currentValue.trim())
      }
      return result
    }

    const parseVal = (v: string): any => {
      if (v.startsWith('{') && v.endsWith('}')) {
        return parseObj(v)
      }
      if (v === 'true') return true
      if (v === 'false') return false
      if (!isNaN(Number(v)) && v !== '') return Number(v)
      return v
    }

    return parseObj(trimmed)
  } catch (e) {
    console.warn("Gagal parsing Google Sheets object:", str, e)
    return str
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
      if (item.contributions) {
        normalized.contributions = parseGoogleSheetsObject(item.contributions)
      }
    } else if (sheetName === 'Contributions') {
      normalized.amount = Number(item.amount) || 0
      normalized.status = item.status || 'active'
      normalized.due_date = item.due_date !== undefined ? String(item.due_date) : ''
      if (item.contribution_types) {
        normalized.contribution_types = parseGoogleSheetsObject(item.contribution_types)
      }
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
    } else if (sheetName === 'AuditLogs') {
      normalized.created_at = item.timestamp || item.created_at || new Date().toISOString()
      normalized.user = `${item.userEmail || 'system'} (${item.userRole || 'system'})`
      normalized.action = `${String(item.action || '').toUpperCase()} pada ${item.sheet || ''}`
      
      // Parse details if it is JSON
      let detailText = item.details || '-'
      if (typeof item.details === 'string' && item.details.trim().startsWith('{')) {
        try {
          const parsed = JSON.parse(item.details)
          detailText = Object.entries(parsed)
            .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
            .join(', ')
        } catch {
          // ignore
        }
      }
      normalized.ip = detailText
    }
    
    return normalized
  })
}
