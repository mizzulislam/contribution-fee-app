import { Megaphone, Calendar } from 'lucide-react'

export default function Announcements() {
  const announcements = [
    { 
      id: 1, 
      title: 'Pemadaman Listrik Sementara', 
      date: '04 Juni 2026', 
      content: 'Akan ada pemadaman listrik dari pihak PLN pada hari Sabtu, 6 Juni 2026 mulai pukul 09:00 hingga 12:00 WIB. Mohon persiapkan kebutuhan Anda.',
      author: 'Super Admin'
    },
    { 
      id: 2, 
      title: 'Aturan Jam Malam Kos', 
      date: '20 Mei 2026', 
      content: 'Mengingatkan kembali kepada seluruh penghuni bahwa gerbang utama akan dikunci pada pukul 23:00. Bagi yang pulang di atas jam tersebut harap mengabari penjaga kos.',
      author: 'Bendahara Utama'
    }
  ]

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center">
          <Megaphone className="mr-3 text-primary w-8 h-8" />
          Pengumuman Kos
        </h1>
        <p className="text-text-secondary mt-1">Informasi umum terkini untuk seluruh penghuni kos.</p>
      </div>

      <div className="space-y-4">
        {announcements.map((ann) => (
          <div key={ann.id} className="card-container p-6 border-l-4 border-l-primary">
            <h2 className="text-xl font-bold text-gray-900 mb-2">{ann.title}</h2>
            <div className="flex items-center text-xs text-text-muted mb-4">
              <Calendar className="w-3.5 h-3.5 mr-1" /> {ann.date}
              <span className="mx-2">•</span>
              Oleh: {ann.author}
            </div>
            <p className="text-gray-700 leading-relaxed">
              {ann.content}
            </p>
          </div>
        ))}

        {announcements.length === 0 && (
          <div className="card-container p-12 text-center">
            <Megaphone className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Belum ada pengumuman baru saat ini.</p>
          </div>
        )}
      </div>
    </div>
  )
}
