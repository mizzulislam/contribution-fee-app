import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { spreadsheetApi } from '@/services/sheets-client'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { CheckCircle2, Clock, XCircle, FileText } from 'lucide-react'
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

export default function ResidentBillsList() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [bills, setBills] = useState<ResidentBill[]>([])
  const [loading, setLoading] = useState(true)

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
          userBills = userBills.map(bill => {
            const hasPending = paymentsData.some(p => String(p.billId) === String(bill.id) && (p.status === 'pending_verification' || p.status === 'Menunggu Verifikasi'))
            if (hasPending && (bill.status === 'unpaid' || bill.status === 'rejected')) {
              return { ...bill, status: 'pending_verification' }
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

  const formatCurrency = (amount: number) => {
    return (
      <div className="flex justify-between items-center w-full min-w-[80px]">
        <span className="text-gray-500 mr-2">Rp</span>
        <span>{new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(amount)}</span>
      </div>
    )
  }

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
            <thead className="bg-[#F3F4F6] border-b border-border text-gray-600">
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
                    <td className="px-3 sm:px-6 py-4 text-text-secondary">{new Date(bill.due_date).toLocaleDateString('id-ID')}</td>
                    <td className="px-3 sm:px-6 py-4 font-semibold">{formatCurrency(bill.amount)}</td>
                    <td className="px-3 sm:px-6 py-4">{getStatusBadge(bill.status)}</td>
                    <td className="px-3 sm:px-6 py-4 text-center">
                      {bill.status === 'unpaid' || bill.status === 'rejected' ? (
                        <button onClick={() => handlePayNow(bill.id)} className="btn-primary py-1.5 px-3 sm:px-4 text-xs">
                          Bayar Sekarang
                        </button>
                      ) : (
                        <button className="btn-secondary py-1.5 px-3 text-xs inline-flex items-center">
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
    </div>
  )
}
