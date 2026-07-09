import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { UploadCloud, FileText, CheckCircle2, Loader2, Tag, Coins, CalendarCheck, Clock, Send } from 'lucide-react'
import Select from '@/components/ui/Select'
import { spreadsheetApi } from '@/services/sheets-client'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { generateSecureId } from '@/utils/id'
import {
  findPaymentMethod,
  formatPaymentMethodLabel,
  getPaymentMethods,
  isPaymentMethodActive,
  type PaymentMethod,
} from '@/features/payments/services/paymentMethods.service'

interface Bill {
  id: string | number
  title?: string
  description?: string
  category?: string
  month?: string
  amount: number
  status: string
  due_date?: string
  resident_email?: string
  resident_name?: string
  room_number?: string
  contributions?: {
    title?: string
    contribution_types?: {
      name?: string
    }
  }
  remainingAmount?: number
}

export default function PaymentConfirm() {
  const { profile } = useAuth()
  const [searchParams] = useSearchParams()
  const [billId, setBillId] = useState(searchParams.get('billId') || '')
  const [bankTarget, setBankTarget] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState('')
  const [note, setNote] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [bills, setBills] = useState<Bill[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [isLoadingBills, setIsLoadingBills] = useState(true)
  const [isLoadingPaymentMethods, setIsLoadingPaymentMethods] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [submitError, setSubmitError] = useState('')

  function getBillTitle(bill: Bill) {
    return bill.contributions?.title || bill.title || bill.description || 'Tagihan Kos'
  }

  const fetchBills = useCallback(async () => {
    setIsLoadingBills(true)
    const [billsRes, paymentsRes] = await Promise.all([
      spreadsheetApi.get('Bills'),
      spreadsheetApi.get('Payments')
    ])
    const data = billsRes.data
    const paymentsData = paymentsRes.data

    if (Array.isArray(data)) {
      const paymentsList = Array.isArray(paymentsData) ? paymentsData : []
      const residentBills = (data as Bill[]).filter((bill: Bill) => {
        const belongsToUser = bill.resident_email === profile?.email || bill.resident_name === profile?.full_name
        const canBePaid = bill.status === 'unpaid' || bill.status === 'rejected' || bill.status === 'partially_paid'
        return belongsToUser && canBePaid
      }).map((bill: Bill) => {
        let remainingAmount = Number(bill.amount) || 0
        if (bill.status === 'partially_paid') {
          const verified = paymentsList.filter(
            p => String(p.billId) === String(bill.id) && (p.status === 'verified' || p.status === 'paid' || p.status === 'Terverifikasi' || p.status === 'Lunas')
          )
          const paidAmount = verified.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
          remainingAmount = Math.max(0, remainingAmount - paidAmount)
        }
        return {
          ...bill,
          remainingAmount
        }
      })

      setBills(residentBills)
      const selectedBillId = searchParams.get('billId') || ''
      const selectedBill = residentBills.find((bill: Bill) => String(bill.id) === String(selectedBillId))
      if (selectedBill) {
        setBillId(String(selectedBill.id))
        setAmount(String(selectedBill.remainingAmount !== undefined ? selectedBill.remainingAmount : selectedBill.amount))
      }
    } else {
      setBills([])
    }

    setIsLoadingBills(false)
  }, [profile?.email, profile?.full_name, searchParams])

  const fetchPaymentMethods = useCallback(async () => {
    setIsLoadingPaymentMethods(true)
    try {
      const methods = await getPaymentMethods()
      const activeMethods = methods.filter(isPaymentMethodActive)
      setPaymentMethods(activeMethods)
      setBankTarget(current => current || (activeMethods.length === 1 ? activeMethods[0].id : ''))
    } catch (err) {
      console.error('Gagal memuat metode pembayaran:', err)
      setPaymentMethods([])
    } finally {
      setIsLoadingPaymentMethods(false)
    }
  }, [])

  useEffect(() => {
    if (profile?.id) {
      fetchBills()
      fetchPaymentMethods()
    }
  }, [fetchBills, fetchPaymentMethods, profile?.id])

  // Synchronize state when the URL parameter 'billId' changes
  useEffect(() => {
    const urlBillId = searchParams.get('billId')
    if (urlBillId && bills.length > 0) {
      const selectedBill = bills.find((bill: Bill) => String(bill.id) === String(urlBillId))
      if (selectedBill) {
        setBillId(String(selectedBill.id))
        setAmount(String(selectedBill.remainingAmount !== undefined ? selectedBill.remainingAmount : selectedBill.amount))
      }
    }
  }, [searchParams, bills])

  const handleBillChange = (selectedBillId: string) => {
    setBillId(selectedBillId)
    const selectedBill = bills.find(bill => String(bill.id) === String(selectedBillId))
    if (selectedBill) {
      setAmount(String(selectedBill.remainingAmount !== undefined ? selectedBill.remainingAmount : selectedBill.amount))
    }
  }

  const handleFileChange = (selectedFile?: File) => {
    if (!selectedFile) {
      setFile(null)
      return
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setSubmitError('Ukuran bukti transfer maksimal 5MB.')
      setFile(null)
      return
    }

    setSubmitError('')
    setFile(selectedFile)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const selectedBill = bills.find(bill => String(bill.id) === String(billId))
    if (!selectedBill) return
    const selectedPaymentMethod = findPaymentMethod(paymentMethods, bankTarget)
    if (!selectedPaymentMethod) {
      setSubmitError('Pilih bank tujuan yang tersedia dari data metode pembayaran admin.')
      return
    }

    setIsSubmitting(true)
    setSubmitError('')

    try {
      const proofDataUrl = file ? await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result || ''))
        reader.onerror = () => reject(new Error('Gagal membaca file bukti transfer.'))
        reader.readAsDataURL(file)
      }) : ''

      const payload = {
        id: generateSecureId('PAY'),
        billId,
        bankTarget: selectedPaymentMethod.id,
        bank_target: selectedPaymentMethod.id,
        bankTargetLabel: formatPaymentMethodLabel(selectedPaymentMethod),
        bankTargetName: selectedPaymentMethod.bank_name,
        bankTargetAccountName: selectedPaymentMethod.account_name,
        bankTargetAccountNumber: selectedPaymentMethod.account_number,
        amount: Number(amount),
        date,
        date_submitted: date,
        note,
        fileName: file?.name || '',
        proofFileName: file?.name || '',
        proofMimeType: file?.type || '',
        proofDataUrl,
        status: 'pending_verification',
        title: getBillTitle(selectedBill),
        month: selectedBill.month || '',
        resident_name: profile?.full_name || selectedBill.resident_name || '',
        resident_email: profile?.email || selectedBill.resident_email || '',
        room_number: profile?.room_number || selectedBill.room_number || '',
        created_at: new Date().toISOString()
      }

      const paymentRes = await spreadsheetApi.post('Payments', payload)
      if (!paymentRes.success) {
        throw new Error((paymentRes.error as any)?.message || 'Gagal menyimpan konfirmasi pembayaran ke sumber data.')
      }
      setIsSuccess(true)
    } catch (err) {
      console.error(err)
      setSubmitError(err instanceof Error ? err.message : 'Gagal mengirim konfirmasi pembayaran.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    const selectedBill = bills.find(b => String(b.id) === String(billId))
    const selectedMethod = paymentMethods.find(m => m.id === bankTarget)

    return (
      <div className="space-y-6 mt-6">
        <div className="card-container relative overflow-hidden">

          {/* Top gradient banner */}
          <div className="absolute top-0 left-0 right-0 h-56 bg-gradient-to-br from-emerald-500/10 via-teal-400/5 to-transparent pointer-events-none" />

          {/* Hero zone */}
          <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6 p-8 pb-6 border-b border-gray-100">
            {/* Glow icon */}
            <div className="relative shrink-0">
              <div className="absolute inset-0 rounded-full bg-emerald-400/25 blur-xl scale-150 animate-pulse" />
              <div className="relative h-20 w-20 flex items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 text-white shadow-xl shadow-emerald-500/30 border-4 border-white">
                <CheckCircle2 className="w-10 h-10" />
              </div>
            </div>
            {/* Title + desc */}
            <div className="text-center sm:text-left">
              <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-[10px] font-semibold px-2.5 py-1 rounded-full border border-emerald-200 mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                Berhasil Dikirim
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Konfirmasi Pembayaran Diterima!</h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                Bukti transfer Anda sedang menunggu verifikasi oleh <span className="font-semibold text-gray-700">Bendahara</span>.
                Biasanya selesai dalam <span className="font-semibold text-gray-700">1×24 jam</span>.
              </p>
            </div>
          </div>

          {/* Receipt detail grid */}
          <div className="relative z-10 p-8 pt-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Ringkasan Konfirmasi</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">

              {/* Tagihan */}
              {selectedBill && (
                <div className="flex items-start gap-3 bg-gray-50 border border-gray-100 rounded-xl p-4 hover:bg-emerald-50/40 hover:border-emerald-100 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                    <Tag className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Tagihan</p>
                    <p className="text-sm font-semibold text-gray-800 leading-tight mt-0.5 truncate">{getBillTitle(selectedBill)}</p>
                  </div>
                </div>
              )}

              {/* Nominal */}
              <div className="flex items-start gap-3 bg-gray-50 border border-gray-100 rounded-xl p-4 hover:bg-amber-50/40 hover:border-amber-100 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                  <Coins className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Nominal Transfer</p>
                  <p className="text-base font-bold text-emerald-600 mt-0.5">
                    Rp {new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(Number(amount) || 0)}
                  </p>
                </div>
              </div>

              {/* Tanggal */}
              <div className="flex items-start gap-3 bg-gray-50 border border-gray-100 rounded-xl p-4 hover:bg-sky-50/40 hover:border-sky-100 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center shrink-0">
                  <CalendarCheck className="w-4 h-4 text-sky-600" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Tanggal Transfer</p>
                  <p className="text-sm font-semibold text-gray-800 mt-0.5">
                    {date ? new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                  </p>
                </div>
              </div>

              {/* Bank Tujuan */}
              {selectedMethod && (
                <div className="flex items-start gap-3 bg-gray-50 border border-gray-100 rounded-xl p-4 hover:bg-indigo-50/40 hover:border-indigo-100 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                    <Send className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Bank Tujuan</p>
                    <p className="text-sm font-semibold text-gray-800 mt-0.5">{selectedMethod.bank_name}</p>
                    {selectedMethod.account_name && (
                      <p className="text-[10px] text-gray-400 truncate">{selectedMethod.account_name}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Status */}
              <div className="flex items-start gap-3 bg-amber-50/60 border border-amber-100 rounded-xl p-4">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Status</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse inline-block" />
                    <span className="text-sm font-semibold text-amber-700">Menunggu Verifikasi</span>
                  </div>
                </div>
              </div>

            </div>

            <button
              onClick={() => setIsSuccess(false)}
              className="btn-primary w-full py-3 font-semibold text-sm shadow-md shadow-emerald-500/20"
            >
              Kirim Konfirmasi Lainnya
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight flex items-center">
          <UploadCloud className="mr-2 sm:mr-3 text-primary w-6 h-6 sm:w-8 sm:h-8" />
          Konfirmasi Pembayaran
        </h1>
        <p className="text-xs sm:text-sm text-text-secondary mt-1">Unggah bukti transfer untuk ditinjau oleh Bendahara.</p>
      </div>

      <div className="card-container p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {submitError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {submitError}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Tagihan</label>
              <Select 
                className="w-full text-sm"
                placeholder="-- Pilih Tagihan yang Dibayar --"
                value={billId}
                onChange={handleBillChange}
                options={bills.map(bill => {
                  const displayAmount = bill.remainingAmount !== undefined ? bill.remainingAmount : bill.amount
                  const isPartial = bill.status === 'partially_paid'
                  const suffix = isPartial ? ' (Sisa)' : ''
                  return {
                    label: `${getBillTitle(bill)}${bill.month ? ` - ${bill.month}` : ''} (${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(displayAmount) || 0)}${suffix})`,
                    value: String(bill.id),
                  }
                })}
              />
              {!isLoadingBills && bills.length === 0 && (
                <p className="mt-2 text-xs text-text-muted">Tidak ada tagihan yang bisa dikonfirmasi saat ini.</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nominal Transfer (Rp)</label>
              <input 
                type="number" 
                required
                className="form-input" 
                placeholder="Contoh: 500000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal Transfer</label>
              <input 
                type="date" 
                required
                className="form-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bank Tujuan</label>
              <Select 
                className="w-full text-sm"
                placeholder="-- Pilih Bank Tujuan --"
                value={bankTarget}
                onChange={setBankTarget}
                options={paymentMethods.map(method => ({
                  label: formatPaymentMethodLabel(method),
                  value: method.id,
                }))}
              />
              {isLoadingPaymentMethods && (
                <p className="mt-2 text-xs text-text-muted">Memuat rekening tujuan dari data admin...</p>
              )}
              {!isLoadingPaymentMethods && paymentMethods.length === 0 && (
                <p className="mt-2 text-xs text-red-600">Belum ada rekening tujuan aktif dari admin.</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Unggah Bukti Transfer</label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-xl hover:border-primary transition-colors bg-gray-50/50">
              <div className="space-y-2 text-center">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600 justify-center">
                  <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary-dark focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary px-2 py-1">
                    <span>Pilih file</span>
                    <input 
                      id="file-upload" 
                      name="file-upload" 
                      type="file" 
                      className="sr-only"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileChange(e.target.files?.[0])}
                      required
                    />
                  </label>
                  <p className="pl-1 py-1">atau drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">PNG, JPG, PDF maksimal 5MB</p>
                {file && (
                  <div className="text-sm font-medium text-success mt-2">
                    File terpilih: {file.name}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Catatan Tambahan (Opsional)</label>
            <textarea 
              rows={3} 
              className="form-input resize-none" 
              placeholder="Tulis pesan untuk bendahara jika diperlukan..."
              value={note}
              onChange={e => setNote(e.target.value)}
            ></textarea>
          </div>

          <div className="pt-4 flex justify-end">
            <button 
              type="submit" 
              className="btn-primary w-full sm:w-auto min-w-[200px] flex items-center justify-center"
              disabled={isSubmitting || isLoadingBills || isLoadingPaymentMethods || paymentMethods.length === 0}
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
              {isSubmitting ? 'Mengirim...' : 'Kirim Konfirmasi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
