import { useState, useEffect } from 'react'
import { spreadsheetApi } from '@/services/sheets-client'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { History, Search, CheckCircle2, Download } from 'lucide-react'
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
}

export default function PaymentHistory() {
  const { profile } = useAuth()
  const [history, setHistory] = useState<PaymentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

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

  const filtered = history.filter(h => 
    h.title?.toLowerCase().includes(search.toLowerCase()) || 
    h.month?.toLowerCase().includes(search.toLowerCase())
  )

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
              className="form-input pl-10 bg-white"
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
                      <button className="btn-secondary py-1.5 px-3 text-xs inline-flex items-center">
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
    </div>
  )
}
