import { Megaphone, Calendar, User, Zap, AlertCircle } from 'lucide-react'

export default function Announcements() {
  const announcements = [
    { 
      id: 1, 
      title: 'Pemadaman Listrik Sementara', 
      date: '04 Juni 2026', 
      content: 'Akan ada pemadaman listrik dari pihak PLN pada hari Sabtu, 6 Juni 2026 mulai pukul 09:00 hingga 12:00 WIB. Mohon persiapkan kebutuhan Anda.',
      author: 'Super Admin',
      isNew: true,
      icon: Zap
    },
    { 
      id: 2, 
      title: 'Aturan Jam Malam Kos', 
      date: '20 Mei 2026', 
      content: 'Mengingatkan kembali kepada seluruh penghuni bahwa gerbang utama akan dikunci pada pukul 23:00. Bagi yang pulang di atas jam tersebut harap mengabari penjaga kos.',
      author: 'Bendahara Utama',
      isNew: false,
      icon: AlertCircle
    }
  ]

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center">
          <div className="w-10 h-10 rounded-xl bg-primary-soft text-primary flex items-center justify-center mr-3 shadow-sm">
            <Megaphone className="w-6 h-6" />
          </div>
          Pengumuman Kos
        </h1>
        <p className="text-text-secondary mt-1">Informasi umum terkini untuk seluruh penghuni kos.</p>
      </div>

      <div className="grid gap-4">
        {announcements.map((ann) => {
          const Icon = ann.icon || Megaphone
          return (
            <div key={ann.id} className="card-container p-5 sm:p-6 relative overflow-hidden group hover:shadow-md transition-all duration-300 border-l-4 border-l-primary">
              {/* Decorative Background Element */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
              
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 relative z-10">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center ring-4 ring-white shadow-sm">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1.5">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      {ann.title}
                      {ann.isNew && (
                        <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                          Baru
                        </span>
                      )}
                    </h2>
                  </div>
                  
                  <div className="flex flex-wrap items-center text-xs text-text-muted mb-3 gap-y-2">
                    <span className="flex items-center">
                      <Calendar className="w-3.5 h-3.5 mr-1" />
                      {ann.date}
                    </span>
                    <span className="mx-2 text-gray-300 hidden sm:inline">•</span>
                    <span className="flex items-center text-primary-dark font-medium bg-primary-soft/50 px-2.5 py-1 rounded-md">
                      <User className="w-3.5 h-3.5 mr-1.5" />
                      Oleh: {ann.author}
                    </span>
                  </div>
                  
                  <p className="text-gray-700 leading-relaxed text-sm">
                    {ann.content}
                  </p>
                </div>
              </div>
            </div>
          )
        })}

        {announcements.length === 0 && (
          <div className="card-container p-12 text-center border border-dashed border-gray-200">
            <Megaphone className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Belum ada pengumuman baru saat ini.</p>
          </div>
        )}
      </div>
    </div>
  )
}
