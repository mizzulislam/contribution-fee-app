import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Calendar, CheckSquare, Loader2, X, Settings, CheckCircle2 } from 'lucide-react'
import { spreadsheetApi } from '@/lib/spreadsheet'
import Select from '@/components/ui/Select'

export default function DutySchedules() {
  const [schedules, setSchedules] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [isConfirming, setIsConfirming] = useState<string|number|null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState('bulan_ini')

  useEffect(() => {
    fetchSchedules()
  }, [])

  const fetchSchedules = async () => {
    setLoading(true)
    const { data } = await spreadsheetApi.get('Schedules')
    if (data && Array.isArray(data)) {
      setSchedules(data.reverse())
    } else {
      setSchedules([])
    }
    setLoading(false)
  }

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsGenerating(true)
    
    // Fetch users first to assign schedules
    const { data: users } = await spreadsheetApi.get('Users')
    
    if (users && Array.isArray(users) && users.length > 0) {
      // Pick a random user for demo purposes, or loop
      const activeUsers = users.filter(u => u.status === 'Aktif' || u.role === 'user')
      if (activeUsers.length > 0) {
        const randomUser = activeUsers[Math.floor(Math.random() * activeUsers.length)]
        const newSchedule = {
          id: Date.now(),
          date: new Date().toISOString().split('T')[0], // Today's date
          user: `${randomUser.full_name} (Kamar ${randomUser.room_number || '?'})`,
          user_id: randomUser.id,
          task: 'Angkat Galon & Buang Sampah',
          status: 'Menunggu',
          created_at: new Date().toISOString()
        }
        
        await spreadsheetApi.post('Schedules', newSchedule)
        setSchedules([newSchedule, ...schedules])
        setToastMessage('Jadwal piket berhasil di-generate secara otomatis.')
      } else {
        setToastMessage('Gagal: Tidak ada penghuni aktif.')
      }
    }
    
    setIsGenerating(false)
    setIsModalOpen(false)
    setTimeout(() => setToastMessage(''), 3000)
  }

  const handleConfirm = async (id: number | string) => {
    setIsConfirming(id)
    const payload = { id, status: 'Selesai', updated_at: new Date().toISOString() }
    await spreadsheetApi.put('Schedules', payload)
    
    setSchedules(schedules.map(s => s.id === id ? { ...s, status: 'Selesai' } : s))
    setIsConfirming(null)
  }
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Jadwal Piket Galon</h1>
          <p className="text-text-secondary mt-1">Lihat jadwal dan konfirmasi pelaksanaan piket.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary flex items-center">
          <Settings className="w-5 h-5 mr-2" /> Konfigurasi Piket
        </button>
      </div>

      <div className="card-container">
        <h2 className="text-xl font-bold mb-6 text-center text-gray-900">Piket Mendatang</h2>
        <div className="max-w-md mx-auto space-y-4">
          {loading ? (
            <div className="py-8 text-center text-gray-500 flex flex-col items-center">
              <Loader2 className="w-6 h-6 animate-spin text-primary mb-2" />
              Memuat jadwal...
            </div>
          ) : (
            schedules.map((schedule, index) => (
              <div 
                key={schedule.id}
                className={
                  index === 0 && schedule.status !== 'Selesai'
                    ? "border-2 border-[#10B981] bg-[#ECFDF5] p-5 rounded-[14px] flex justify-between items-center shadow-sm"
                    : "border border-[#E5E7EB] p-5 rounded-[14px] flex justify-between items-center opacity-80 bg-gray-50/50"
                }
              >
                <div>
                  <p className={`font-bold text-lg ${index === 0 && schedule.status !== 'Selesai' ? 'text-[#047857]' : 'text-gray-700'}`}>{schedule.date}</p>
                  <p className={`text-sm font-medium mt-0.5 ${index === 0 && schedule.status !== 'Selesai' ? 'text-[#047857]/80' : 'text-gray-500'}`}>{schedule.user}</p>
                </div>
                {schedule.status === 'Selesai' ? (
                  <span className="badge badge-success">Selesai</span>
                ) : index === 0 ? (
                  <button 
                    onClick={() => handleConfirm(schedule.id)}
                    disabled={isConfirming === schedule.id}
                    className="bg-[#10B981] text-white px-4 py-2 rounded-[10px] text-sm font-semibold flex items-center hover:bg-[#047857] transition-colors shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-[#10B981]"
                  >
                    {isConfirming === schedule.id ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckSquare className="w-4 h-4 mr-2" />} 
                    Konfirmasi
                  </button>
                ) : (
                  <span className="badge bg-gray-200 text-gray-600">{schedule.status}</span>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && createPortal(
        <div className="fixed top-4 right-4 z-[200] animate-in slide-in-from-top-2 fade-in duration-300">
          <div className="bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-lg flex items-center font-medium">
            <CheckCircle2 className="w-5 h-5 mr-3" />
            {toastMessage}
          </div>
        </div>,
        document.body
      )}

      {/* Generate Schedule Modal */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-primary" />
                Generate Jadwal Otomatis
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleGenerate} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Pilih Periode</label>
                <Select
                  value={selectedPeriod}
                  onChange={(val) => setSelectedPeriod(val)}
                  options={[
                    { label: 'Bulan Ini (Juni 2026)', value: 'bulan_ini' },
                    { label: 'Bulan Depan (Juli 2026)', value: 'bulan_depan' }
                  ]}
                />
              </div>
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-800">
                Sistem akan menyusun jadwal secara acak yang adil (round-robin) untuk seluruh warga berstatus aktif.
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary flex-1">Batal</button>
                <button type="submit" disabled={isGenerating} className="btn-primary flex-1 flex justify-center items-center">
                  {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Generate Sekarang'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
