import { useState, useEffect } from 'react'
import { Save, Settings, Loader2, CheckCircle2 } from 'lucide-react'
import Select from '@/components/ui/Select'
import { spreadsheetApi } from '@/lib/spreadsheet'

export default function SystemSettings() {
  const [appName, setAppName] = useState('Soematra Kost App')
  const [contactEmail, setContactEmail] = useState('support@soematrakost.com')
  const [timezone, setTimezone] = useState('Asia/Jakarta (WIB)')
  const [currency, setCurrency] = useState('IDR (Rupiah)')
  
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const { data, error } = await spreadsheetApi.get('Settings')
      if (data && data.length > 0) {
        const settings = data[0]
        if (settings.appName) setAppName(settings.appName)
        if (settings.contactEmail) setContactEmail(settings.contactEmail)
        if (settings.timezone) setTimezone(settings.timezone)
        if (settings.currency) setCurrency(settings.currency)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    
    const payload = {
      id: 1, // Single config row
      appName,
      contactEmail,
      timezone,
      currency,
      updated_at: new Date().toISOString()
    }

    try {
      // Coba PUT (update)
      const res = await spreadsheetApi.put('Settings', payload)
      if (!res.success) {
        // Jika gagal karena belum ada (error), POST baru
        await spreadsheetApi.post('Settings', payload)
      }
      setToastMessage('Konfigurasi Berhasil Disimpan!')
      setTimeout(() => setToastMessage(''), 3000)
    } catch (err) {
      console.error(err)
      setToastMessage('Gagal menyimpan (Mode Mock)')
      setTimeout(() => setToastMessage(''), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center">
          <Settings className="mr-3 text-primary w-8 h-8" />
          Pengaturan Sistem
        </h1>
        <p className="text-text-secondary mt-1">Konfigurasi umum aplikasi Soematra Kost.</p>
      </div>

      <div className="card-container p-6 sm:p-8 relative">
        {toastMessage && (
          <div className="absolute top-4 right-4 bg-green-50 text-green-700 px-4 py-2 rounded-lg border border-green-200 shadow-sm flex items-center animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="w-4 h-4 mr-2" />
            {toastMessage}
          </div>
        )}
        
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nama Aplikasi</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={appName} 
                  onChange={e => setAppName(e.target.value)} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Kontak Support</label>
                <input 
                  type="email" 
                  className="form-input" 
                  value={contactEmail} 
                  onChange={e => setContactEmail(e.target.value)} 
                />
              </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Zona Waktu</label>
              <Select 
                className="w-full text-sm"
                value={timezone}
                onChange={setTimezone}
                options={[
                  { label: 'Asia/Jakarta (WIB)', value: 'Asia/Jakarta (WIB)' },
                  { label: 'Asia/Makassar (WITA)', value: 'Asia/Makassar (WITA)' },
                  { label: 'Asia/Jayapura (WIT)', value: 'Asia/Jayapura (WIT)' }
                ]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mata Uang Default</label>
              <Select 
                className="w-full text-sm"
                value={currency}
                onChange={setCurrency}
                options={[
                  { label: 'IDR (Rupiah)', value: 'IDR (Rupiah)' }
                ]}
              />
            </div>
          </div>

          <div className="pt-4 border-t border-border flex justify-end">
            <button type="submit" disabled={isSaving} className="btn-primary flex items-center">
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              {isSaving ? 'Menyimpan...' : 'Simpan Konfigurasi'}
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  )
}
