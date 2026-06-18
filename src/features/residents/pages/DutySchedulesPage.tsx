import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { CheckSquare, Loader2, X, Settings, CheckCircle2, Users, RefreshCw, ListOrdered, Trash2, Pencil, Save, AlertTriangle, Info } from 'lucide-react'
import { spreadsheetApi } from '@/services/sheets-client'
import Select from '@/components/ui/Select'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { generateSecureId } from '@/utils/id'

export default function DutySchedules() {
  const { activeRole } = useAuth()
  const [schedules, setSchedules] = useState<any[]>([])
  const [allUsers, setAllUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Modal & Generation State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSpinning, setIsSpinning] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [isConfirming, setIsConfirming] = useState<string|number|null>(null)
  
  // Inline Edit State
  const [editingId, setEditingId] = useState<string|number|null>(null)
  const [editForm, setEditForm] = useState({ user: '', task: '' })

  // Alert Dialog State
  const [alertDialog, setAlertDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    isConfirm: false,
    onConfirm: () => {}
  })

  // Form Config State
  const [petugasPerGiliran, setPetugasPerGiliran] = useState(1)
  const [jumlahSiklus, setJumlahSiklus] = useState(1)
  const [includedUsers, setIncludedUsers] = useState<string[]>([])
  
  // Spinner Animation State
  const [currentSpinnerName, setCurrentSpinnerName] = useState('Menyiapkan Mesin Pengundi...')
  const spinnerInterval = useRef<any>(null)

  const fetchInitialData = async () => {
    setLoading(true)
    try {
      const [schedRes, userRes] = await Promise.all([
        spreadsheetApi.get('Schedules'),
        spreadsheetApi.get('Users')
      ])
      
      if (schedRes.data && Array.isArray(schedRes.data)) {
        setSchedules(schedRes.data.reverse())
      }
      
      if (userRes.data && Array.isArray(userRes.data)) {
        const active = userRes.data.filter(u => (!u.status || u.status === 'Aktif') && String(u.role).includes('user'))
        setAllUsers(active)
        setIncludedUsers(active.map(u => u.id))
      }
    } catch(e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInitialData()
  }, [])

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (includedUsers.length === 0) {
      setAlertDialog({
        isOpen: true,
        title: 'Petugas Kosong',
        message: 'Pilih minimal 1 warga untuk piket!',
        isConfirm: false,
        onConfirm: () => {}
      })
      return
    }

    setIsGenerating(true)
    setIsSpinning(true)
    
    const activeSelectedUsers = allUsers.filter(u => includedUsers.includes(u.id))
    
    let ticks = 0
    spinnerInterval.current = setInterval(() => {
      const randUser = activeSelectedUsers[Math.floor(Math.random() * activeSelectedUsers.length)]
      setCurrentSpinnerName(randUser.nickname || randUser.full_name)
      ticks++
      if (ticks > 25) { 
        clearInterval(spinnerInterval.current)
        finishGeneration(activeSelectedUsers)
      }
    }, 100)
  }

  const finishGeneration = async (activeSelectedUsers: any[]) => {
    const shuffledUsers = [...activeSelectedUsers].sort(() => Math.random() - 0.5)
    setCurrentSpinnerName(`✅ Selesai! Mengacak urutan...`)

    const newSchedules = []
    let userIndex = 0

    let startingTurn = 1
    const pendingSchedules = schedules.filter(s => s.status !== 'Selesai')
    if (pendingSchedules.length > 0) {
       startingTurn = pendingSchedules.length + 1
    }

    let currentTurn = startingTurn

    for (let cycle = 0; cycle < jumlahSiklus; cycle++) {
      const turnsPerCycle = Math.ceil(shuffledUsers.length / petugasPerGiliran)
      
      for (let turn = 0; turn < turnsPerCycle; turn++) {
        const assignedUsers = []
        for (let p = 0; p < petugasPerGiliran; p++) {
          const u = shuffledUsers[userIndex % shuffledUsers.length]
          assignedUsers.push(`${u.nickname || u.full_name.split(' ')[0]} (Kmr ${u.room_number || '?'})`)
          userIndex++
        }
        
        newSchedules.push({
          id: generateSecureId('DS'),
          date: `Antrean Ke-${currentTurn}`,
          user: assignedUsers.join(' & '),
          user_id: 'Grup', 
          task: 'Ganti Galon & Buang Sampah',
          status: 'Menunggu',
          created_at: new Date(Date.now() + currentTurn * 1000).toISOString() 
        })
        
        currentTurn++
      }
    }

    if (newSchedules.length > 0) {
      for (const sched of newSchedules) {
        await spreadsheetApi.post('Schedules', sched)
      }
      setSchedules([...newSchedules.reverse(), ...schedules])
      setToastMessage(`Berhasil membuat ${newSchedules.length} antrean piket secara Round-Robin!`)
    }

    setIsSpinning(false)
    setIsGenerating(false)
    setIsModalOpen(false)
    setTimeout(() => setToastMessage(''), 4000)
  }

  const handleConfirm = async (id: number | string) => {
    setIsConfirming(id)
    const payload = { id, status: 'Selesai', updated_at: new Date().toISOString() }
    await spreadsheetApi.put('Schedules', payload)
    
    setSchedules(schedules.map(s => s.id === id ? { ...s, status: 'Selesai' } : s))
    setIsConfirming(null)
  }

  const handleDelete = async (id: number | string) => {
    setAlertDialog({
      isOpen: true,
      title: 'Hapus Antrean',
      message: 'Apakah Anda yakin ingin menghapus antrean ini secara permanen? Aksi ini tidak dapat dibatalkan.',
      isConfirm: true,
      onConfirm: async () => {
        await spreadsheetApi.del('Schedules', id)
        setSchedules(prev => prev.filter(s => s.id !== id))
        setToastMessage('Jadwal antrean berhasil dihapus.')
        setTimeout(() => setToastMessage(''), 3000)
      }
    })
  }

  const startEdit = (s: any) => {
    setEditingId(s.id)
    setEditForm({ user: s.user, task: s.task })
  }

  const saveEdit = async (schedule: any) => {
    const payload = { ...schedule, user: editForm.user, task: editForm.task, updated_at: new Date().toISOString() }
    await spreadsheetApi.put('Schedules', payload)
    setSchedules(schedules.map(s => s.id === schedule.id ? payload : s))
    setEditingId(null)
    setToastMessage('Perubahan berhasil disimpan.')
    setTimeout(() => setToastMessage(''), 3000)
  }

  const toggleUser = (userId: string) => {
    if (includedUsers.includes(userId)) {
      setIncludedUsers(includedUsers.filter(id => id !== userId))
    } else {
      setIncludedUsers([...includedUsers, userId])
    }
  }

  const toggleAllUsers = () => {
    if (includedUsers.length === allUsers.length) {
      setIncludedUsers([])
    } else {
      setIncludedUsers(allUsers.map(u => u.id))
    }
  }

  const activeQueue = schedules.filter(s => s.status !== 'Selesai').sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  const historySchedules = schedules.filter(s => s.status === 'Selesai')
  const displaySchedules = [...activeQueue, ...historySchedules]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight flex items-center">
            <ListOrdered className="mr-2 sm:mr-3 text-primary w-6 h-6 sm:w-8 sm:h-8" />
            Antrean Piket Galon
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">Daftar giliran tugas ganti galon berdasarkan urutan putaran yang adil.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary flex items-center shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all">
          <Settings className="w-5 h-5 mr-2" /> Konfigurasi Piket
        </button>
      </div>

      <div className="card-container">
        <h2 className="text-xl font-bold mb-6 text-center text-gray-900">Daftar Antrean Berjalan</h2>
        <div className="w-full">
          {loading ? (
            <div className="py-12 text-center text-gray-500 flex flex-col items-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
              Memuat antrean...
            </div>
          ) : displaySchedules.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              <ListOrdered className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              Belum ada antrean piket. Klik <b>Konfigurasi Piket</b> untuk membuat urutan giliran.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {displaySchedules.map((schedule, index) => {
                const isNextInLine = schedule.status !== 'Selesai' && index === 0;
                
                return (
                <div 
                  key={schedule.id}
                  className={
                    isNextInLine
                      ? "border-2 border-[#10B981] bg-gradient-to-br from-[#ECFDF5] to-white p-5 rounded-[14px] flex flex-col justify-between shadow-md transform hover:-translate-y-1 transition-all"
                      : schedule.status === 'Selesai'
                      ? "border border-gray-200 p-5 rounded-[14px] flex flex-col justify-between bg-gray-50/40 opacity-80"
                      : "border border-[#E5E7EB] p-5 rounded-[14px] flex flex-col justify-between bg-white hover:shadow-sm transition-colors"
                  }
                >
                  <div className="flex justify-between items-start mb-4">
                    <p className={`font-bold text-lg flex items-center gap-2 ${isNextInLine ? 'text-[#047857]' : 'text-gray-800'}`}>
                      <ListOrdered className="w-5 h-5 opacity-70" /> {schedule.date || 'Antrean'}
                    </p>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center gap-1.5">
                      {editingId === schedule.id ? (
                        <>
                          <button onClick={() => saveEdit(schedule)} className="p-1.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-md transition-colors" title="Simpan">
                            <Save className="w-4 h-4" />
                          </button>
                          <button onClick={() => setEditingId(null)} className="p-1.5 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-md transition-colors" title="Batal">
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startEdit(schedule)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Edit">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(schedule.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Hapus">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex-1">
                    {editingId === schedule.id ? (
                      <div className="space-y-3 mb-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Nama Petugas</label>
                          <input 
                            type="text" 
                            className="w-full text-sm p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            value={editForm.user}
                            onChange={(e) => setEditForm({...editForm, user: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Tugas</label>
                          <input 
                            type="text" 
                            className="w-full text-sm p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            value={editForm.task}
                            onChange={(e) => setEditForm({...editForm, task: e.target.value})}
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className={`text-[15px] font-semibold flex items-center gap-2 mb-2 ${isNextInLine ? 'text-[#047857]/90' : 'text-gray-700'}`}>
                          <Users className="w-4 h-4 opacity-60 flex-shrink-0" /> <span className="truncate">{schedule.user}</span>
                        </p>
                        <p className="text-xs text-gray-500 pl-6 mb-4 line-clamp-2">Tugas: {schedule.task}</p>
                      </>
                    )}
                  </div>
                  
                  <div className="w-full pt-4 border-t border-gray-100 flex justify-end">
                    {schedule.status === 'Selesai' ? (
                      <span className="badge badge-success px-4 py-2 flex items-center justify-center w-full shadow-sm bg-emerald-100 text-emerald-700">
                        <CheckCircle2 className="w-4 h-4 mr-2" /> Selesai
                      </span>
                    ) : isNextInLine && activeRole === 'user' ? (
                      <button 
                        onClick={() => handleConfirm(schedule.id)}
                        disabled={isConfirming === schedule.id || editingId === schedule.id}
                        className="w-full bg-[#10B981] text-white px-5 py-2.5 rounded-[10px] text-sm font-bold flex items-center justify-center hover:bg-[#047857] transition-all shadow-md hover:shadow-lg focus:ring-2 focus:ring-offset-2 focus:ring-[#10B981] disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        {isConfirming === schedule.id ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <CheckSquare className="w-5 h-5 mr-2" />} 
                        Selesaikan Giliran
                      </button>
                    ) : isNextInLine ? (
                      <span className="badge bg-emerald-50 text-emerald-700 px-3 py-1.5 w-full text-center">Giliran Berjalan</span>
                    ) : (
                      <span className="badge bg-gray-100 text-gray-600 px-3 py-1.5 w-full text-center">Menunggu</span>
                    )}
                  </div>
                </div>
              )})}
            </div>
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

      {/* Configuration & Spinner Modal */}
      {isModalOpen && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/70 backdrop-blur-md animate-in fade-in duration-300"
          onMouseDown={() => {
            if (!isGenerating) setIsModalOpen(false)
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
            onMouseDown={(event) => event.stopPropagation()}
          >
            
            {!isSpinning ? (
              // FORM KONFIGURASI
              <>
                <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/80">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center">
                    <Settings className="w-5 h-5 mr-2 text-primary" />
                    Konfigurasi Antrean Piket
                  </h2>
                  <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-200 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <form onSubmit={handleGenerate} className="p-6 overflow-y-auto space-y-6">
                  
                  {/* Row 1: Putaran & Petugas */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Jumlah Putaran (Siklus)</label>
                      <Select
                        value={jumlahSiklus.toString()}
                        onChange={(val) => setJumlahSiklus(Number(val))}
                        options={[
                          { label: '1 Putaran', value: '1' },
                          { label: '2 Putaran', value: '2' },
                          { label: '3 Putaran', value: '3' },
                          { label: '4 Putaran', value: '4' },
                        ]}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Petugas per Giliran</label>
                      <Select
                        value={petugasPerGiliran.toString()}
                        onChange={(val) => setPetugasPerGiliran(Number(val))}
                        options={[
                          { label: '1 Orang', value: '1' },
                          { label: '2 Orang', value: '2' },
                          { label: '3 Orang', value: '3' },
                        ]}
                      />
                    </div>
                  </div>

                  {/* Row 2: Penghuni */}
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <label className="block text-sm font-semibold text-gray-700">Penghuni yang Dilibatkan</label>
                      <button 
                        type="button" 
                        onClick={toggleAllUsers}
                        className="text-xs font-semibold text-primary hover:text-primary-dark"
                      >
                        {includedUsers.length === allUsers.length ? 'Batal Pilih Semua' : 'Pilih Semua'}
                      </button>
                    </div>
                    
                    <div className="bg-gray-50 border border-gray-200 rounded-xl max-h-48 overflow-y-auto p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {allUsers.length === 0 ? (
                        <p className="text-xs text-gray-500 italic p-2">Tidak ada data warga aktif.</p>
                      ) : (
                        allUsers.map((u) => (
                          <label key={u.id} className="flex items-center p-2 hover:bg-white rounded-lg border border-transparent hover:border-gray-200 cursor-pointer transition-colors">
                            <input 
                              type="checkbox" 
                              checked={includedUsers.includes(u.id)}
                              onChange={() => toggleUser(u.id)}
                              className="rounded border-gray-300 text-primary focus:ring-primary mr-3 w-4 h-4"
                            />
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-gray-800 leading-tight">{u.nickname || u.full_name}</span>
                              <span className="text-xs text-gray-500">Kamar {u.room_number || '-'}</span>
                            </div>
                          </label>
                        ))
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Terpilih: <b>{includedUsers.length}</b> dari {allUsers.length} warga aktif
                    </p>
                  </div>

                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100/50 rounded-xl text-sm text-blue-900 leading-relaxed shadow-sm">
                    Antrean dibuat tanpa batas tanggal. Sistem menggunakan algoritma <b>Random Spinner</b> untuk mengacak urutan, dan setiap giliran berfokus pada pergantian satu galon kosong.
                  </div>

                  <div className="pt-4 flex gap-3 border-t border-gray-100">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary flex-1 py-2.5">Batal</button>
                    <button 
                      type="submit" 
                      disabled={isGenerating || allUsers.length === 0 || includedUsers.length === 0} 
                      className="btn-primary flex-1 py-2.5 flex justify-center items-center font-bold text-base bg-gradient-to-r from-primary to-emerald-500 hover:from-primary hover:to-emerald-600 shadow-md hover:shadow-lg disabled:opacity-50 transition-all"
                    >
                      <RefreshCw className="w-5 h-5 mr-2" /> Mulai Undi Antrean
                    </button>
                  </div>
                </form>
              </>
            ) : (
              // SPINNER UI
              <div className="p-10 flex flex-col items-center justify-center min-h-[400px] text-center bg-gradient-to-b from-gray-900 to-gray-800 text-white relative overflow-hidden rounded-2xl">
                {/* Decorative Elements */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
                   <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary rounded-full blur-[100px] animate-pulse"></div>
                </div>

                <h3 className="text-xl font-bold text-gray-300 mb-8 uppercase tracking-widest z-10">MENGUNDI URUTAN PIKET</h3>
                
                {/* The Spinner Display */}
                <div className="relative w-full max-w-sm h-32 bg-gray-800/80 border-2 border-gray-600 rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center backdrop-blur-sm z-10">
                   <div className="absolute left-0 w-16 h-full bg-gradient-to-r from-gray-800/90 to-transparent z-20"></div>
                   <div className="absolute right-0 w-16 h-full bg-gradient-to-l from-gray-800/90 to-transparent z-20"></div>
                   
                   <div className="absolute top-0 w-full h-1/3 bg-gradient-to-b from-black/50 to-transparent z-10 pointer-events-none"></div>
                   <div className="absolute bottom-0 w-full h-1/3 bg-gradient-to-t from-black/50 to-transparent z-10 pointer-events-none"></div>

                   {/* Center Selector Line */}
                   <div className="absolute top-1/2 left-0 w-full h-[2px] bg-primary/50 shadow-[0_0_10px_rgba(16,185,129,0.8)] z-30"></div>

                   <div className="w-full py-4 transform translate-y-0 text-center z-10">
                      <span className="text-4xl font-black tracking-tight text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.4)] block px-4 truncate">
                        {currentSpinnerName}
                      </span>
                   </div>
                </div>

                <p className="mt-8 text-gray-400 text-sm z-10 animate-pulse">Memutar rolet keadilan...</p>
              </div>
            )}

          </div>
        </div>,
        document.body
      )}

      {/* Alert Dialog */}
      {alertDialog.isOpen && createPortal(
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200"
          onMouseDown={() => setAlertDialog(prev => ({ ...prev, isOpen: false }))}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden text-center p-6 animate-in zoom-in-95 duration-200"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className={`mx-auto w-14 h-14 flex items-center justify-center rounded-full mb-5 ${alertDialog.isConfirm ? 'bg-red-100 text-red-600' : 'bg-primary-100 text-primary-600'}`}>
              {alertDialog.isConfirm ? <AlertTriangle className="w-7 h-7" /> : <Info className="w-7 h-7" />}
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">{alertDialog.title}</h3>
            <p className="text-gray-500 mb-6 text-sm leading-relaxed">
              {alertDialog.message}
            </p>
            <div className="flex gap-3 justify-center">
              {alertDialog.isConfirm && (
                <button 
                  onClick={() => setAlertDialog(prev => ({ ...prev, isOpen: false }))} 
                  className="btn-secondary flex-1"
                >
                  Batal
                </button>
              )}
              <button 
                onClick={() => {
                  setAlertDialog(prev => ({ ...prev, isOpen: false }))
                  if (alertDialog.isConfirm) alertDialog.onConfirm()
                }} 
                className={`flex-1 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  alertDialog.isConfirm 
                    ? 'bg-red-600 text-white hover:bg-red-700' 
                    : 'bg-primary text-white hover:bg-primary-dark'
                }`}
              >
                {alertDialog.isConfirm ? 'Ya, Hapus' : 'Mengerti'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
