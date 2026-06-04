import { useState } from 'react'
import { CalendarDays, CheckCircle2, AlertCircle } from 'lucide-react'

export default function MyDuties() {
  const [isCompleted, setIsCompleted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleConfirm = () => {
    setLoading(true)
    setTimeout(() => {
      setIsCompleted(true)
      setLoading(false)
    }, 1000)
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center">
          <CalendarDays className="mr-3 text-primary w-8 h-8" />
          Jadwal Piket Saya
        </h1>
        <p className="text-text-secondary mt-1">Pantau jadwal tugas angkat galon Anda bulan ini.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card-container p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 border-b border-border pb-2">Jadwal Minggu Ini</h2>
          
          <div className="bg-primary-soft/10 border-l-4 border-primary p-4 rounded-r-lg mb-6">
            <p className="text-sm text-text-secondary mb-1">Tanggal Tugas:</p>
            <p className="text-xl font-bold text-gray-900">Jumat, 12 Juni 2026</p>
            <p className="text-sm font-medium text-primary mt-2">Tugas: Angkat Galon & Buang Sampah</p>
          </div>

          {!isCompleted ? (
            <div className="space-y-4">
              <div className="flex items-start text-sm text-text-secondary bg-orange-50 p-3 rounded-lg border border-orange-100">
                <AlertCircle className="w-5 h-5 text-orange-500 mr-2 flex-shrink-0 mt-0.5" />
                <p>Harap tekan tombol di bawah ini <b>setelah</b> Anda selesai melaksanakan tugas piket Anda untuk memberi tahu penghuni lain dan bendahara.</p>
              </div>
              <button 
                onClick={handleConfirm}
                disabled={loading}
                className="btn-primary w-full py-3"
              >
                {loading ? 'Memproses...' : 'Konfirmasi Selesai Piket'}
              </button>
            </div>
          ) : (
            <div className="bg-success/10 border border-success/20 p-4 rounded-lg text-center">
              <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-2" />
              <p className="font-bold text-success-dark">Terima Kasih!</p>
              <p className="text-sm text-success mt-1">Anda telah mengkonfirmasi penyelesaian tugas piket minggu ini.</p>
            </div>
          )}
        </div>

        <div className="card-container p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 border-b border-border pb-2">Riwayat Piket Sebelumnya</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100">
              <div>
                <p className="font-medium text-gray-900">Jumat, 29 Mei 2026</p>
                <p className="text-xs text-text-secondary">Angkat Galon</p>
              </div>
              <span className="badge badge-success">Selesai</span>
            </div>
            <div className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100">
              <div>
                <p className="font-medium text-gray-900">Jumat, 15 Mei 2026</p>
                <p className="text-xs text-text-secondary">Buang Sampah</p>
              </div>
              <span className="badge badge-success">Selesai</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
