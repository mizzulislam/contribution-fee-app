import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { spreadsheetApi } from '@/services/sheets-client'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { History, Search, CheckCircle2, Download, X, Printer } from 'lucide-react'
import { TableLoader } from '@/components/ui/TableLoader'

interface PaymentRecord {
  id: number | string
  resident_email?: string
  resident_name?: string
  title?: string
  month?: string
  date_verified?: string
  amount: number
  status: string
  billId?: number | string
}

export default function PaymentHistory() {
  const { profile } = useAuth()
  const [history, setHistory] = useState<PaymentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [receiptItem, setReceiptItem] = useState<PaymentRecord | null>(null)

  async function fetchHistory() {
    setLoading(true)
    const { data } = await spreadsheetApi.get('Payments')
    
    if (data && Array.isArray(data)) {
      setHistory((data as PaymentRecord[]).filter((p: PaymentRecord) => {
        const isPaid = ['verified', 'paid', 'Lunas'].includes(p.status)
        const belongsToUser = p.resident_email === profile?.email || p.resident_name === profile?.full_name
        return isPaid && belongsToUser
      }))
    } else {
      setHistory([])
    }
    setLoading(false)
  }

  useEffect(() => {
    if (profile?.id) {
      fetchHistory()
    }
  }, [profile?.id])

  const formatCurrency = (amount: number) => {
    return (
      <div className="flex justify-between items-center w-full min-w-[80px]">
        <span className="text-gray-500 mr-2">Rp</span>
        <span>{new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(amount)}</span>
      </div>
    )
  }

  const formatCurrencyStr = (amount: number) =>
    `Rp ${new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(amount)}`

  const filtered = history.filter(h => 
    h.title?.toLowerCase().includes(search.toLowerCase()) || 
    h.month?.toLowerCase().includes(search.toLowerCase())
  )

  const handlePrint = () => {
    if (!receiptItem) return
    const printWin = window.open('', '_blank', 'width=480,height=680')
    if (!printWin) return
    const dateVerified = receiptItem.date_verified
      ? new Date(receiptItem.date_verified).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
      : '-'
    const receiptNo = `RCP-${String(receiptItem.id).slice(0, 8).toUpperCase()}`
    const printedAt = new Date().toLocaleString('id-ID')

    printWin.document.write(`
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8" />
        <title>Kuitansi Pembayaran - ${receiptNo}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; background: #fff; color: #111; }
          .receipt { width: 420px; margin: 32px auto; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
          .header { background: linear-gradient(135deg, #059669, #10b981); color: #fff; padding: 24px 28px; }
          .brand { font-size: 11px; font-weight: 700; letter-spacing: 2px; opacity: 0.85; margin-bottom: 4px; }
          .header h1 { font-size: 20px; font-weight: 800; }
          .header .receipt-no { font-size: 12px; opacity: 0.75; margin-top: 4px; }
          .badge-paid { display: inline-flex; align-items: center; gap: 6px; background: #d1fae5; color: #065f46; border-radius: 999px; padding: 4px 12px; font-size: 12px; font-weight: 700; margin-top: 12px; }
          .body { padding: 24px 28px; }
          .row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #f3f4f6; font-size: 13px; }
          .row:last-child { border-bottom: none; }
          .label { color: #6b7280; }
          .value { font-weight: 600; color: #111827; text-align: right; }
          .amount-row { background: #f0fdf4; border-radius: 10px; padding: 14px 16px; margin: 16px 0; display: flex; justify-content: space-between; align-items: center; }
          .amount-label { font-size: 13px; color: #065f46; font-weight: 600; }
          .amount-value { font-size: 20px; font-weight: 800; color: #059669; }
          .footer { background: #f9fafb; border-top: 1px dashed #e5e7eb; padding: 14px 28px; font-size: 11px; color: #9ca3af; text-align: center; }
          @media print {
            body { margin: 0; }
            .receipt { box-shadow: none; border: 1px solid #e5e7eb; margin: 0 auto; }
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <div class="brand">SOEMATRA KOST</div>
            <h1>Kuitansi Pembayaran</h1>
            <div class="receipt-no">${receiptNo}</div>
            <div class="badge-paid">✓ Lunas &amp; Terverifikasi</div>
          </div>
          <div class="body">
            <div class="row">
              <span class="label">Nama Penghuni</span>
              <span class="value">${receiptItem.resident_name || profile?.full_name || '-'}</span>
            </div>
            <div class="row">
              <span class="label">Keterangan</span>
              <span class="value">${receiptItem.title || '-'}</span>
            </div>
            ${receiptItem.month ? `
            <div class="row">
              <span class="label">Periode</span>
              <span class="value">${receiptItem.month}</span>
            </div>` : ''}
            <div class="row">
              <span class="label">Tanggal Lunas</span>
              <span class="value">${dateVerified}</span>
            </div>
            <div class="row">
              <span class="label">Status</span>
              <span class="value" style="color:#059669">Lunas &amp; Terverifikasi</span>
            </div>
            <div class="amount-row">
              <span class="amount-label">Total Dibayar</span>
              <span class="amount-value">${formatCurrencyStr(Number(receiptItem.amount))}</span>
            </div>
          </div>
          <div class="footer">
            Dicetak pada ${printedAt} &bull; Soematra Kost Management System
          </div>
        </div>
        <script>window.onload = () => { window.print(); }<\/script>
      </body>
      </html>
    `)
    printWin.document.close()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight flex items-center">
            <History className="mr-2 sm:mr-3 text-primary w-6 h-6 sm:w-8 sm:h-8" />
            Riwayat Pembayaran
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">Daftar pembayaran iuran Anda yang sudah lunas dan terverifikasi.</p>
        </div>
      </div>

      <div className="card-container">
        <div className="p-4 sm:p-6 border-b border-border flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50/50 rounded-t-[20px]">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Cari transaksi..." 
              className="form-input pl-10 bg-white h-[42px]"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto w-full rounded-b-[20px] border-t border-border scrollbar-thin scrollbar-thumb-gray-200">
          <table className="min-w-[700px] w-full text-left text-sm text-gray-600">
            <thead className="bg-[#F3F4F6] text-gray-700 text-xs uppercase font-semibold border-b border-border">
              <tr>
                <th className="px-6 py-4">Keterangan</th>
                <th className="px-6 py-4 hidden md:table-cell">Periode</th>
                <th className="px-6 py-4">Tanggal Lunas</th>
                <th className="px-6 py-4">Nominal</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <TableLoader colSpan={6} text="Memuat riwayat pembayaran..." />
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">Tidak ada riwayat pembayaran yang ditemukan.</td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-primary-soft/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{item.title}</td>
                    <td className="px-6 py-4 hidden md:table-cell">{item.month}</td>
                    <td className="px-6 py-4">{item.date_verified ? new Date(item.date_verified).toLocaleDateString('id-ID') : '-'}</td>
                    <td className="px-6 py-4 font-semibold text-gray-900">{formatCurrency(item.amount)}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="badge badge-success inline-flex">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Lunas
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => setReceiptItem(item)}
                        className="btn-secondary py-1.5 px-3 text-xs inline-flex items-center hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5 mr-1.5" /> Kuitansi
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receipt Preview Modal */}
      {receiptItem && createPortal(
        <div
          className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200"
          onMouseDown={() => setReceiptItem(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200"
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* Receipt Header */}
            <div className="bg-gradient-to-br from-emerald-600 to-emerald-500 px-6 py-5 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-bold tracking-widest opacity-80 uppercase mb-1">Soematra Kost</p>
                  <h2 className="text-lg font-bold">Kuitansi Pembayaran</h2>
                  <p className="text-xs opacity-70 mt-0.5">RCP-{String(receiptItem.id).slice(0, 8).toUpperCase()}</p>
                </div>
                <button
                  onClick={() => setReceiptItem(null)}
                  className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-3 inline-flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1 text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Lunas &amp; Terverifikasi
              </div>
            </div>

            {/* Receipt Body */}
            <div className="px-6 py-4 space-y-0 divide-y divide-gray-100">
              <div className="flex justify-between py-2.5 text-sm">
                <span className="text-gray-500">Nama Penghuni</span>
                <span className="font-semibold text-gray-800 text-right">{receiptItem.resident_name || profile?.full_name || '-'}</span>
              </div>
              <div className="flex justify-between py-2.5 text-sm">
                <span className="text-gray-500">Keterangan</span>
                <span className="font-semibold text-gray-800 text-right">{receiptItem.title || '-'}</span>
              </div>
              {receiptItem.month && (
                <div className="flex justify-between py-2.5 text-sm">
                  <span className="text-gray-500">Periode</span>
                  <span className="font-semibold text-gray-800">{receiptItem.month}</span>
                </div>
              )}
              <div className="flex justify-between py-2.5 text-sm">
                <span className="text-gray-500">Tanggal Lunas</span>
                <span className="font-semibold text-gray-800">
                  {receiptItem.date_verified
                    ? new Date(receiptItem.date_verified).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                    : '-'}
                </span>
              </div>
              <div className="flex justify-between py-2.5 text-sm">
                <span className="text-gray-500">Status</span>
                <span className="font-semibold text-emerald-600">Lunas</span>
              </div>
            </div>

            {/* Amount Highlight */}
            <div className="mx-6 mb-4 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex justify-between items-center">
              <span className="text-sm font-semibold text-emerald-700">Total Dibayar</span>
              <span className="text-xl font-bold text-emerald-700">{formatCurrencyStr(Number(receiptItem.amount))}</span>
            </div>

            {/* Footer Actions */}
            <div className="px-6 pb-5 flex gap-2">
              <button
                onClick={() => setReceiptItem(null)}
                className="flex-1 btn-secondary py-2.5 text-sm font-medium"
              >
                Tutup
              </button>
              <button
                onClick={handlePrint}
                className="flex-1 btn-primary py-2.5 text-sm font-semibold inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 border-emerald-600 hover:border-emerald-700"
              >
                <Printer className="w-4 h-4" /> Cetak / PDF
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
