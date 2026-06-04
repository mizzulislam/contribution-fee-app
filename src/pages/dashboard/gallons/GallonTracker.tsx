import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { spreadsheetApi } from '@/lib/spreadsheet'
import { Plus, Loader2, X } from 'lucide-react'

export default function GallonTracker() {
  const [purchases, setPurchases] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: 4,
    price: 80000,
    vendor: 'Warung Pak Somad'
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const { data } = await spreadsheetApi.get('Gallons')
    if (data && Array.isArray(data) && data.length > 0) {
      setPurchases(data)
    } else {
      setPurchases([
        { id: 1, date: '2026-06-05', amount: 4, price: 80000, vendor: 'Warung Pak Somad' }
      ])
    }
    setLoading(false)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    const payload = {
      id: Date.now(),
      ...formData,
      amount: Number(formData.amount),
      price: Number(formData.price),
      created_at: new Date().toISOString()
    }
    const res = await spreadsheetApi.post('Gallons', payload)
    if (res.success) {
      setPurchases([payload, ...purchases])
    } else {
      setPurchases([payload, ...purchases])
    }
    setIsModalOpen(false)
    setIsSaving(false)
  }
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Tracker Air Galon</h1>
          <p className="text-text-secondary mt-1">Pantau konsumsi dan prediksi kebutuhan air galon kos.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="rounded-[20px] bg-[#ECFDF5] border border-[#10B981]/20 p-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <svg className="w-16 h-16 text-[#10B981]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C7.58 2 4 5.58 4 10V22H20V10C20 5.58 16.42 2 12 2ZM12 4C15.31 4 18 6.69 18 10V12H6V10C6 6.69 8.69 4 12 4ZM6 20V14H18V20H6Z"/>
            </svg>
          </div>
          <h3 className="text-[#047857] text-sm font-semibold relative z-10">Prediksi Habis</h3>
          <p className="text-3xl font-bold mt-2 text-[#047857] relative z-10">3 Hari Lagi</p>
          <p className="text-xs text-[#047857]/80 mt-1 relative z-10">15 Juni 2026</p>
        </div>
        <div className="card-container">
          <h3 className="text-text-secondary text-sm font-medium">Sisa Stok Galon</h3>
          <p className="text-3xl font-bold mt-2 text-gray-900">2 Galon</p>
        </div>
        <div className="card-container">
          <h3 className="text-text-secondary text-sm font-medium">Rata-rata Konsumsi</h3>
          <p className="text-3xl font-bold mt-2 text-gray-900">0.8 <span className="text-sm font-normal text-text-muted">Galon/hari</span></p>
        </div>
        <div className="card-container">
          <h3 className="text-text-secondary text-sm font-medium">Rekomendasi Beli</h3>
          <p className="text-3xl font-bold mt-2 text-gray-900">4 Galon</p>
        </div>
      </div>

      <div className="card-container min-h-[300px] flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Riwayat Pembelian</h2>
          <button onClick={() => setIsModalOpen(true)} className="btn-primary py-1.5 px-4 text-sm flex items-center">
            <Plus className="w-4 h-4 mr-1" /> Catat Pembelian
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50/80 text-gray-700 text-xs uppercase font-semibold border-b border-border">
              <tr>
                <th className="px-4 py-3">Tanggal</th>
                <th className="px-4 py-3">Jumlah Galon</th>
                <th className="px-4 py-3">Total Harga</th>
                <th className="px-4 py-3">Vendor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={4} className="px-4 py-4 text-center">Memuat data...</td></tr>
              ) : purchases.map((item) => (
                <tr key={item.id} className="hover:bg-primary-soft/30 transition-colors">
                  <td className="px-4 py-3">{item.date}</td>
                  <td className="px-4 py-3">{item.amount} Galon</td>
                  <td className="px-4 py-3 font-medium text-gray-900">Rp {item.price.toLocaleString('id-ID')}</td>
                  <td className="px-4 py-3">{item.vendor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-border">
              <h2 className="text-xl font-bold text-gray-900">Catat Pembelian Galon</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah (Galon)</label>
                  <input
                    type="number" required className="form-input"
                    value={formData.amount} onChange={e => setFormData({...formData, amount: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
                  <input
                    type="date" required className="form-input"
                    value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Harga (Rp)</label>
                <input
                  type="number" required className="form-input"
                  value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vendor/Toko</label>
                <input
                  type="text" required className="form-input"
                  value={formData.vendor} onChange={e => setFormData({...formData, vendor: e.target.value})}
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                  Batal
                </button>
                <button type="submit" disabled={isSaving} className="btn-primary flex items-center">
                  {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
