import { useState, useEffect } from 'react'
import { CalendarDays, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { spreadsheetApi } from '@/lib/spreadsheet'
import { TableLoader } from '@/components/ui/TableLoader'

export default function MyDuties() {
  const { profile } = useAuth()
  const [currentDuty, setCurrentDuty] = useState<any>(null)
  const [historyDuties, setHistoryDuties] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isConfirming, setIsConfirming] = useState(false)

  useEffect(() => {
    if (profile?.id) {
      fetchMyDuties()
    }
  }, [profile])

  const fetchMyDuties = async () => {
    setLoading(true)
    const { data } = await spreadsheetApi.get('Schedules')
    if (data && Array.isArray(data)) {
      // Filter by current user
      const mySchedules = data.filter((s: any) => s.user_id === profile?.id)
      
      // Pisahkan mana yang selesai dan mana yang belum
      const completed = mySchedules.filter((s: any) => s.status === 'Selesai').reverse()
      const pending = mySchedules.filter((s: any) => s.status !== 'Selesai')
      
      setHistoryDuties(completed)
      
      // Ambil tugas terdekat yang belum selesai
      if (pending.length > 0) {
        setCurrentDuty(pending[0])
      } else {
        setCurrentDuty(null)
      }
    }
    setLoading(false)
  }

  const handleConfirm = async () => {
    if (!currentDuty) return
    setIsConfirming(true)
    
    const payload = { 
      id: currentDuty.id, 
      status: 'Selesai', 
      updated_at: new Date().toISOString() 
    }
    
    const res = await spreadsheetApi.put('Schedules', payload)
    if (res.success) {
      setHistoryDuties([{...currentDuty, status: 'Selesai'}, ...historyDuties])
      setCurrentDuty(null)
    }
    setIsConfirming(false)
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
          <h2 className="text-lg font-bold text-gray-900 mb-4 border-b border-border pb-2">Jadwal Terdekat</h2>
          
          {loading ? (
            <div className="py-8 text-center text-gray-500 flex flex-col items-center">
              <Loader2 className="w-6 h-6 animate-spin text-primary mb-2" />
              Memuat jadwal...
            </div>
          ) : currentDuty ? (
            <>
              <div className="bg-primary-soft/10 border-l-4 border-primary p-4 rounded-r-lg mb-6">
                <p className="text-sm text-text-secondary mb-1">Tanggal Tugas:</p>
                <p className="text-xl font-bold text-gray-900">{currentDuty.date}</p>
                <p className="text-sm font-medium text-primary mt-2">Tugas: {currentDuty.task}</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start text-sm text-text-secondary bg-orange-50 p-3 rounded-lg border border-orange-100">
                  <AlertCircle className="w-5 h-5 text-orange-500 mr-2 flex-shrink-0 mt-0.5" />
                  <p>Harap tekan tombol di bawah ini <b>setelah</b> Anda selesai melaksanakan tugas piket Anda untuk memberi tahu penghuni lain dan bendahara.</p>
                </div>
                <button 
                  onClick={handleConfirm}
                  disabled={isConfirming}
                  className="btn-primary w-full py-3 flex justify-center items-center"
                >
                  {isConfirming ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                  {isConfirming ? 'Memproses...' : 'Konfirmasi Selesai Piket'}
                </button>
              </div>
            </>
          ) : (
            <div className="bg-success/10 border border-success/20 p-4 rounded-lg text-center">
              <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-2" />
              <p className="font-bold text-success-dark">Bebas Tugas!</p>
              <p className="text-sm text-success mt-1">Anda tidak memiliki jadwal piket yang belum diselesaikan saat ini.</p>
            </div>
          )}
        </div>

        <div className="card-container p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 border-b border-border pb-2">Riwayat Piket Selesai</h2>
          <div className="space-y-3">
            {loading ? (
               <div className="py-4 text-center text-gray-500 flex flex-col items-center">
                 <Loader2 className="w-5 h-5 animate-spin text-primary mb-2" />
                 Memuat riwayat...
               </div>
            ) : historyDuties.length === 0 ? (
               <div className="text-sm text-gray-500">Belum ada riwayat piket yang diselesaikan.</div>
            ) : (
              historyDuties.map(hd => (
                <div key={hd.id} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100">
                  <div>
                    <p className="font-medium text-gray-900">{hd.date}</p>
                    <p className="text-xs text-text-secondary">{hd.task}</p>
                  </div>
                  <span className="badge badge-success">Selesai</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
