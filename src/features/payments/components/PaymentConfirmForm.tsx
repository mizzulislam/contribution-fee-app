import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { UploadCloud, FileText, CheckCircle2, Loader2 } from 'lucide-react'
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
    const { data } = await spreadsheetApi.get('Bills')

    if (Array.isArray(data)) {
      const residentBills = (data as Bill[]).filter((bill: Bill) => {
        const belongsToUser = bill.resident_email === profile?.email || bill.resident_name === profile?.full_name
        const canBePaid = bill.status === 'unpaid' || bill.status === 'rejected'
        return belongsToUser && canBePaid
      })

      setBills(residentBills)
      const selectedBillId = searchParams.get('billId') || ''
      const selectedBill = residentBills.find((bill: Bill) => String(bill.id) === String(selectedBillId))
      if (selectedBill) {
        setBillId(String(selectedBill.id))
        setAmount(String(selectedBill.amount || ''))
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
        setAmount(String(selectedBill.amount || ''))
      }
    }
  }, [searchParams, bills])

  const handleBillChange = (selectedBillId: string) => {
    setBillId(selectedBillId)
    const selectedBill = bills.find(bill => String(bill.id) === String(selectedBillId))
    if (selectedBill) setAmount(String(selectedBill.amount || ''))
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
        resident_name: profile?.full_name || selectedBill.resident_name || '',
        resident_email: profile?.email || selectedBill.resident_email || '',
        room_number: profile?.room_number || selectedBill.room_number || '',
        created_at: new Date().toISOString()
      }

      const [paymentRes, billRes] = await Promise.all([
        spreadsheetApi.post('Payments', payload),
        spreadsheetApi.put('Bills', {
          ...selectedBill,
          id: selectedBill.id,
          status: 'pending_verification',
          updated_at: new Date().toISOString(),
        }),
      ])
      if (!paymentRes.success || !billRes.success) {
        throw new Error('Gagal menyimpan konfirmasi pembayaran ke sumber data.')
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
    return (
      <div className="space-y-6 mt-10">
        <div className="card-container p-10 text-center flex flex-col items-center">
          <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="w-10 h-10 text-success" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Konfirmasi Berhasil Dikirim!</h2>
          <p className="text-text-secondary mb-8">
            Bukti pembayaran Anda telah kami terima dan sedang menunggu verifikasi dari Bendahara. 
            Proses verifikasi biasanya memakan waktu 1x24 jam.
          </p>
          <button 
            onClick={() => setIsSuccess(false)}
            className="btn-primary"
          >
            Kirim Konfirmasi Lainnya
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center">
          <UploadCloud className="mr-3 text-primary w-8 h-8" />
          Konfirmasi Pembayaran
        </h1>
        <p className="text-text-secondary mt-1">Unggah bukti transfer untuk ditinjau oleh Bendahara.</p>
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
                options={bills.map(bill => ({
                  label: `${getBillTitle(bill)}${bill.month ? ` - ${bill.month}` : ''} (${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(bill.amount) || 0)})`,
                  value: String(bill.id),
                }))}
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
