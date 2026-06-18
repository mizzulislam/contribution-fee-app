import { useState, useEffect } from 'react'
import { spreadsheetApi } from '@/services/sheets-client'
import { Search, Shield, Plus, CheckCircle2, Clock } from 'lucide-react'
import { TableLoader } from '@/components/ui/TableLoader'

export default function Bailouts() {
  const [bailouts, setBailouts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchBailouts()
  }, [])

  const fetchBailouts = async () => {
    setLoading(true)
    const { data, error } = await spreadsheetApi.get('Bailouts')
    
    if (data && Array.isArray(data)) {
      setBailouts(data)
    } else {
      setBailouts([])
    }
    setLoading(false)
  }

  const formatCurrency = (amount: number) => {
    return (
      <div className="flex justify-between items-center w-full min-w-[80px]">
        <span className="text-gray-500 mr-2">Rp</span>
        <span>{new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(amount)}</span>
      </div>
    )
  }

  const filtered = bailouts.filter(b => 
    b.purpose?.toLowerCase().includes(search.toLowerCase()) || 
    b.admin_name?.toLowerCase().includes(search.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'paid':
        return <span className="badge badge-success flex items-center"><CheckCircle2 className="w-3 h-3 mr-1" /> Sudah Diganti</span>
      default:
        return <span className="badge badge-warning flex items-center"><Clock className="w-3 h-3 mr-1" /> Menunggu Penggantian</span>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight flex items-center">
            <Shield className="mr-2 sm:mr-3 text-primary w-6 h-6 sm:w-8 sm:h-8" />
            Dana Talangan
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">Catat penggunaan uang pribadi pengurus untuk keperluan kos.</p>
        </div>
        <button className="btn-primary flex items-center whitespace-nowrap">
          <Plus className="w-5 h-5 mr-2" />
          Catat Talangan Baru
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#ECFDF5] border border-[#D1FAE5] rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[#047857]">Total Belum Diganti</p>
            <p className="text-2xl font-bold text-[#10B981] mt-1">Rp 50.000</p>
          </div>
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
            <Clock className="w-6 h-6 text-[#10B981]" />
          </div>
        </div>
        <div className="bg-white border border-border rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Total Sudah Diganti</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">Rp 150.000</p>
          </div>
          <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-gray-400" />
          </div>
        </div>
      </div>

      <div className="card-container">
        <div className="p-4 sm:p-6 border-b border-border flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50/50 rounded-t-[20px]">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Cari keperluan..." 
              className="form-input pl-10 bg-white"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="min-w-[700px] w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50/80 text-gray-700 text-xs uppercase font-semibold border-b border-border">
              <tr>
                <th className="px-6 py-4">Tanggal</th>
                <th className="px-6 py-4">Pengurus</th>
                <th className="px-6 py-4">Keperluan</th>
                <th className="px-6 py-4">Nominal</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <TableLoader colSpan={6} text="Memuat data dana talangan..." />
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">Tidak ada dana talangan ditemukan.</td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-primary-soft/30 transition-colors">
                    <td className="px-6 py-4">{item.date}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{item.admin_name}</td>
                    <td className="px-6 py-4">{item.purpose}</td>
                    <td className="px-6 py-4 font-semibold text-gray-900">{formatCurrency(item.amount)}</td>
                    <td className="px-6 py-4">
                      {getStatusBadge(item.status)}
                    </td>
                    <td className="px-6 py-4">
                      {item.status === 'unpaid' && (
                        <button className="text-primary hover:text-primary-dark font-medium transition-colors">
                          Tandai Selesai
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
