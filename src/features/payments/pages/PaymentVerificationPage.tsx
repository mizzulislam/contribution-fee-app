import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { spreadsheetApi } from '@/services/sheets-client'
import { Search, SearchCheck, CheckCircle2, XCircle, Eye, X, FileText } from 'lucide-react'
import { TableLoader } from '@/components/ui/TableLoader'
import { isDateInPeriod, checkPeriodLock, type PeriodFilter } from '@/features/accounting/calculations/period'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { mergeAccounts, type Account } from '@/features/accounting/data/chartOfAccounts'
import {
  findPaymentMethod,
  formatPaymentMethodLabel,
  getPaymentMethods,
  type PaymentMethod,
} from '@/features/payments/services/paymentMethods.service'

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
  bankTarget?: string
  bank_target?: string
  bankTargetLabel?: string
  bankTargetName?: string
  bankTargetAccountName?: string
  bankTargetAccountNumber?: string
}

interface VerificationProps {
  period?: PeriodFilter
}

const defaultPeriod: PeriodFilter = { preset: 'all' }

export default function Verification({ period = defaultPeriod }: VerificationProps) {
  const [verifications, setVerifications] = useState<PaymentVerification[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [cashAccounts, setCashAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [toastMessage, setToastMessage] = useState('')
  const [previewPayment, setPreviewPayment] = useState<PaymentVerification | null>(null)
  const [isActioning, setIsActioning] = useState(false)
  const [alertDialog, setAlertDialog] = useState<{
    isOpen: boolean
    title: string
    message: string
    isConfirm: boolean
    onConfirm: () => void
  }>({
    isOpen: false,
    title: '',
    message: '',
    isConfirm: false,
    onConfirm: () => {}
  })

  async function fetchVerifications() {
    setLoading(true)
    const [paymentRes, methodRows, masterRes] = await Promise.all([
      spreadsheetApi.get('Payments'),
      getPaymentMethods().catch(() => []),
      spreadsheetApi.get('MasterData'),
    ])
    const { data } = paymentRes

    if (data && Array.isArray(data)) {
      setVerifications((data as PaymentVerification[]).filter((p: PaymentVerification) => p.status === 'Menunggu Verifikasi' || p.status === 'pending_verification'))
    } else {
      setVerifications([])
    }
    setPaymentMethods(methodRows)
    setCashAccounts(
      mergeAccounts(Array.isArray(masterRes.data) ? masterRes.data : [])
        .filter(account => {
          const accountName = account.account_name.toLowerCase()
          return account.status === 'Aktif' && account.account_type === 'Harta' && (/\bkas\b|bank|gopay|cash/.test(accountName))
        })
    )
    setLoading(false)
  }

  useEffect(() => {
    fetchVerifications()

    const handleSync = (e: Event) => {
      const customEvent = e as CustomEvent
      const { sheetName } = customEvent.detail
      const relevantSheets = ['Payments', 'Bills', 'MasterData']
      if (relevantSheets.includes(sheetName)) {
        console.log(`♻️ Menyegarkan verifikasi karena sheet ${sheetName} diperbarui secara real-time.`)
        fetchVerifications()
      }
    }

    window.addEventListener('soematra-sync-event', handleSync)
    return () => window.removeEventListener('soematra-sync-event', handleSync)
  }, [])

  const formatCurrency = (amount: number) => {
    return (
      <div className="flex items-center gap-12 justify-center">
        <span className="text-gray-500">Rp</span>
        <span>{new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(amount)}</span>
      </div>
    )
  }

  // Returns a short calling name by skipping common Islamic prefixes
  const getDisplayName = (fullName?: string) => {
    if (!fullName) return '-'
    const prefixes = ['muhammad', 'muhamad', 'ahmad', 'ahmad', 'abdul', 'abdur', 'abdu', 'abu', 'nur', 'siti', 'andi', 'binti', 'bin', 'van']
    const parts = fullName.trim().split(/\s+/)
    if (parts.length <= 1) return parts[0] ?? '-'
    // Check if first word is a known prefix
    if (prefixes.includes(parts[0].toLowerCase())) {
      return parts[1] ?? parts[0]
    }
    return parts[0]
  }

  // Returns bank name only (no account number)
  const getBankName = (payment: PaymentVerification) => {
    const selectedMethod = findPaymentMethod(paymentMethods, String(payment.bankTarget || payment.bank_target || ''))
    if (selectedMethod?.bank_name) return selectedMethod.bank_name
    if (payment.bankTargetName) return payment.bankTargetName
    return String(payment.bankTarget || payment.bank_target || '-')
  }

  const filtered = verifications.filter(v => {
    const matchesSearch =
      v.resident_name?.toLowerCase().includes(search.toLowerCase()) ||
      v.title?.toLowerCase().includes(search.toLowerCase())
    const matchesPeriod = isDateInPeriod(v.date_submitted || v.updated_at || '', period)
    return matchesSearch && matchesPeriod
  })

  const getBankTargetLabel = (payment: PaymentVerification) => {
    if (payment.bankTargetLabel) return payment.bankTargetLabel

    const selectedMethod = findPaymentMethod(paymentMethods, String(payment.bankTarget || payment.bank_target || ''))
    if (selectedMethod) return formatPaymentMethodLabel(selectedMethod)

    if (payment.bankTargetName || payment.bankTargetAccountNumber) {
      return `${payment.bankTargetName || 'Bank'} - ${payment.bankTargetAccountNumber || '-'} a.n ${payment.bankTargetAccountName || 'Bendahara Kos'}`
    }

    return String(payment.bankTarget || payment.bank_target || '-')
  }

  const resolveCashAccount = (payment: PaymentVerification) => {
    const selectedMethod = findPaymentMethod(paymentMethods, String(payment.bankTarget || payment.bank_target || ''))
    const bankName = String(selectedMethod?.bank_name || payment.bankTargetName || payment.bankTarget || payment.bank_target || '').toLowerCase()
    const bankAccountNumber = String(selectedMethod?.account_number || payment.bankTargetAccountNumber || '').toLowerCase()

    const matchedByBank = cashAccounts.find(account => {
      const accountName = account.account_name.toLowerCase()
      return Boolean(bankName && (accountName.includes(bankName) || bankName.includes(accountName)))
    })
    if (matchedByBank) return matchedByBank.account_number

    const matchedByAccountNumber = cashAccounts.find(account => account.account_name.toLowerCase().includes(bankAccountNumber))
    if (matchedByAccountNumber) return matchedByAccountNumber.account_number

    return cashAccounts.find(account => account.account_name.toLowerCase().includes('bank'))?.account_number
      || cashAccounts[0]?.account_number
      || '1102'
  }

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

    // Check period lock before approving
    if (action === 'approve') {
      const isLocked = await checkPeriodLock(new Date().toISOString().split('T')[0])
      if (isLocked) {
        setAlertDialog({
          isOpen: true,
          title: 'Periode Terkunci',
          message: 'Gagal menyetujui pembayaran: Periode akuntansi bulan ini sudah ditutup (Locked).',
          isConfirm: false,
          onConfirm: () => setAlertDialog(prev => ({ ...prev, isOpen: false }))
        })
        return
      }
    }

    setIsActioning(true)
    const newStatus = action === 'approve' ? 'paid' : 'rejected'

    // Backup for rollback
    const backupVerifications = [...verifications]
    setVerifications(verifications.filter(v => v.id !== id)) // Optimistic update

    const payload = {
      ...item,
      status: newStatus,
      date_verified: action === 'approve' ? new Date().toISOString() : item.date_verified,
      updated_at: new Date().toISOString()
    }

    const targetBillId = item.billId || item.bill_id
    let billPayload: any = null
    let originalBill: any = null

    let step1Success = false
    let step2Success = false
    let step3Success = false
    const journalId = `PAY-${item.id}`

    try {
      let computedBillStatus = action === 'approve' ? 'paid' : 'rejected'

      let originalBillFetched = false

      if (targetBillId) {
        try {
          const [billsRes, paymentsRes] = await Promise.all([
            spreadsheetApi.get('Bills'),
            spreadsheetApi.get('Payments')
          ])
          const billsData = billsRes.data
          const paymentsData = paymentsRes.data
          originalBillFetched = true

          if (Array.isArray(billsData)) {
            originalBill = billsData.find(b => String(b.id) === String(targetBillId))
            if (originalBill) {
              const paymentAmount = Number(item.amount) || 0
              const billAmount = Number(originalBill.amount) || 0

              if (action === 'approve') {
                const paymentsList = Array.isArray(paymentsData) ? paymentsData : []
                const verifiedPayments = paymentsList.filter(
                  p => String(p.billId) === String(targetBillId) &&
                       String(p.id) !== String(item.id) &&
                       (p.status === 'verified' || p.status === 'paid' || p.status === 'Terverifikasi' || p.status === 'Lunas')
                )
                const alreadyPaid = verifiedPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
                const totalPaid = alreadyPaid + paymentAmount
                computedBillStatus = totalPaid >= billAmount ? 'paid' : 'partially_paid'
              } else {
                computedBillStatus = originalBill.status === 'partially_paid' ? 'partially_paid' : 'rejected'
              }

              billPayload = {
                ...originalBill,
                status: computedBillStatus,
                updated_at: new Date().toISOString()
              }
            } else {
              console.warn(`Tagihan dengan ID ${targetBillId} tidak ditemukan di sheet Bills. Pembayaran ini bertindak sebagai tagihan mandiri/dangling.`)
            }
          }
        } catch (e) {
          console.warn("Gagal fetch data Bill untuk backup:", e)
        }
      }

      if (!billPayload && targetBillId && !originalBillFetched) {
        billPayload = {
          id: targetBillId,
          status: computedBillStatus,
          updated_at: new Date().toISOString()
        }
      }

      // Step 1: Update Payment
      const res1 = await spreadsheetApi.put('Payments', payload)
      if (!res1.success) throw new Error((res1.error as any)?.message || 'Gagal memperbarui status pembayaran di Sheets.')
      step1Success = true

      // Step 2: Update Bill
      if (billPayload) {
        const res2 = await spreadsheetApi.put('Bills', billPayload)
        if (!res2.success) throw new Error((res2.error as any)?.message || 'Gagal memperbarui status tagihan di Sheets.')
        step2Success = true
      }

      // Step 3: Post Journal Entry if approved
      if (action === 'approve') {
        // Approved payment verification now updates payment and bill status only.
        // Cash journal entries should be created from the accounting module, not directly from the payments page.
      }

      setAlertDialog(prev => ({ ...prev, isOpen: false }))
      setToastMessage(`Pembayaran berhasil di-${action === 'approve' ? 'setujui' : 'tolak'}.`)
      setTimeout(() => setToastMessage(''), 3000)
    } catch (err: any) {
      console.error('Error during handleAction Transaction:', err)

      // Rollback UI
      setVerifications(backupVerifications)

      // Rollback Sheets in reverse order
      if (step2Success && originalBill) {
        await spreadsheetApi.put('Bills', originalBill)
      }
      if (step1Success) {
        await spreadsheetApi.put('Payments', {
          ...item,
          status: 'pending_verification',
          updated_at: new Date().toISOString()
        })
      }

      setAlertDialog({
        isOpen: true,
        title: 'Transaksi Gagal',
        message: `Transaksi gagal: ${err.message || err}. Seluruh perubahan telah dibatalkan (rolled back).`,
        isConfirm: false,
        onConfirm: () => setAlertDialog(prev => ({ ...prev, isOpen: false }))
      })
    } finally {
      setIsActioning(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight flex items-center">
            <SearchCheck className="mr-2 sm:mr-3 text-primary w-6 h-6 sm:w-8 sm:h-8" />
            Verifikasi Pembayaran
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">Periksa dan setujui bukti transfer dari penghuni.</p>
        </div>
      </div>

      <div className="card-container p-0 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-border flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50/50">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Cari penghuni..."
              className="form-input pl-10 bg-white h-[42px]"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto w-full scrollbar-thin scrollbar-thumb-gray-200">
          <table className="min-w-[700px] w-full table-fixed text-left text-sm text-gray-600">
            <thead className="bg-[#F3F4F6] text-gray-700 text-xs uppercase font-semibold border-b border-border">
              <tr>
                <th className="px-4 py-3 font-semibold whitespace-nowrap w-16 text-center">Penghuni</th>
                <th className="px-4 py-3 font-semibold whitespace-nowrap w-16 text-center">Tagihan</th>
                <th className="px-4 py-3 pr-2 hidden md:table-cell font-semibold whitespace-nowrap w-20 text-center">Tanggal Submit</th>
                <th className="px-2 py-3 hidden lg:table-cell font-semibold whitespace-nowrap w-20 text-center">Bank Tujuan</th>
                <th className="px-2 py-3 font-semibold whitespace-nowrap w-20 text-center">Nominal</th>
                <th className="px-2 py-3 font-semibold whitespace-nowrap w-20 text-center">Bukti Transfer</th>
                <th className="px-2 py-3 font-semibold whitespace-nowrap w-16 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <TableLoader colSpan={7} text="Memuat data pembayaran..." />
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">Tidak ada antrean verifikasi saat ini.</td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-primary-soft/30 transition-colors">
                    <td className="px-4 py-4 w-32 text-left">
                      <div className="font-medium text-gray-900">{getDisplayName(item.resident_name)}</div>
                      <div className="text-xs text-text-muted">Kamar {item.room_number}</div>
                    </td>
                    <td className="px-4 py-4 w-32 text-left">{item.title}</td>
                    <td className="px-4 py-4 pr-2 hidden md:table-cell w-24 text-sm text-left">
                      {item.date_submitted
                        ? new Date(item.date_submitted).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                        : '-'}
                    </td>
                    <td className="px-2 py-4 hidden max-w-[140px] text-sm text-gray-500 lg:table-cell w-32 text-left">{getBankName(item)}</td>
                    <td className="px-2 py-4 w-28 font-semibold text-gray-900 text-center">{formatCurrency(item.amount)}</td>
                    <td className="px-2 py-4 w-24 text-center">
                      {item.proofDataUrl || item.proofFileName || item.fileName ? (
                        <button
                          onClick={() => setPreviewPayment(item)}
                          className="flex items-center justify-center gap-1 text-primary hover:text-primary-dark transition-colors font-medium whitespace-nowrap text-sm mx-auto"
                        >
                          <Eye className="w-4 h-4 shrink-0" /> Lihat Bukti
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">Tidak ada</span>
                      )}
                    </td>
                    <td className="px-2 py-4 w-24 text-center">
                      <div className="flex items-center gap-1.5 justify-center">
                        <button
                          onClick={() => confirmAction(item.id, 'approve')}
                          className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 transition-colors border border-emerald-200"
                          title="Terima"
                        >
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        </button>
                        <button
                          onClick={() => confirmAction(item.id, 'reject')}
                          className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 transition-colors border border-red-200"
                          title="Tolak"
                        >
                          <XCircle className="w-5 h-5 text-red-500" />
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

      <ConfirmDialog
        isOpen={alertDialog.isOpen}
        title={alertDialog.title}
        message={alertDialog.message}
        variant={alertDialog.isConfirm ? (alertDialog.title.includes('Tolak') || alertDialog.title.includes('Penolakan') ? 'danger' : 'info') : (alertDialog.title.includes('Gagal') || alertDialog.title.includes('Terkunci') ? 'danger' : 'success')}
        showCancel={alertDialog.isConfirm}
        confirmLabel={alertDialog.isConfirm ? (alertDialog.title.includes('Tolak') || alertDialog.title.includes('Penolakan') ? 'Ya, Tolak' : 'Ya, Setujui') : 'Mengerti'}
        cancelLabel="Batal"
        isLoading={isActioning}
        onClose={() => !isActioning && setAlertDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={alertDialog.onConfirm}
      />
    </div>
  )
}