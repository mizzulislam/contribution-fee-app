import { useState, useEffect } from 'react'
import Select from '@/components/ui/Select'
import { BellRing, Save, Loader2, CheckCircle2, Brain } from 'lucide-react'
import { spreadsheetApi } from '@/services/sheets-client'

export default function NotificationSettings() {
  const [settings, setSettings] = useState({
    billingReminder: true,
    billingReminderDays: 3,
    paymentVerification: true,
    dutyReminder: false,
    systemAlerts: true,
    gallonReminder: false,
    gallonReminderMode: 'manual',
    gallonReminderDays: 5,
    gallonResidentCount: 10,
    gallonConsumptionRate: 2,
    gallonStock: 2,
    whatsappProvider: 'manual',
    whatsappToken: '',
    whatsappSender: ''
  })
  
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [toastMessage, setToastMessage] = useState('')

  const fetchSettings = async () => {
    try {
      const { data } = await spreadsheetApi.get('NotificationSettings')
      if (data && data.length > 0) {
        const remoteSettings = data[0]
        setSettings({
          billingReminder: remoteSettings.billingReminder === 'true' || remoteSettings.billingReminder === true,
          billingReminderDays: remoteSettings.billingReminderDays ? parseInt(remoteSettings.billingReminderDays) : 3,
          paymentVerification: remoteSettings.paymentVerification === 'true' || remoteSettings.paymentVerification === true,
          dutyReminder: remoteSettings.dutyReminder === 'true' || remoteSettings.dutyReminder === true,
          systemAlerts: remoteSettings.systemAlerts === 'true' || remoteSettings.systemAlerts === true,
          gallonReminder: remoteSettings.gallonReminder === 'true' || remoteSettings.gallonReminder === true,
          gallonReminderMode: remoteSettings.gallonReminderMode || 'manual',
          gallonReminderDays: remoteSettings.gallonReminderDays ? parseInt(remoteSettings.gallonReminderDays) : 5,
          gallonResidentCount: remoteSettings.gallonResidentCount ? parseInt(remoteSettings.gallonResidentCount) : 10,
          gallonConsumptionRate: remoteSettings.gallonConsumptionRate ? parseFloat(remoteSettings.gallonConsumptionRate) : 2,
          gallonStock: remoteSettings.gallonStock ? parseInt(remoteSettings.gallonStock) : 2,
          whatsappProvider: remoteSettings.whatsappProvider || 'manual',
          whatsappToken: remoteSettings.whatsappToken || '',
          whatsappSender: remoteSettings.whatsappSender || ''
        })
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  const handleSave = async () => {
    setIsSaving(true)
    const payload = {
      id: 1,
      ...settings,
      updated_at: new Date().toISOString()
    }
    
    try {
      const res = await spreadsheetApi.put('NotificationSettings', payload)
      if (!res.success) {
        await spreadsheetApi.post('NotificationSettings', payload)
      }
      setToastMessage('Pengaturan notifikasi berhasil disimpan!')
      setTimeout(() => setToastMessage(''), 3000)
    } catch (err) {
      console.error(err)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight flex items-center">
          <BellRing className="mr-2 sm:mr-3 text-primary w-6 h-6 sm:w-8 sm:h-8" />
          Pengaturan Notifikasi
        </h1>
        <p className="text-xs sm:text-sm text-text-secondary mt-1">Konfigurasi pesan notifikasi otomatis untuk penghuni dan admin.</p>
      </div>

      <div className="card-container p-6 sm:p-8 relative">
        {toastMessage && (
          <div className="absolute top-4 right-4 bg-green-50 text-green-700 px-4 py-2 rounded-lg border border-green-200 shadow-sm flex items-center animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="w-4 h-4 mr-2" />
            {toastMessage}
          </div>
        )}
        
        <h2 className="text-xl font-bold text-gray-900 mb-6 border-b pb-4">Aturan Pengiriman Otomatis</h2>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : (
          <>
            <div className="space-y-6">
              <div className="border-b border-gray-100 pb-6">
                <div className="flex items-start sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">Pengingat Tagihan</p>
                    <p className="text-sm text-text-secondary mt-1">Kirim WhatsApp/Email peringatan sebelum jatuh tempo.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input type="checkbox" className="sr-only peer" checked={settings.billingReminder} onChange={(e) => setSettings({...settings, billingReminder: e.target.checked})} />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
                
                {settings.billingReminder && (
                  <div className="mt-5 p-5 bg-gray-50/80 rounded-xl border border-gray-100 animate-in fade-in slide-in-from-top-2">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-sm font-medium text-gray-700">Waktu Pengiriman Peringatan:</span>
                      <span className="text-sm font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">H-{settings.billingReminderDays} Sebelum Jatuh Tempo</span>
                    </div>
                    <input 
                      type="range" 
                      min="1" 
                      max="14" 
                      step="1"
                      value={settings.billingReminderDays}
                      onChange={(e) => setSettings({...settings, billingReminderDays: parseInt(e.target.value)})}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                    <div className="flex justify-between text-xs font-medium text-gray-400 mt-3">
                      <span>H-1</span>
                      <span>H-7</span>
                      <span>H-14</span>
                    </div>
                  </div>
                )}
              </div>
          
          <div className="flex items-center justify-between border-b border-gray-100 pb-6">
            <div>
              <p className="font-semibold text-gray-900">Konfirmasi Pembayaran</p>
              <p className="text-sm text-text-secondary">Notifikasi ke bendahara saat ada pembayaran baru diunggah.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={settings.paymentVerification} onChange={(e) => setSettings({...settings, paymentVerification: e.target.checked})} />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          <div className="border-b border-gray-100 pb-6">
            <div className="flex items-start sm:items-center justify-between gap-4">
              <div className="flex-1">
                <p className="font-semibold text-gray-900">Pengingat Air Galon</p>
                <p className="text-sm text-text-secondary mt-1">Notifikasi otomatis estimasi stok air galon akan habis.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input type="checkbox" className="sr-only peer" checked={settings.gallonReminder} onChange={(e) => setSettings({...settings, gallonReminder: e.target.checked})} />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
            
            {settings.gallonReminder && (
              <div className="mt-5 p-5 bg-gray-50/80 rounded-xl border border-gray-100 animate-in fade-in slide-in-from-top-2">
                <div className="flex mb-6 space-x-2 p-1 bg-gray-200/50 rounded-lg w-fit">
                  <button type="button" onClick={() => setSettings({...settings, gallonReminderMode: 'manual'})} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${settings.gallonReminderMode === 'manual' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>Manual (Hari)</button>
                  <button type="button" onClick={() => setSettings({...settings, gallonReminderMode: 'auto'})} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center ${settings.gallonReminderMode === 'auto' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
                    <Brain className="w-4 h-4 mr-1.5 text-primary" /> Algoritma Cerdas
                  </button>
                </div>

                {settings.gallonReminderMode === 'manual' ? (
                  <div className="animate-in fade-in">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-sm font-medium text-gray-700">Ingatkan Setelah:</span>
                      <span className="text-sm font-bold text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full">{settings.gallonReminderDays} Hari Sejak Isi Ulang Terakhir</span>
                    </div>
                    <input 
                      type="range" 
                      min="1" 
                      max="14" 
                      step="1"
                      value={settings.gallonReminderDays}
                      onChange={(e) => setSettings({...settings, gallonReminderDays: parseInt(e.target.value)})}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <div className="flex justify-between text-xs font-medium text-gray-400 mt-3">
                      <span>1 Hari</span>
                      <span>7 Hari</span>
                      <span>14 Hari</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5 animate-in fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">Jumlah Penghuni</label>
                        <div className="relative">
                           <input type="number" min="1" value={settings.gallonResidentCount} onChange={e => setSettings({...settings, gallonResidentCount: parseInt(e.target.value) || 1})} className="form-input text-sm w-full pr-14" />
                           <span className="absolute right-3 top-2 text-gray-400 text-sm">Orang</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">Intensitas Minum</label>
                        <div className="relative">
                           <input type="number" step="0.5" min="0.5" value={settings.gallonConsumptionRate} onChange={e => setSettings({...settings, gallonConsumptionRate: parseFloat(e.target.value) || 0.5})} className="form-input text-sm w-full pr-16" />
                           <span className="absolute right-3 top-2 text-gray-400 text-sm">L / Hari</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">Sisa Stok Galon</label>
                        <div className="relative">
                           <input type="number" min="1" value={settings.gallonStock} onChange={e => setSettings({...settings, gallonStock: parseInt(e.target.value) || 1})} className="form-input text-sm w-full pr-14" />
                           <span className="absolute right-3 top-2 text-gray-400 text-sm">Galon</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl flex items-start">
                      <div className="bg-blue-100 p-2 rounded-lg mr-3 shrink-0">
                        <Brain className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-blue-900">Hasil Prediksi Kalkulasi</p>
                        <p className="text-sm text-blue-800/80 mt-1 leading-relaxed">
                          Total konsumsi harian adalah <b>{(settings.gallonResidentCount * settings.gallonConsumptionRate).toFixed(1)} Liter</b>, sedangkan stok air saat ini adalah <b>{settings.gallonStock * 19} Liter</b> (Asumsi 19L/Galon).
                        </p>
                        <div className="mt-3 bg-white px-3 py-2 rounded border border-blue-100 text-sm">
                          <span className="text-gray-600">Sistem akan otomatis mengirimkan peringatan dalam: </span>
                          <span className="font-bold text-primary ml-1">{Math.max(1, Math.floor((settings.gallonStock * 19) / (settings.gallonResidentCount * settings.gallonConsumptionRate)))} Hari Lagi</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Integrasi WhatsApp Gateway Section */}
          <div className="mt-8 border-t border-gray-200 pt-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 border-b pb-4">Integrasi WhatsApp Gateway</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Provider WhatsApp
                </label>
                <Select
                  value={settings.whatsappProvider}
                  onChange={(val) => setSettings({ ...settings, whatsappProvider: val })}
                  options={[
                    { value: 'manual', label: 'Manual (wa.me Redirect)' },
                    { value: 'fonnte', label: 'Fonnte (Otomatis)' }
                  ]}
                />
                <p className="text-xs text-text-secondary mt-1">
                  Pilih 'Fonnte' untuk pengiriman otomatis di latar belakang, atau 'Manual' untuk pengalihan tautan browser.
                </p>
              </div>

              {settings.whatsappProvider === 'fonnte' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-5 bg-gray-50 border border-gray-100 rounded-xl animate-in fade-in slide-in-from-top-2">
                  <div className="sm:col-span-2">
                    <p className="text-xs text-orange-600 font-semibold bg-orange-50 border border-orange-100 px-3 py-2 rounded-lg">
                      ⚠️ Catatan: Hubungkan perangkat Anda di Fonnte terlebih dahulu dan ambil token dari halaman dashboard Fonnte.
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      API Token Fonnte
                    </label>
                    <input
                      type="password"
                      placeholder="Masukkan token Fonnte Anda"
                      value={settings.whatsappToken}
                      onChange={(e) => setSettings({ ...settings, whatsappToken: e.target.value })}
                      className="form-input text-sm w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Nomor Pengirim / Device ID (Opsional)
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: 628123456789"
                      value={settings.whatsappSender}
                      onChange={(e) => setSettings({ ...settings, whatsappSender: e.target.value })}
                      className="form-input text-sm w-full"
                    />
                    <p className="text-[10px] text-text-secondary mt-1">
                      Kosongkan jika ingin menggunakan device default di Fonnte.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button onClick={handleSave} disabled={isSaving} className="btn-primary flex items-center">
            {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
            {isSaving ? 'Menyimpan...' : 'Simpan Pengaturan'}
          </button>
        </div>
          </>
        )}
      </div>
    </div>
  )
}
