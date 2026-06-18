import { useState, useEffect } from 'react'
import { Calendar as CalendarIcon, CheckCircle2, AlertCircle, Loader2, ChevronLeft, ChevronRight, Receipt, ListOrdered, CalendarClock, Megaphone, History } from 'lucide-react'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { spreadsheetApi } from '@/services/sheets-client'

export default function MyDuties() {
  const { profile } = useAuth()
  
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  
  const [bills, setBills] = useState<any[]>([])
  const [schedules, setSchedules] = useState<any[]>([])
  const [contributions, setContributions] = useState<any[]>([])
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isConfirming, setIsConfirming] = useState(false)

  useEffect(() => {
    if (!profile?.id) return

    const fetchData = async () => {
      setLoading(true)
      try {
        const [schedRes, billRes, contribRes, announcementRes] = await Promise.all([
          spreadsheetApi.get('Schedules'),
          spreadsheetApi.get('Bills'),
          spreadsheetApi.get('Contributions'),
          spreadsheetApi.get('Announcements')
        ])
        
        if (schedRes.data && Array.isArray(schedRes.data)) {
          const userIdentifier = profile?.nickname || profile?.full_name?.split(' ')[0]
          const mySchedules = schedRes.data.filter((s: any) => 
            s.user_id === profile?.id || 
            (s.user && s.user.includes(userIdentifier))
          )
          setSchedules(mySchedules)
        }
        
        if (billRes.data && Array.isArray(billRes.data)) {
          const myBills = billRes.data.filter((b: any) => 
            b.resident_email === profile?.email || 
            b.resident_name === profile?.full_name
          )
          setBills(myBills)
        }

        if (contribRes.data && Array.isArray(contribRes.data)) {
          // Only active catalogs
          setContributions(contribRes.data.filter((c: any) => c.status !== 'inactive' && c.status !== 'Archived'))
        }

        if (announcementRes.data && Array.isArray(announcementRes.data)) {
          setAnnouncements(announcementRes.data.filter((a: any) => String(a.status || 'active').toLowerCase() !== 'inactive'))
        } else {
          setAnnouncements([])
        }
      } catch (e) {
        console.error(e)
      }
      setLoading(false)
    }

    if (profile?.id) {
      fetchData()
    }
  }, [profile])

  const handleConfirm = async (dutyId: string | number) => {
    setIsConfirming(true)
    const payload = { 
      id: dutyId, 
      status: 'Selesai', 
      updated_at: new Date().toISOString(),
      date: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
    }
    
    const res = await spreadsheetApi.put('Schedules', payload)
    if (res.success) {
      setSchedules(schedules.map(s => s.id === dutyId ? { ...s, ...payload } : s))
    }
    setIsConfirming(false)
  }

  // Calendar Logic
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay()
  const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"]

  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i)
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))

  const isToday = (day: number) => {
    const today = new Date()
    return day === today.getDate() && currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear()
  }

  const isSelected = (day: number) => {
    return day === selectedDate.getDate() && currentDate.getMonth() === selectedDate.getMonth() && currentDate.getFullYear() === selectedDate.getFullYear()
  }

  const getEventsForDay = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    
    // 1. Explicit Bills for this user
    const dayBills = bills.filter(b => {
      if (!b.due_date) return false;
      const bDate = new Date(b.due_date);
      return bDate.getDate() === day && bDate.getMonth() === currentDate.getMonth() && bDate.getFullYear() === currentDate.getFullYear();
    })

    // 2. Projected Contributions (Iuran rutin dari admin)
    const projectedContribs = contributions.filter(c => {
      if (!c.due_date) return false;
      
      let periodType = 'Bulanan'
      if (c.contribution_types) {
        if (typeof c.contribution_types === 'string') {
          try { periodType = JSON.parse(c.contribution_types).period_type || 'Bulanan' } catch(e){}
        } else {
          periodType = c.contribution_types.period_type || 'Bulanan'
        }
      }

      if (periodType === 'Bulanan') {
        return parseInt(c.due_date) === day;
      } else if (periodType === 'Tahunan') {
        const parts = c.due_date.split('-') // expected 'MM-DD'
        if (parts.length === 2) {
          return (parseInt(parts[0]) - 1 === currentDate.getMonth()) && (parseInt(parts[1]) === day)
        }
      } else if (periodType === 'Mingguan') {
        const daysMap = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu']
        const targetDay = daysMap.indexOf(c.due_date)
        const currentDayOfWeek = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).getDay()
        return currentDayOfWeek === targetDay
      }
      return false
    })

    // Deduplicate: Don't show projection if an explicit bill already exists for it
    const uniqueProjected = projectedContribs.filter(p => 
      !dayBills.some(b => {
        let bTitle = ''
        if (typeof b.contributions === 'string') {
          try { bTitle = JSON.parse(b.contributions).title } catch(e){}
        } else {
          bTitle = b.contributions?.title || ''
        }
        return bTitle === p.title
      })
    )

    // 3. System Announcements (Tanggal Penting Lainnya)
    const dayAnnouncements = announcements.filter(a => {
      const sourceDate = a.date || a.created_at
      if (!sourceDate) return false
      const parsed = new Date(sourceDate)
      if (Number.isNaN(parsed.getTime())) return String(sourceDate).startsWith(dateStr)
      return parsed.getFullYear() === currentDate.getFullYear() &&
        parsed.getMonth() === currentDate.getMonth() &&
        parsed.getDate() === day
    })

    return { 
      bills: dayBills, 
      projected: uniqueProjected,
      announcements: dayAnnouncements
    }
  }

  const selectedEvents = getEventsForDay(selectedDate.getDate())
  const activeDuties = schedules.filter(s => s.status !== 'Selesai')
  const completedDuties = schedules.filter(s => s.status === 'Selesai')

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight flex items-center">
          <CalendarIcon className="mr-2 sm:mr-3 text-primary w-6 h-6 sm:w-8 sm:h-8" />
          Kalender Kos
        </h1>
        <p className="text-xs sm:text-sm text-text-secondary mt-1">Pantau jadwal iuran rutin, tagihan jatuh tempo, pengumuman, dan antrean tugas piket Anda.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COL: Calendar */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card-container p-4 sm:p-6 border-t-4 border-t-primary shadow-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <div className="flex gap-2">
                <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1.5 text-sm font-medium hover:bg-gray-100 rounded-lg text-gray-700 transition-colors">
                  Hari Ini
                </button>
                <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 rounded-xl">
              {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((day) => (
                <div key={day} className={`bg-gray-50 py-2 text-center text-[10px] sm:text-xs font-semibold uppercase tracking-wider ${day === 'Min' ? 'text-red-500' : 'text-gray-500'}`}>
                  {day}
                </div>
              ))}
              
              {blanks.map((b) => (
                <div key={`blank-${b}`} className="bg-white min-h-[80px] p-1 sm:p-2 opacity-50"></div>
              ))}
              
              {days.map((day) => {
                const events = getEventsForDay(day)
                const totalBills = events.bills.length + events.projected.length
                const hasAnnouncements = events.announcements.length > 0
                
                return (
                  <div 
                    key={day} 
                    className={`bg-white min-h-[80px] sm:min-h-[100px] p-1 sm:p-2 transition-colors relative hover:bg-gray-50 group
                      ${isToday(day) ? 'ring-1 ring-inset ring-primary/20' : ''}
                      ${(day === 1) ? 'rounded-tl-xl' : ''}
                      ${(day === 7) ? 'rounded-tr-xl' : ''}
                      ${(day === days.length && (day + blanks.length) % 7 === 0) ? 'rounded-br-xl' : ''}
                      ${(day === days.length - ((day + blanks.length) % 7) + 1) ? 'rounded-bl-xl' : ''}
                    `}
                  >
                    <span className={`inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full text-xs sm:text-sm font-medium
                      ${isToday(day) ? 'bg-primary text-white' : new Date(currentDate.getFullYear(), currentDate.getMonth(), day).getDay() === 0 ? 'text-red-500' : 'text-gray-700'}
                    `}>
                      {day}
                    </span>
                    
                    <div className="mt-1 sm:mt-1.5 space-y-1">
                      {totalBills > 0 && (
                        <div className="text-[9px] sm:text-[10px] bg-red-50 border border-red-100 text-red-700 px-1 py-0.5 sm:px-1.5 rounded truncate font-medium flex items-center shadow-sm">
                          <Receipt className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1 flex-shrink-0" />
                          <span className="hidden sm:inline">Tagihan </span>({totalBills})
                        </div>
                      )}
                      {hasAnnouncements && (
                        <div className="text-[9px] sm:text-[10px] bg-blue-50 border border-blue-100 text-blue-700 px-1 py-0.5 sm:px-1.5 rounded truncate font-medium flex items-center shadow-sm">
                          <Megaphone className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1 flex-shrink-0" />
                          <span className="hidden sm:inline">Acara</span>
                        </div>
                      )}
                    </div>

                    {/* Tooltip Hover Box (muncul setelah 3 detik hover) */}
                    {(totalBills > 0 || hasAnnouncements) && (
                      <div className="absolute z-50 bottom-[110%] left-1/2 -translate-x-1/2 w-64 bg-white p-4 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-300 delay-[3s] border border-gray-100">
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45 border-b border-r border-gray-100"></div>
                        
                        <h4 className="font-bold text-gray-900 text-sm mb-2 pb-2 border-b border-gray-100">Rincian: {day} {monthNames[currentDate.getMonth()]}</h4>
                        
                        <div className="space-y-3 max-h-48 overflow-y-auto custom-scrollbar relative z-10">
                          {events.bills.map((bill, i) => {
                            let bTitle = ''
                            try { bTitle = typeof bill.contributions === 'string' ? JSON.parse(bill.contributions).title : bill.contributions?.title } catch(e) { bTitle = 'Tagihan Kos' }
                            return (
                              <div key={`b-${i}`} className="text-xs">
                                <div className="flex items-center text-red-600 font-semibold mb-0.5"><Receipt className="w-3 h-3 mr-1" /> Jatuh Tempo</div>
                                <div className="text-gray-800">{bTitle}</div>
                                <div className="text-gray-500">Rp {bill.amount?.toLocaleString('id-ID')}</div>
                              </div>
                            )
                          })}
                          
                          {events.projected.map((proj, i) => (
                            <div key={`p-${i}`} className="text-xs">
                              <div className="flex items-center text-orange-600 font-semibold mb-0.5"><CalendarClock className="w-3 h-3 mr-1" /> Iuran Rutin</div>
                              <div className="text-gray-800">{proj.title}</div>
                              <div className="text-gray-500">Estimasi: Rp {Number(proj.amount).toLocaleString('id-ID')}</div>
                            </div>
                          ))}

                          {events.announcements.map((ann, i) => (
                            <div key={`a-${i}`} className="text-xs">
                              <div className="flex items-center text-blue-600 font-semibold mb-0.5"><Megaphone className="w-3 h-3 mr-1" /> Pengumuman</div>
                              <div className="text-gray-800">{ann.title}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COL: Duties Queue */}
        <div className="space-y-6">
          <div className="card-container p-6 border-t-4 border-t-primary shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 pointer-events-none" />
            
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center relative z-10">
              <ListOrdered className="w-5 h-5 mr-2 text-primary" />
              Antrean Piket Saat Ini
            </h2>
            
            {loading ? (
              <div className="py-8 text-center text-gray-500 flex flex-col items-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary mb-2" />
                Memuat antrean...
              </div>
            ) : activeDuties.length > 0 ? (
              <div className="space-y-4 relative z-10">
                <div className="bg-primary-soft/30 border border-primary/20 p-4 rounded-xl">
                  <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">Tugas Anda Berikutnya</p>
                  <p className="text-lg font-bold text-gray-900">{activeDuties[0].date}</p>
                  <p className="text-sm text-gray-700 mt-1">{activeDuties[0].task}</p>
                </div>

                <div className="flex items-start text-xs text-text-secondary bg-orange-50 p-3 rounded-lg border border-orange-100 leading-relaxed">
                  <AlertCircle className="w-4 h-4 text-orange-500 mr-2 flex-shrink-0 mt-0.5" />
                  <p>Klik tombol di bawah ini <b>setelah</b> Anda selesai agar giliran berpindah ke warga selanjutnya.</p>
                </div>
                
                <button 
                  onClick={() => handleConfirm(activeDuties[0].id)}
                  disabled={isConfirming}
                  className="btn-primary w-full py-2.5 flex justify-center items-center shadow-md hover:shadow-lg transition-all"
                >
                  {isConfirming ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {isConfirming ? 'Memproses...' : 'Tandai Piket Selesai'}
                </button>
              </div>
            ) : (
              <div className="bg-success/10 border border-success/20 p-5 rounded-xl text-center relative z-10">
                <CheckCircle2 className="w-10 h-10 text-success mx-auto mb-2" />
                <p className="font-bold text-success-dark text-sm">Bebas Tugas!</p>
                <p className="text-xs text-success mt-1">Anda tidak memiliki giliran piket yang belum diselesaikan saat ini.</p>
              </div>
            )}
          </div>
          
          <div className="card-container p-6 border-t-4 border-t-gray-300 shadow-md relative overflow-hidden transition-all hover:shadow-lg">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gray-100/50 rounded-full -mr-16 -mt-16 pointer-events-none" />
            
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center relative z-10">
              <History className="w-5 h-5 mr-2 text-gray-500" />
              Riwayat Piket Selesai
            </h2>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar relative z-10">
              {loading ? (
                <div className="text-sm text-gray-500 text-center py-4 flex flex-col items-center">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400 mb-2" />
                  Memuat riwayat...
                </div>
              ) : completedDuties.length === 0 ? (
                <div className="text-sm text-gray-500 py-4 text-center">Belum ada riwayat piket yang diselesaikan.</div>
              ) : (
                completedDuties.slice(0, 10).map(hd => (
                  <div key={hd.id} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100 shadow-sm bg-white">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{hd.date}</p>
                      <p className="text-xs text-text-secondary line-clamp-1 mt-0.5">{hd.task}</p>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
