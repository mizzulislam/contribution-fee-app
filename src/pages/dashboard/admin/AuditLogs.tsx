import { useState } from 'react'
import { Activity, Search, Filter } from 'lucide-react'

export default function AuditLogs() {
  const [logs] = useState([
    { id: 1, action: 'User Login', user: 'Super Admin Utama', ip: '192.168.1.5', date: '2026-06-03 08:00:00' },
    { id: 2, action: 'Update Tagihan #102', user: 'Budi Santoso', ip: '192.168.1.12', date: '2026-06-03 09:15:22' },
    { id: 3, action: 'Verifikasi Pembayaran', user: 'Budi Santoso', ip: '192.168.1.12', date: '2026-06-03 09:16:05' },
    { id: 4, action: 'Tambah User Baru', user: 'Super Admin Utama', ip: '192.168.1.5', date: '2026-06-02 14:30:00' },
  ])
  const [search, setSearch] = useState('')

  const filteredLogs = logs.filter(l => 
    l.action.toLowerCase().includes(search.toLowerCase()) || 
    l.user.toLowerCase().includes(search.toLowerCase())
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

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-[#F3F4F6] text-gray-700 text-xs uppercase font-semibold border-b border-border">
              <tr>
                <th className="px-6 py-4">Waktu</th>
                <th className="px-6 py-4">Pengguna</th>
                <th className="px-6 py-4">Aksi</th>
                <th className="px-6 py-4 text-right">Alamat IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">Tidak ada log aktivitas ditemukan.</td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-text-muted">{log.date}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{log.user}</td>
                    <td className="px-6 py-4">{log.action}</td>
                    <td className="px-6 py-4 text-right text-xs font-mono text-gray-500">{log.ip}</td>
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
