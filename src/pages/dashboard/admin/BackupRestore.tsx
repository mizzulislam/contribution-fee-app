import { useState } from 'react'
import { DatabaseBackup, Download, Upload, Clock } from 'lucide-react'

export default function BackupRestore() {
  const [loading, setLoading] = useState(false)

  const handleBackup = () => {
    setLoading(true)
    setTimeout(() => setLoading(false), 1500)
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center">
          <DatabaseBackup className="mr-3 text-primary w-8 h-8" />
          Backup & Restore Data
        </h1>
        <p className="text-text-secondary mt-1">Buat cadangan data aplikasi untuk mencegah kehilangan data.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card-container p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <Download className="w-5 h-5 mr-2 text-primary" /> Backup Manual
          </h2>
          <p className="text-sm text-text-secondary mb-6">Unduh seluruh data (penghuni, transaksi, pengaturan) dalam format aman.</p>
          
          <button 
            className="btn-primary w-full flex items-center justify-center"
            onClick={handleBackup}
            disabled={loading}
          >
            {loading ? 'Memproses...' : 'Mulai Backup Sekarang'}
          </button>
          
          <div className="mt-4 flex items-start text-xs text-gray-500 bg-gray-50 p-3 rounded">
            <Clock className="w-4 h-4 mr-2 flex-shrink-0" />
            <p>Backup terakhir: 01 Juni 2026, 02:00 WIB (Otomatis)</p>
          </div>
        </div>

        <div className="card-container p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <Upload className="w-5 h-5 mr-2 text-warning" /> Restore Data
          </h2>
          <p className="text-sm text-text-secondary mb-6">Unggah file backup sebelumnya untuk mengembalikan keadaan sistem.</p>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer">
            <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
            <p className="text-sm font-medium text-gray-700">Pilih file .bak atau .json</p>
            <p className="text-xs text-gray-500 mt-1">Maksimal 50MB</p>
          </div>
        </div>
      </div>
    </div>
  )
}
