import { useState, useEffect } from 'react'
import { LayoutGrid, Save, Loader2, CheckCircle2, ShieldAlert, ToggleLeft, ToggleRight, Settings } from 'lucide-react'
import { spreadsheetApi } from '@/services/sheets-client'

interface PageItem {
  id: string
  name: string
  path: string
  system: 'Bendahara / Admin' | 'Warga / Penghuni'
  description: string
}

const PAGES_LIST: PageItem[] = [
  // Admin Portal
  { id: 'billing', name: 'Kelola Tagihan', path: '/dashboard/billing', system: 'Bendahara / Admin', description: 'Menu tagihan, pembuatan tagihan iuran, kompensasi utang, dan riwayat pembayaran.' },
  { id: 'finance', name: 'Akuntansi & Laporan', path: '/dashboard/finance', system: 'Bendahara / Admin', description: 'Jurnal umum, jurnal penyesuaian, buku besar, neraca saldo, laporan keuangan, dan tutup buku.' },
  { id: 'gallons-management', name: 'Sistem Galon', path: '/dashboard/gallons-management', system: 'Bendahara / Admin', description: 'Pencatatan konsumsi air galon, riwayat order, dan statistik penggunaan.' },
  { id: 'duties', name: 'Jadwal Piket', path: '/dashboard/duties', system: 'Bendahara / Admin', description: 'Manajemen jadwal piket galon, roulette pengocok giliran, dan riwayat giliran.' },

  // User Portal
  { id: 'billing-user', name: 'Pusat Pembayaran', path: '/dashboard/billing-user', system: 'Warga / Penghuni', description: 'Tampilan tagihan aktif warga, upload bukti transfer pembayaran, dan riwayat kuitansi.' },
  { id: 'cash-reports', name: 'Kas Kos', path: '/dashboard/cash-reports', system: 'Warga / Penghuni', description: 'Laporan arus kas masuk-keluar kas kos dan grafik saldo secara transparan.' },
  { id: 'gallons-info', name: 'Info Galon', path: '/dashboard/gallons-info', system: 'Warga / Penghuni', description: 'Statistik air galon yang tersisa, kapasitas dispenser, dan log penggunaan.' },
  { id: 'duties-mine', name: 'Kalender Kos', path: '/dashboard/duties-mine', system: 'Warga / Penghuni', description: 'Kalender giliran piket pribadi warga dan tombol konfirmasi penyelesaian tugas.' },
  { id: 'information', name: 'Pusat Informasi', path: '/dashboard/information', system: 'Warga / Penghuni', description: 'Pengumuman terbaru dari pengelola kos dan notifikasi pengingat.' },
]

export default function PageControl() {
  const [disabledPages, setDisabledPages] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  const fetchPageSettings = async () => {
    setLoading(true)
    try {
      const { data } = await spreadsheetApi.get('Settings')
      if (data && data.length > 0) {
        const settings = data[0]
        if (settings.disabledPages) {
          setDisabledPages(JSON.parse(settings.disabledPages))
        }
      }
    } catch (err) {
      console.error('Failed to load page settings:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPageSettings()
  }, [])

  const handleToggle = async (path: string) => {
    setIsSaving(true)
    const newDisabled = disabledPages.includes(path)
      ? disabledPages.filter(p => p !== path)
      : [...disabledPages, path]

    setDisabledPages(newDisabled)

    try {
      const { data } = await spreadsheetApi.get('Settings')
      const existing = data && data.length > 0 ? data[0] : {}

      const payload = {
        ...existing,
        id: 1,
        disabledPages: JSON.stringify(newDisabled),
        updated_at: new Date().toISOString()
      }

      const res = await spreadsheetApi.put('Settings', payload)
      if (!res.success) {
        await spreadsheetApi.post('Settings', payload)
      }

      setToastMessage('Akses Halaman Berhasil Diperbarui!')
      setTimeout(() => setToastMessage(''), 3000)
    } catch (err) {
      console.error(err)
      setToastMessage('Gagal memperbarui akses halaman.')
      setTimeout(() => setToastMessage(''), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  const grouped = PAGES_LIST.reduce((acc, curr) => {
    if (!acc[curr.system]) acc[curr.system] = []
    acc[curr.system].push(curr)
    return acc
  }, {} as Record<string, PageItem[]>)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight flex items-center">
            <LayoutGrid className="mr-2 sm:mr-3 text-primary w-6 h-6 sm:w-8 sm:h-8" />
            Manajemen Halaman
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            Aktifkan atau nonaktifkan halaman pada portal Bendahara/Admin dan Warga/Penghuni.
          </p>
        </div>
      </div>

      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-lg flex items-center font-medium animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 mr-3" />
          {toastMessage}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-20 text-emerald-700">
          <Loader2 className="w-10 h-10 animate-spin mb-4" />
          <p className="font-medium">Memuat data akses halaman...</p>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-sm font-semibold">Petunjuk Keamanan Akses</div>
              <p className="text-xs mt-1 leading-relaxed">
                Menonaktifkan halaman akan menyembunyikan menu navigasi sidebar dan langsung menolak akses rute (redirect ke dashboard) bagi pengguna terkait. Kode fitur tidak dihapus sehingga aman diaktifkan kembali sewaktu-waktu.
              </p>
            </div>
          </div>

          {Object.entries(grouped).map(([system, items]) => (
            <div key={system} className="space-y-4">
              <h2 className="text-lg font-bold text-gray-800 border-b pb-2 border-gray-100 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                Portal {system}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {items.map((page) => {
                  const isActive = !disabledPages.includes(page.path)
                  return (
                    <div 
                      key={page.id}
                      className={`border p-5 rounded-2xl flex flex-col justify-between transition-all duration-300 ${
                        isActive 
                          ? 'bg-white border-gray-250/80 shadow-sm hover:shadow-md hover:scale-[1.01]' 
                          : 'bg-gray-50/50 border-gray-200 opacity-70'
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-gray-900 text-base">{page.name}</h3>
                            <code className="text-[11px] text-gray-500 font-mono mt-0.5 block">{page.path}</code>
                          </div>
                          
                          {/* Toggle Switch */}
                          <button
                            type="button"
                            disabled={isSaving}
                            onClick={() => handleToggle(page.path)}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                              isActive
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                            }`}
                          >
                            {isActive ? (
                              <>
                                <ToggleRight className="w-4 h-4 text-emerald-600" />
                                <span>Aktif</span>
                              </>
                            ) : (
                              <>
                                <ToggleLeft className="w-4 h-4 text-gray-400" />
                                <span>Nonaktif</span>
                              </>
                            )}
                          </button>
                        </div>
                        <p className="text-xs text-text-secondary mt-3 leading-relaxed">
                          {page.description}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
