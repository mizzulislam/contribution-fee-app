/**
 * Soematra Kost - Spreadsheet API Integration
 * URL Web App (Google Apps Script) akan diletakkan di sini.
 */

// Ganti URL ini dengan URL Web App yang Anda dapatkan setelah mendeploy skrip Google Apps Script.
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

function withToken<T extends Record<string, unknown>>(payload: T) {
  return SOEMATRA_API_TOKEN ? { ...payload, token: SOEMATRA_API_TOKEN } : payload
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
      const tokenParam = SOEMATRA_API_TOKEN ? `&token=${encodeURIComponent(SOEMATRA_API_TOKEN)}` : ''
      const response = await fetch(`${SPREADSHEET_API_URL}?action=get&sheet=${sheetName}${tokenParam}`, {
        headers: SOEMATRA_API_TOKEN ? { 'X-Soematra-Token': SOEMATRA_API_TOKEN } : undefined,
      })
      if (!response.ok) throw new Error('Network response was not ok')
      const result = await response.json()
      return { data: result.data, error: null }
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
        body: JSON.stringify(withToken({ action: 'post', sheet: sheetName, data }))
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
        body: JSON.stringify(withToken({ action: 'put', sheet: sheetName, data }))
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
        body: JSON.stringify(withToken({ action: 'delete', sheet: sheetName, id }))
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
        body: JSON.stringify(withToken({ action: 'restore', sheet: sheetName, data }))
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
