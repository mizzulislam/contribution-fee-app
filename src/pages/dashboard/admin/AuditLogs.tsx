import { useState, useEffect } from 'react'
import { Activity, Search, Filter } from 'lucide-react'
import { spreadsheetApi } from '@/lib/spreadsheet'
import { TableLoader } from '@/components/ui/TableLoader'

interface AuditLog {
  id: number | string
  created_at: string
  user?: string
  action?: string
  ip?: string
}

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  async function fetchLogs() {
    try {
      setLoading(true)
      const { data } = await spreadsheetApi.get('AuditLogs')
      if (data && Array.isArray(data)) {
        // Sort descending by date
        setLogs((data as AuditLog[]).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()))
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  const filteredLogs = logs.filter(l => 
    (l.action && l.action.toLowerCase().includes(search.toLowerCase())) || 
    (l.user && l.user.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center">
            <Activity className="mr-3 text-primary w-8 h-8" />
            Audit Log Sistem
          </h1>
          <p className="text-text-secondary mt-1">Pantau seluruh riwayat aktivitas dan perubahan data penting dalam sistem.</p>
        </div>
      </div>

      <div className="card-container">
        <div className="p-4 sm:p-6 border-b border-border flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50/50 rounded-t-[20px]">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Cari aksi atau pengguna..." 
              className="form-input pl-10 bg-white"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="btn-secondary flex items-center">
            <Filter className="w-4 h-4 mr-2" /> Filter Waktu
          </button>
        </div>

        <div className="overflow-x-auto w-full rounded-b-[20px] border-t border-border scrollbar-thin scrollbar-thumb-gray-200">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-[#F3F4F6] text-gray-700 text-xs uppercase font-semibold border-b border-border">
              <tr>
                <th className="px-6 py-4">Waktu</th>
                <th className="px-6 py-4">Pengguna</th>
                <th className="px-6 py-4">Aksi</th>
                <th className="px-6 py-4 text-right hidden md:table-cell">Alamat IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <TableLoader colSpan={4} text="Memuat audit log..." />
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">Tidak ada log aktivitas ditemukan.</td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-text-muted">{new Date(log.created_at).toLocaleString('id-ID')}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{log.user}</td>
                    <td className="px-6 py-4">{log.action}</td>
                    <td className="px-6 py-4 text-center text-xs font-mono text-gray-500 hidden md:table-cell">{log.ip || '-'}</td>
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
