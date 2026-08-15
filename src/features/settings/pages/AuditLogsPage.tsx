import { useState, useEffect, useMemo } from 'react'
import { Activity, Search, Filter } from 'lucide-react'
import { spreadsheetApi } from '@/services/sheets-client'
import { TableLoader } from '@/components/ui/TableLoader'
import { SortDropdown } from '@/components/ui/SortDropdown'

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
  const [sortBy, setSortBy] = useState<string>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  async function fetchLogs() {
    try {
      setLoading(true)
      const { data } = await spreadsheetApi.get('AuditLogs')
      if (data && Array.isArray(data)) {
        setLogs(data as AuditLog[])
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

  const filteredLogs = useMemo(() => {
    return logs.filter(l => 
      (l.action && l.action.toLowerCase().includes(search.toLowerCase())) || 
      (l.user && l.user.toLowerCase().includes(search.toLowerCase()))
    )
  }, [logs, search])

  const sortedLogs = useMemo(() => {
    return [...filteredLogs].sort((a, b) => {
      let valA: any = ''
      let valB: any = ''

      if (sortBy === 'created_at') {
        valA = new Date(a.created_at || '').getTime()
        valB = new Date(b.created_at || '').getTime()
      } else if (sortBy === 'user') {
        valA = (a.user || '').toLowerCase()
        valB = (b.user || '').toLowerCase()
      } else if (sortBy === 'action') {
        valA = (a.action || '').toLowerCase()
        valB = (b.action || '').toLowerCase()
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1
      return 0
    })
  }, [filteredLogs, sortBy, sortOrder])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight flex items-center">
            <Activity className="mr-2 sm:mr-3 text-primary w-6 h-6 sm:w-8 sm:h-8" />
            Audit Log Sistem
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">Pantau seluruh riwayat aktivitas dan perubahan data penting dalam sistem.</p>
        </div>
      </div>

      <div className="card-container">
        <div className="p-4 sm:p-6 border-b border-border flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50/50 rounded-t-[20px]">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Cari aksi atau pengguna..." 
              className="form-input pl-10 bg-white h-[42px]"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <SortDropdown
              options={[
                { label: 'Waktu Aktivitas', value: 'created_at' },
                { label: 'Pengguna', value: 'user' },
                { label: 'Jenis Aksi', value: 'action' }
              ]}
              sortBy={sortBy}
              onSortByChange={setSortBy}
              sortOrder={sortOrder}
              onSortOrderChange={setSortOrder}
            />
            <button className="btn-secondary flex items-center h-[42px]">
              <Filter className="w-4 h-4 mr-2" /> Filter Waktu
            </button>
          </div>
        </div>

        <div className="overflow-x-auto w-full rounded-b-[20px] border-t border-border scrollbar-thin scrollbar-thumb-gray-200">
          <table className="min-w-[650px] w-full text-left text-sm text-gray-600">
            <thead className="bg-[#F8FAFC] text-gray-700 text-xs uppercase font-semibold border-b border-border">
              <tr>
                <th className="px-6 py-4 text-left">Waktu</th>
                <th className="px-6 py-4 text-left">Pengguna</th>
                <th className="px-6 py-4 text-left">Aksi</th>
                <th className="px-6 py-4 text-left hidden md:table-cell">Rincian / Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <TableLoader colSpan={4} text="Memuat audit log..." />
              ) : sortedLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">Tidak ada log aktivitas ditemukan.</td>
                </tr>
              ) : (
                sortedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-text-muted whitespace-nowrap">{new Date(log.created_at).toLocaleString('id-ID')}</td>
                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{log.user}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{log.action}</td>
                    <td className="px-6 py-4 text-left text-xs font-mono text-gray-500 hidden md:table-cell break-all">{log.ip || '-'}</td>
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
