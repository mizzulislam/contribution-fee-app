import { useState, useEffect } from 'react'
import { spreadsheetApi } from '@/lib/spreadsheet'
import { useAuth } from '@/hooks/useAuth'
import { CheckCircle2, Clock, XCircle, FileText } from 'lucide-react'

export default function ResidentBillsList() {
  const { profile } = useAuth()
  const [bills, setBills] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile?.id) {
      fetchBills()
    }
  }, [profile?.id])

  const fetchBills = async () => {
    setLoading(true)
    const { data, error } = await spreadsheetApi.get('Bills')
    
    if (data && Array.isArray(data) && data.length > 0) {
      // Filter tagihan milik user yang sedang login
      setBills(data.filter((b: any) => b.resident_email === profile?.email))
    } else {
      // Mock data fallback
      setBills([
        { id: 1, contributions: { title: 'Iuran Wajib Bulanan', contribution_types: { name: 'Iuran Wajib' } }, due_date: '2026-06-10', amount: 500000, status: 'unpaid' },
        { id: 2, contributions: { title: 'Iuran Wajib Bulanan', contribution_types: { name: 'Iuran Wajib' } }, due_date: '2026-05-10', amount: 500000, status: 'paid' }
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
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Tagihan Saya</h1>
          <p className="text-text-secondary mt-1">Daftar iuran yang menjadi tanggungan Anda.</p>
        </div>
      </div>

      <div className="card-container p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#F3F4F6] border-b border-border text-gray-600">
              <tr>
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
                  <td colSpan={5} className="px-6 py-12 text-center text-text-muted">Memuat data tagihan...</td>
                </tr>
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
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{bill.contributions?.title}</div>
                      <div className="text-xs text-text-secondary mt-0.5">{bill.contributions?.contribution_types?.name}</div>
                    </td>
                    <td className="px-6 py-4 text-text-secondary">{new Date(bill.due_date).toLocaleDateString('id-ID')}</td>
                    <td className="px-6 py-4 font-semibold">{formatCurrency(bill.amount)}</td>
                    <td className="px-6 py-4">{getStatusBadge(bill.status)}</td>
                    <td className="px-6 py-4 text-right">
                      {bill.status === 'unpaid' || bill.status === 'rejected' ? (
                        <button className="btn-primary py-1.5 px-4 text-xs">
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
