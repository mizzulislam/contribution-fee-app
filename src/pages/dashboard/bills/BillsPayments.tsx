import { useState, useEffect } from 'react'
import { spreadsheetApi } from '@/lib/spreadsheet'
import { Search, WalletCards, CheckCircle2, Clock, AlertCircle } from 'lucide-react'

export default function BillsPayments() {
  const [bills, setBills] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

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
        { id: 1, resident_name: 'Budi Santoso', room_number: '101', title: 'Iuran Kos Juni', amount: 500000, due_date: '2026-06-10', status: 'unpaid' },
        { id: 2, resident_name: 'Siti Aminah', room_number: '102', title: 'Iuran Kos Juni', amount: 500000, due_date: '2026-06-10', status: 'paid' },
        { id: 3, resident_name: 'Ahmad Dahlan', room_number: '103', title: 'Iuran Sampah', amount: 25000, due_date: '2026-06-15', status: 'pending_verification' }
      ])
    }
    setLoading(false)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)
  }

  const filtered = bills.filter(b => 
    b.resident_name?.toLowerCase().includes(search.toLowerCase()) || 
    b.title?.toLowerCase().includes(search.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'paid':
        return <span className="badge badge-success flex items-center"><CheckCircle2 className="w-3 h-3 mr-1" /> Lunas</span>
      case 'pending_verification':
        return <span className="badge badge-warning flex items-center"><Clock className="w-3 h-3 mr-1" /> Verifikasi</span>
      default:
        return <span className="badge badge-danger flex items-center"><AlertCircle className="w-3 h-3 mr-1" /> Belum Lunas</span>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center">
            <WalletCards className="mr-3 text-primary w-8 h-8" />
            Tagihan & Pembayaran
          </h1>
          <p className="text-text-secondary mt-1">Pantau seluruh status tagihan penghuni kos.</p>
        </div>
      </div>

      <div className="card-container">
        <div className="p-4 sm:p-6 border-b border-border flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50/50 rounded-t-[20px]">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Cari nama penghuni atau tagihan..." 
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
                <th className="px-6 py-4">Kamar</th>
                <th className="px-6 py-4">Tagihan</th>
                <th className="px-6 py-4">Jatuh Tempo</th>
                <th className="px-6 py-4">Nominal</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">Memuat data...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">Tidak ada tagihan ditemukan.</td>
                </tr>
              ) : (
                filtered.map((bill) => (
                  <tr key={bill.id} className="hover:bg-primary-soft/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{bill.resident_name}</td>
                    <td className="px-6 py-4">{bill.room_number}</td>
                    <td className="px-6 py-4">{bill.title}</td>
                    <td className="px-6 py-4">{bill.due_date}</td>
                    <td className="px-6 py-4 font-semibold text-gray-900">{formatCurrency(bill.amount)}</td>
                    <td className="px-6 py-4">
                      {getStatusBadge(bill.status)}
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
