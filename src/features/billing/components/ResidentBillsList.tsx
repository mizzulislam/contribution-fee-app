import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { spreadsheetApi } from '@/services/sheets-client'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { CheckCircle2, Clock, XCircle, FileText, X, CreditCard, CalendarDays, Hash } from 'lucide-react'
import { TableLoader } from '@/components/ui/TableLoader'

interface ResidentBill {
  id: number | string
  resident_email?: string
  resident_name?: string
  title?: string
  description?: string
  category?: string
  month?: string
  due_date: string
  amount: number
  status: string
  contributions?: {
    title?: string
    contribution_types?: {
      name?: string
    }
  }
}

const formatDateStr = (dateStr?: string) => {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

export default function ResidentBillsList() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [bills, setBills] = useState<ResidentBill[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBill, setSelectedBill] = useState<ResidentBill | null>(null)

  useEffect(() => {
    if (!profile?.id) return

    async function fetchBills() {
      setLoading(true)
      const [billsRes, paymentsRes] = await Promise.all([
        spreadsheetApi.get('Bills'),
        spreadsheetApi.get('Payments')
      ])
      const billsData = billsRes.data
      const paymentsData = paymentsRes.data

      if (billsData && Array.isArray(billsData)) {
        let userBills = (billsData as ResidentBill[]).filter((b: ResidentBill) => b.resident_email === profile?.email || b.resident_name === profile?.full_name)

        if (paymentsData && Array.isArray(paymentsData)) {
          setPayments(paymentsData)
          userBills = userBills.map(bill => {
            const hasPending = paymentsData.some(p => String(p.billId) === String(bill.id) && (p.status === 'pending_verification' || p.status === 'Menunggu Verifikasi'))
            if (hasPending && (bill.status === 'unpaid' || bill.status === 'rejected')) {
              return { ...bill, status: 'pending_verification' }
            }
            
            // Safeguard: Jika total pembayaran yang terverifikasi >= nominal tagihan, otomatis set status Lunas (paid)
            if (bill.status === 'partially_paid' || bill.status === 'unpaid') {
              const verified = paymentsData.filter(
                p => String(p.billId) === String(bill.id) && (p.status === 'verified' || p.status === 'paid' || p.status === 'Terverifikasi' || p.status === 'Lunas')
              )
              const paidAmount = verified.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
              if (paidAmount >= (Number(bill.amount) || 0)) {
                return { ...bill, status: 'paid' }
              }
            }
            return bill
          })
        }
        setBills(userBills)
      } else {
        setBills([])
      }
      setLoading(false)
    }

    void fetchBills()

    const handleSync = (e: Event) => {
      const customEvent = e as CustomEvent
      const { sheetName } = customEvent.detail
      if (sheetName === 'Bills' || sheetName === 'Payments') {
        console.log(`♻️ Menyegarkan tagihan warga secara real-time karena sheet ${sheetName} diperbarui.`)
        void fetchBills()
      }
    }

    window.addEventListener('soematra-sync-event', handleSync)
    return () => window.removeEventListener('soematra-sync-event', handleSync)
  }, [profile?.email, profile?.full_name, profile?.id])

  const handlePayNow = (billId: number | string) => {
    navigate(`/dashboard/billing-user?tab=confirm&billId=${encodeURIComponent(String(billId))}`)
  }

  const getBillPaidAmount = (bill: ResidentBill) => {
    if (bill.status === 'paid') return Number(bill.amount) || 0
    const verified = payments.filter(
      p => String(p.billId) === String(bill.id) && (p.status === 'verified' || p.status === 'paid')
    )
    return verified.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
  }

  const getRemainingAmount = (bill: ResidentBill) => {
    if (bill.status !== 'partially_paid') return Number(bill.amount) || 0
    return Math.max(0, (Number(bill.amount) || 0) - getBillPaidAmount(bill))
  }

  const formatCurrency = (amount: number) => {
    return (
      <div className="flex justify-between items-center w-full min-w-[80px]">
        <span className="text-gray-500 mr-2">Rp</span>
        <span>{new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(amount)}</span>
      </div>
    )
  }

  const formatCurrencyInline = (amount: number) =>
    `Rp ${new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(amount)}`

  const getContributionData = (contrib: any) => {
    if (!contrib) return { title: '', contribution_types: { name: '' } }
    if (typeof contrib === 'string') {
      try {
        return JSON.parse(contrib)
      } catch {
        const titleMatch = contrib.match(/title=([^,}]+)/)
        const typeMatch = contrib.match(/contribution_types\s*=\s*\{[^}]*name=([^,}]+)/)
        const nameMatch = typeMatch || contrib.match(/\bname=([^,}]+)/)
        return {
          title: titleMatch ? titleMatch[1].trim() : '',
          contribution_types: { name: nameMatch ? nameMatch[1].trim() : '' }
        }
      }
    }
    return contrib || { title: '', contribution_types: { name: '' } }
  }

  const getBillTitle = (bill: ResidentBill) => {
    const contributionData = getContributionData(bill.contributions)
    return contributionData.title || bill.title || bill.description || contributionData.contribution_types?.name || 'Tagihan Kos'
  }

  const getBillSubtitle = (bill: ResidentBill) => {
    const contributionData = getContributionData(bill.contributions)
    const titleText = getBillTitle(bill)
    if (contributionData.contribution_types?.name && contributionData.contribution_types.name !== titleText) {
      return contributionData.contribution_types.name
    }
    if (bill.category && bill.category !== titleText) {
      return bill.category
    }
    return bill.month || '-'
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <span className="badge badge-success"><CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Lunas</span>
      case 'partially_paid':
        return <span className="badge" style={{ backgroundColor: '#fff7ed', color: '#c2410c', borderColor: '#fed7aa', border: '1px solid' }}><Clock className="w-3.5 h-3.5 mr-1.5" /> Belum Lunas</span>
      case 'unpaid':
        return <span className="badge badge-warning"><XCircle className="w-3.5 h-3.5 mr-1.5" /> Belum Bayar</span>
      case 'pending_verification':
        return <span className="badge badge-info"><Clock className="w-3.5 h-3.5 mr-1.5" /> Menunggu Verifikasi</span>
      case 'rejected':
        return <span className="badge badge-danger"><XCircle className="w-3.5 h-3.5 mr-1.5" /> Ditolak</span>
      default:
        return <span className="badge bg-gray-100 text-gray-700">{status}</span>
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid': return 'Lunas'
      case 'partially_paid': return 'Belum Lunas'
      case 'unpaid': return 'Belum Bayar'
      case 'pending_verification': return 'Menunggu Verifikasi'
      case 'rejected': return 'Ditolak'
      default: return status
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight flex items-center">
            <FileText className="mr-2 sm:mr-3 text-primary w-6 h-6 sm:w-8 sm:h-8" />
            Tagihan Saya
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">Daftar iuran yang menjadi tanggungan Anda.</p>
        </div>
      </div>

      <div className="card-container p-0 overflow-hidden">
        <div className="overflow-x-auto w-full scrollbar-thin scrollbar-thumb-gray-200">
          <table className="min-w-[650px] w-full text-left text-sm">
            <thead className="bg-[#F8FAFC] border-b border-border text-gray-600">
              <tr>
                <th className="px-3 sm:px-6 py-3 font-semibold whitespace-nowrap text-left">Keterangan</th>
                <th className="px-3 sm:px-6 py-3 font-semibold whitespace-nowrap text-left">Jatuh Tempo</th>
                <th className="px-3 sm:px-6 py-3 font-semibold whitespace-nowrap text-left">Nominal</th>
                <th className="px-3 sm:px-6 py-3 font-semibold whitespace-nowrap text-left">Status</th>
                <th className="px-3 sm:px-6 py-3 font-semibold whitespace-nowrap text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-gray-700 bg-white">
              {loading ? (
                <TableLoader colSpan={5} text="Memuat data tagihan..." />
              ) : bills.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-text-muted flex flex-col items-center">
                    <FileText className="w-8 h-8 text-gray-300 mb-2" />
                    Tidak ada tagihan aktif.
                  </td>
                </tr>
              ) : (
                bills.map((bill) => (
                  <tr key={bill.id} className="hover:bg-[#ECFDF5] transition-colors">
                    <td className="px-3 sm:px-6 py-4">
                      <div className="font-medium text-gray-900">{getBillTitle(bill)}</div>
                      <div className="text-xs text-text-secondary mt-0.5">{getBillSubtitle(bill)}</div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 text-text-secondary">{formatDateStr(bill.due_date)}</td>
                    <td className="px-3 sm:px-6 py-4 font-semibold">{formatCurrency(getRemainingAmount(bill))}</td>
                    <td className="px-3 sm:px-6 py-4">{getStatusBadge(bill.status)}</td>
                    <td className="px-3 sm:px-6 py-4 text-center">
                      {bill.status === 'unpaid' || bill.status === 'rejected' ? (
                        <button onClick={() => handlePayNow(bill.id)} className="btn-primary py-1.5 px-3 sm:px-4 text-xs">
                          Bayar Sekarang
                        </button>
                      ) : bill.status === 'partially_paid' ? (
                        <button onClick={() => handlePayNow(bill.id)} className="btn-primary py-1.5 px-3 sm:px-4 text-xs" style={{ backgroundColor: '#ea580c', borderColor: '#ea580c' }}>
                          Lunasi Sekarang
                        </button>
                      ) : (
                        <button
                          onClick={() => setSelectedBill(bill)}
                          className="btn-secondary py-1.5 px-3 text-xs inline-flex items-center"
                        >
                          <FileText className="w-3.5 h-3.5 mr-1.5" /> Detail
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

      {/* Bill Detail Modal */}
      {selectedBill && createPortal(
        <div
          className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200"
          onMouseDown={() => setSelectedBill(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-emerald-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">Detail Tagihan</h2>
                  <p className="text-xs text-emerald-600 font-medium">Tagihan Lunas</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedBill(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Bill Title */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="text-lg font-bold text-gray-900">{getBillTitle(selectedBill)}</div>
                <div className="text-sm text-gray-500 mt-0.5">{getBillSubtitle(selectedBill)}</div>
              </div>

              {/* Details Grid */}
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2.5 border-b border-gray-100">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Hash className="w-4 h-4" />
                    <span>ID Tagihan</span>
                  </div>
                  <span className="text-xs font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded-md">
                    {String(selectedBill.id).slice(0, 8)}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2.5 border-b border-gray-100">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <CalendarDays className="w-4 h-4" />
                    <span>Jatuh Tempo</span>
                  </div>
                  <span className="text-sm font-medium text-gray-800">
                    {new Date(selectedBill.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2.5 border-b border-gray-100">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <CreditCard className="w-4 h-4" />
                    <span>Total Tagihan</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{formatCurrencyInline(Number(selectedBill.amount))}</span>
                </div>

                <div className="flex items-center justify-between py-2.5 border-b border-gray-100">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Jumlah Dibayar</span>
                  </div>
                  <span className="text-sm font-semibold text-emerald-600">{formatCurrencyInline(getBillPaidAmount(selectedBill))}</span>
                </div>

                <div className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span className="w-4 h-4 flex items-center justify-center">📋</span>
                    <span>Status</span>
                  </div>
                  <div>{getStatusBadge(selectedBill.status)}</div>
                </div>
              </div>

              {/* Status Summary */}
              {selectedBill.status === 'paid' && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-800">Tagihan Telah Dilunasi</p>
                    <p className="text-xs text-emerald-600 mt-0.5">Pembayaran sebesar {formatCurrencyInline(Number(selectedBill.amount))} telah terverifikasi.</p>
                  </div>
                </div>
              )}

              {selectedBill.status === 'pending_verification' && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
                  <Clock className="w-5 h-5 text-blue-600 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-blue-800">Menunggu Verifikasi Admin</p>
                    <p className="text-xs text-blue-600 mt-0.5">Bukti pembayaran Anda sedang ditinjau oleh admin/bendahara.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 pb-6">
              <button
                onClick={() => setSelectedBill(null)}
                className="w-full btn-secondary py-2.5 text-sm font-medium"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

