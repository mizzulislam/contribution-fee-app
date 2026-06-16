import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { spreadsheetApi } from '@/lib/spreadsheet'
import { Search, SearchCheck, CheckCircle2, XCircle, Eye, X, AlertTriangle, FileText } from 'lucide-react'
import { TableLoader } from '@/components/ui/TableLoader'
import { isDateInPeriod, type PeriodFilter } from '@/lib/accounting/period'

interface PaymentVerification {
  id: number | string
  billId?: number | string
  bill_id?: number | string
  resident_name?: string
  room_number?: string
  title?: string
  date_submitted?: string
  amount: number
  status: string
  date_verified?: string
  updated_at?: string
  fileName?: string
  proofFileName?: string
  proofMimeType?: string
  proofDataUrl?: string
}

interface VerificationProps {
  period?: PeriodFilter
}

const defaultPeriod: PeriodFilter = { preset: 'all' }

export default function Verification({ period = defaultPeriod }: VerificationProps) {
  const [verifications, setVerifications] = useState<PaymentVerification[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [toastMessage, setToastMessage] = useState('')
  const [previewPayment, setPreviewPayment] = useState<PaymentVerification | null>(null)
  const [alertDialog, setAlertDialog] = useState({ isOpen: false, title: '', message: '', isConfirm: false, onConfirm: () => {} })

  async function fetchVerifications() {
    setLoading(true)
    const { data } = await spreadsheetApi.get('Payments')
    
    if (data && Array.isArray(data)) {
      setVerifications(data.filter((p: PaymentVerification) => p.status === 'Menunggu Verifikasi' || p.status === 'pending_verification'))
    } else {
      setVerifications([])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchVerifications()
  }, [])

  const formatCurrency = (amount: number) => {
    return (
      <div className="flex justify-between items-center w-full min-w-[80px]">
        <span className="text-gray-500 mr-2">Rp</span>
        <span>{new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(amount)}</span>
      </div>
    )
  }

  const filtered = verifications.filter(v => {
    const matchesSearch =
      v.resident_name?.toLowerCase().includes(search.toLowerCase()) || 
      v.title?.toLowerCase().includes(search.toLowerCase())
    const matchesPeriod = isDateInPeriod(v.date_submitted || v.updated_at || '', period)
    return matchesSearch && matchesPeriod
  })

  const confirmAction = (id: number | string, action: 'approve' | 'reject') => {
    const actName = action === 'approve' ? 'menyetujui' : 'menolak'
    setAlertDialog({
      isOpen: true,
      title: `Konfirmasi ${action === 'approve' ? 'Persetujuan' : 'Penolakan'}`,
      message: `Apakah Anda yakin ingin ${actName} pembayaran ini?`,
      isConfirm: true,
      onConfirm: () => handleAction(id, action)
    })
  }

  const handleAction = async (id: number | string, action: 'approve' | 'reject') => {
    const item = verifications.find(v => v.id === id)
    if (!item) return
    
    const newStatus = action === 'approve' ? 'paid' : 'rejected'
    const billStatus = action === 'approve' ? 'paid' : 'rejected'
    setVerifications(verifications.filter(v => v.id !== id)) // Optimistic update
    
    const payload = {
      ...item,
      status: newStatus,
      date_verified: action === 'approve' ? new Date().toISOString() : item.date_verified,
      updated_at: new Date().toISOString()
    }

    const targetBillId = item.billId || item.bill_id
    let billPayload: any = null

    if (targetBillId) {
      const { data: billsData } = await spreadsheetApi.get('Bills')
      if (Array.isArray(billsData)) {
        const foundBill = billsData.find(b => String(b.id) === String(targetBillId))
        if (foundBill) {
          billPayload = {
            ...foundBill,
            status: billStatus,
            updated_at: new Date().toISOString()
          }
        }
      }
    }

    if (!billPayload && targetBillId) {
      billPayload = {
        id: targetBillId,
        status: billStatus,
        updated_at: new Date().toISOString()
      }
    }
    
    await Promise.all([
      spreadsheetApi.put('Payments', payload),
      billPayload
        ? spreadsheetApi.put('Bills', billPayload)
        : Promise.resolve({ success: true, error: null }),
    ])
    
    setAlertDialog(prev => ({...prev, isOpen: false}))
    setToastMessage(`Pembayaran berhasil di-${action === 'approve' ? 'setujui' : 'tolak'}.`)
    setTimeout(() => setToastMessage(''), 3000)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center">
            <SearchCheck className="mr-3 text-primary w-8 h-8" />
            Verifikasi Pembayaran
          </h1>
          <p className="text-text-secondary mt-1">Periksa dan setujui bukti transfer dari penghuni.</p>
        </div>
      </div>

      <div className="card-container">
        <div className="p-4 sm:p-6 border-b border-border flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50/50 rounded-t-[20px]">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Cari penghuni..." 
              className="form-input pl-10 bg-white"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50/80 text-gray-700 text-xs uppercase font-semibold border-b border-border">
              <tr>
                <th className="px-6 py-4">Penghuni</th>
                <th className="px-6 py-4">Tagihan</th>
                <th className="px-6 py-4">Tanggal Submit</th>
                <th className="px-6 py-4">Nominal</th>
                <th className="px-6 py-4">Bukti TF</th>
                <th className="px-6 py-4">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <TableLoader colSpan={6} text="Memuat data pembayaran..." />
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">Tidak ada antrean verifikasi saat ini.</td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-primary-soft/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{item.resident_name}</div>
                      <div className="text-xs text-text-muted">Kamar {item.room_number}</div>
                    </td>
                    <td className="px-6 py-4">{item.title}</td>
                    <td className="px-6 py-4">{item.date_submitted}</td>
                    <td className="px-6 py-4 font-semibold text-gray-900">{formatCurrency(item.amount)}</td>
                    <td className="px-6 py-4">
                      {item.proofDataUrl || item.proofFileName || item.fileName ? (
                        <button
                          onClick={() => setPreviewPayment(item)}
                          className="flex items-center text-primary hover:text-primary-dark transition-colors font-medium"
                        >
                          <Eye className="w-4 h-4 mr-1" /> Lihat Bukti
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">Tidak ada bukti</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => confirmAction(item.id, 'approve')}
                          className="p-1.5 text-success bg-success/10 hover:bg-success/20 rounded-md transition-colors"
                          title="Setujui"
                        >
                          <CheckCircle2 className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => confirmAction(item.id, 'reject')}
                          className="p-1.5 text-danger bg-danger/10 hover:bg-danger/20 rounded-md transition-colors"
                          title="Tolak"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      </div>
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

      {/* Payment Proof Preview Modal */}
      {previewPayment && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm" onClick={() => setPreviewPayment(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-2 relative" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setPreviewPayment(null)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 p-2"
            >
              <X className="w-8 h-8" />
            </button>
            <div className="bg-gray-100 rounded-xl overflow-hidden aspect-[3/4] flex items-center justify-center relative">
              {previewPayment.proofDataUrl?.startsWith('data:image/') ? (
                <img src={previewPayment.proofDataUrl} alt="Bukti transfer" className="h-full w-full object-contain" />
              ) : previewPayment.proofDataUrl?.startsWith('data:application/pdf') ? (
                <iframe src={previewPayment.proofDataUrl} title="Bukti transfer PDF" className="h-full w-full bg-white" />
              ) : (
                <div className="text-center p-8">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">{previewPayment.proofFileName || previewPayment.fileName || 'Bukti transfer'}</p>
                  <p className="text-xs text-gray-400 mt-2">File tersimpan sebagai metadata tanpa pratinjau visual.</p>
                </div>
              )}
            </div>
            <div className="p-4 text-center">
              <button onClick={() => setPreviewPayment(null)} className="btn-secondary w-full">Tutup Preview</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Alert Dialog */}
      {alertDialog.isOpen && createPortal(
        <div
          className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm transition-opacity"
          onMouseDown={() => setAlertDialog(prev => ({...prev, isOpen: false}))}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all p-6 text-center"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className={`mx-auto w-14 h-14 flex items-center justify-center rounded-full mb-5 ${alertDialog.title.includes('Tolak') ? 'bg-red-100 text-red-600' : 'bg-primary-100 text-primary-600'}`}>
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">{alertDialog.title}</h3>
            <p className="text-sm text-gray-600 mb-8 whitespace-pre-line text-left leading-relaxed">
              {alertDialog.message}
            </p>
            <div className="flex gap-3 justify-center">
              {alertDialog.isConfirm && (
                <button 
                  onClick={() => setAlertDialog(prev => ({...prev, isOpen: false}))}
                  className="btn-secondary flex-1 py-2.5 font-medium"
                >
                  Batal
                </button>
              )}
              <button 
                onClick={alertDialog.onConfirm}
                className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-white transition-colors shadow-md ${
                  alertDialog.title.includes('Tolak') 
                    ? 'bg-red-600 hover:bg-red-700 shadow-red-500/20' 
                    : 'bg-primary hover:bg-primary-dark shadow-primary/20'
                }`}
              >
                Konfirmasi
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
