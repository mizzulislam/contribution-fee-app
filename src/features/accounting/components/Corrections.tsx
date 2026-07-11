import { useState } from 'react'
import { FileWarning, CheckCircle2, XCircle } from 'lucide-react'

export default function Corrections() {
  const [corrections] = useState([
    { id: 1, user: 'Siti Aminah', type: 'Salah Nominal Transfer', reason: 'Transfer Rp 1.500.000 tapi tagihan Rp 1.550.000', status: 'Pending', date: '2026-06-03' },
    { id: 2, user: 'Ahmad Dahlan', type: 'Salah Bulan Tagihan', reason: 'Bayar untuk bulan Juli tapi kepencet Juni', status: 'Approved', date: '2026-06-01' },
  ])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight flex items-center">
            <FileWarning className="mr-2 sm:mr-3 text-primary w-6 h-6 sm:w-8 sm:h-8" />
            Pengajuan Koreksi Data
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">Kelola permohonan perbaikan data salah input dari penghuni.</p>
        </div>
      </div>

      <div className="card-container">
        <div className="overflow-x-auto w-full">
          <table className="min-w-[700px] w-full text-left text-sm text-gray-600">
            <thead className="bg-[#F8FAFC] text-gray-700 text-xs uppercase font-semibold border-b border-border">
              <tr>
                <th className="px-6 py-4">Tanggal</th>
                <th className="px-6 py-4">Penghuni</th>
                <th className="px-6 py-4">Jenis Koreksi</th>
                <th className="px-6 py-4">Alasan</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {corrections.map((corr) => (
                <tr key={corr.id} className="hover:bg-primary-soft/30 transition-colors">
                  <td className="px-6 py-4 text-xs">{corr.date}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">{corr.user}</td>
                  <td className="px-6 py-4">{corr.type}</td>
                  <td className="px-6 py-4 italic text-gray-500">{corr.reason}</td>
                  <td className="px-6 py-4">
                    {corr.status === 'Pending' ? (
                      <span className="badge badge-warning">Menunggu</span>
                    ) : (
                      <span className="badge badge-success">Selesai</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center space-x-2">
                    {corr.status === 'Pending' ? (
                      <>
                        <button className="text-green-600 hover:text-green-900 p-1 bg-green-50 hover:bg-green-100 rounded" title="Setujui">
                          <CheckCircle2 className="w-5 h-5" />
                        </button>
                        <button className="text-red-600 hover:text-red-900 p-1 bg-red-50 hover:bg-red-100 rounded" title="Tolak">
                          <XCircle className="w-5 h-5" />
                        </button>
                      </>
                    ) : (
                      <span className="text-xs text-gray-400">Tidak ada aksi</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
