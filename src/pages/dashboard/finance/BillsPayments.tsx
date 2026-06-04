import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { spreadsheetApi } from '@/lib/spreadsheet'
import { CheckCircle2, Clock, XCircle, FileText, Search, Bell, Plus, X, Save, Check } from 'lucide-react'

export default function BillsPayments() {
  const [bills, setBills] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedBill, setSelectedBill] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [newBill, setNewBill] = useState({ resident_name: '', title: '', due_date: '', amount: 0 })

  useEffect(() => {
    fetchBills()
  }, [])

  const fetchBills = async () => {
    setLoading(true)
    const { data, error } = await spreadsheetApi.get('Bills')
    
    if (data && Array.isArray(data) && data.length > 0) {
      setBills(data)
    } else {
      // Mock data fallback
      setBills([
        { id: 1, resident_name: 'Budi Santoso', room_number: '101', contributions: { title: 'Iuran Wajib Bulanan', contribution_types: { name: 'Iuran Wajib' } }, due_date: '2026-06-10', amount: 500000, status: 'unpaid' },
        { id: 2, resident_name: 'Ahmad Dahlan', room_number: '103', contributions: { title: 'Iuran Wajib Bulanan', contribution_types: { name: 'Iuran Wajib' } }, due_date: '2026-05-10', amount: 500000, status: 'paid' },
        { id: 3, resident_name: 'Siti Aminah', room_number: '102', contributions: { title: 'Iuran Sampah', contribution_types: { name: 'Iuran Opsional' } }, due_date: '2026-06-15', amount: 25000, status: 'pending_verification' }
      ])
    }
    setLoading(false)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <span className="badge badge-success"><CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Lunas</span>
      case 'unpaid':
        return <span className="badge badge-warning"><XCircle className="w-3.5 h-3.5 mr-1.5" /> Belum Bayar</span>
      case 'pending_verification':
        return <span className="badge badge-info"><Clock className="w-3.5 h-3.5 mr-1.5" /> Verifikasi</span>
      case 'rejected':
        return <span className="badge badge-danger"><XCircle className="w-3.5 h-3.5 mr-1.5" /> Ditolak</span>
      default:
        return <span className="badge bg-gray-100 text-gray-700">{status}</span>
    }
  }

  const filteredBills = bills.filter(b => 
    b.resident_name?.toLowerCase().includes(search.toLowerCase()) ||
    b.contributions?.title?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center">
            <FileText className="mr-3 text-primary w-8 h-8" />
            Tagihan & Pembayaran
          </h1>
          <p className="text-text-secondary mt-1">Pantau seluruh status tagihan penghuni dan riwayat pembayarannya.</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="btn-primary flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" /> Buat Tagihan Baru
        </button>
      </div>

      <div className="card-container">
        <div className="p-4 sm:p-6 border-b border-border flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50/50 rounded-t-[20px]">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Cari penghuni atau tagihan..." 
              className="form-input pl-10 bg-white"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#F3F4F6] border-b border-border text-gray-600">
              <tr>
                <th className="px-6 py-3 font-semibold whitespace-nowrap">Penghuni</th>
                <th className="px-6 py-3 font-semibold whitespace-nowrap">Keterangan</th>
                <th className="px-6 py-3 font-semibold whitespace-nowrap">Jatuh Tempo</th>
                <th className="px-6 py-3 font-semibold whitespace-nowrap">Nominal</th>
                <th className="px-6 py-3 font-semibold whitespace-nowrap">Status</th>
                <th className="px-6 py-3 font-semibold whitespace-nowrap text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-gray-700 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-text-muted">Memuat data tagihan...</td>
                </tr>
              ) : filteredBills.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-text-muted">
                    Tidak ada tagihan yang ditemukan.
                  </td>
                </tr>
              ) : (
                filteredBills.map((bill) => (
                  <tr key={bill.id} className="hover:bg-[#ECFDF5] transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{bill.resident_name}</div>
                      <div className="text-xs text-text-secondary mt-0.5">Kamar {bill.room_number}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{bill.contributions?.title}</div>
                      <div className="text-xs text-text-secondary mt-0.5">{bill.contributions?.contribution_types?.name}</div>
                    </td>
                    <td className="px-6 py-4 text-text-secondary">{new Date(bill.due_date).toLocaleDateString('id-ID')}</td>
                    <td className="px-6 py-4 font-semibold">{formatCurrency(bill.amount)}</td>
                    <td className="px-6 py-4">{getStatusBadge(bill.status)}</td>
                    <td className="px-6 py-4 text-right">
                      {bill.status === 'unpaid' ? (
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => {
                              setToastMessage(`Berhasil mengirim pengingat ke ${bill.resident_name}`)
                              setTimeout(() => setToastMessage(''), 3000)
                            }}
                            className="btn-secondary py-1.5 px-3 text-xs inline-flex items-center text-orange-600 hover:text-orange-700 hover:bg-orange-50 border-orange-200"
                          >
                            <Bell className="w-3.5 h-3.5 mr-1.5" /> Ingatkan
                          </button>
                          <button 
                            onClick={() => { setSelectedBill(bill); setIsDetailModalOpen(true); }}
                            className="btn-secondary py-1.5 px-3 text-xs inline-flex items-center"
                          >
                            Detail
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => { setSelectedBill(bill); setIsDetailModalOpen(true); }}
                          className="btn-secondary py-1.5 px-3 text-xs inline-flex items-center"
                        >
                          Detail
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && createPortal(
        <div className="fixed top-4 right-4 z-[200] animate-in slide-in-from-top-2 fade-in duration-300">
          <div className="bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-lg flex items-center font-medium">
            <CheckCircle2 className="w-5 h-5 mr-3" />
            {toastMessage}
          </div>
        </div>,
        document.body
      )}

      {/* Add Bill Modal */}
      {isAddModalOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900">Buat Tagihan Baru</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault()
              setIsSubmitting(true)
              setTimeout(() => {
                const added = {
                  id: Date.now(),
                  resident_name: newBill.resident_name,
                  room_number: 'N/A',
                  contributions: { title: newBill.title, contribution_types: { name: 'Kustom' } },
                  due_date: newBill.due_date,
                  amount: newBill.amount,
                  status: 'unpaid'
                }
                setBills([added, ...bills])
                setIsSubmitting(false)
                setIsAddModalOpen(false)
                setToastMessage('Tagihan berhasil dibuat!')
                setTimeout(() => setToastMessage(''), 3000)
                setNewBill({ resident_name: '', title: '', due_date: '', amount: 0 })
              }, 600)
            }} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Penghuni</label>
                <input required type="text" className="form-input" value={newBill.resident_name} onChange={e => setNewBill({...newBill, resident_name: e.target.value})} placeholder="Contoh: Budi Santoso" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Keterangan / Judul Tagihan</label>
                <input required type="text" className="form-input" value={newBill.title} onChange={e => setNewBill({...newBill, title: e.target.value})} placeholder="Contoh: Iuran Listrik Tambahan" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Nominal (Rp)</label>
                  <input required type="number" className="form-input" value={newBill.amount || ''} onChange={e => setNewBill({...newBill, amount: Number(e.target.value)})} placeholder="50000" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Jatuh Tempo</label>
                  <input required type="date" className="form-input" value={newBill.due_date} onChange={e => setNewBill({...newBill, due_date: e.target.value})} />
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn-secondary flex-1">Batal</button>
                <button type="submit" disabled={isSubmitting} className="btn-primary flex-1 flex justify-center items-center">
                  {isSubmitting ? 'Memproses...' : <><Save className="w-5 h-5 mr-2" /> Simpan</>}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Detail Modal */}
      {isDetailModalOpen && selectedBill && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900">Rincian Tagihan</h2>
              <button onClick={() => setIsDetailModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Penghuni</span>
                  <span className="font-semibold text-gray-900">{selectedBill.resident_name} (Kamar {selectedBill.room_number})</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Tagihan</span>
                  <span className="font-medium text-gray-900">{selectedBill.contributions?.title}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Jatuh Tempo</span>
                  <span className="font-medium text-gray-900">{new Date(selectedBill.due_date).toLocaleDateString('id-ID')}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                  <span className="text-sm text-gray-500">Nominal</span>
                  <span className="text-lg font-bold text-primary">{formatCurrency(selectedBill.amount)}</span>
                </div>
              </div>
              <div className="flex justify-between items-center bg-white border border-gray-200 p-4 rounded-xl">
                <span className="text-sm font-medium text-gray-700">Status Pembayaran</span>
                {getStatusBadge(selectedBill.status)}
              </div>
              {selectedBill.status === 'unpaid' && (
                <button 
                  onClick={() => {
                    setBills(bills.map(b => b.id === selectedBill.id ? {...b, status: 'paid'} : b))
                    setIsDetailModalOpen(false)
                    setToastMessage('Tagihan ditandai sebagai Lunas secara manual.')
                    setTimeout(() => setToastMessage(''), 3000)
                  }}
                  className="w-full btn-primary flex items-center justify-center bg-emerald-600 hover:bg-emerald-700"
                >
                  <Check className="w-5 h-5 mr-2" /> Tandai Lunas (Manual)
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
