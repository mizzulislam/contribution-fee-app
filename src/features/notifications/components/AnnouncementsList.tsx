import { useEffect, useState } from 'react'
import { AlertCircle, Calendar, Loader2, Megaphone, User, Zap } from 'lucide-react'
import { spreadsheetApi } from '@/services/sheets-client'

interface AnnouncementRow {
  id: string | number
  title?: string
  date?: string
  content?: string
  message?: string
  author?: string
  status?: string
  type?: string
  created_at?: string
}

function isNewAnnouncement(date?: string) {
  if (!date) return false
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return false
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  return parsed >= sevenDaysAgo
}

function formatDate(date?: string) {
  if (!date) return '-'
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return date
  return parsed.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
}

export default function Announcements() {
  const [announcements, setAnnouncements] = useState<AnnouncementRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function fetchAnnouncements() {
      setLoading(true)
      const { data } = await spreadsheetApi.get('Announcements')
      if (!isMounted) return

      const rows = (Array.isArray(data) ? data : []) as AnnouncementRow[]
      setAnnouncements(
        rows
          .filter((item: AnnouncementRow) => String(item.status || 'active').toLowerCase() !== 'inactive')
          .sort((a: AnnouncementRow, b: AnnouncementRow) => new Date(b.date || b.created_at || '').getTime() - new Date(a.date || a.created_at || '').getTime())
      )
      setLoading(false)
    }

    fetchAnnouncements()
    return () => {
      isMounted = false
    }
  }, [])

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center">
          <div className="w-10 h-10 rounded-xl bg-primary-soft text-primary flex items-center justify-center mr-3 shadow-sm">
            <Megaphone className="w-6 h-6" />
          </div>
          Pengumuman Kos
        </h1>
        <p className="text-text-secondary mt-1">Informasi umum terkini dari data pengumuman sistem.</p>
      </div>

      <div className="grid gap-4">
        {loading ? (
          <div className="card-container p-12 text-center text-emerald-700">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" />
            Memuat pengumuman...
          </div>
        ) : announcements.length === 0 ? (
          <div className="card-container p-12 text-center border border-dashed border-gray-200">
            <Megaphone className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Belum ada pengumuman aktif saat ini.</p>
          </div>
        ) : (
          announcements.map((ann) => {
            const Icon = ann.type === 'maintenance' ? Zap : AlertCircle
            const sourceDate = ann.date || ann.created_at

            return (
              <div key={ann.id} className="card-container p-5 sm:p-6 relative overflow-hidden group hover:shadow-md transition-all duration-300 border-l-4 border-l-primary">
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 relative z-10">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center ring-4 ring-white shadow-sm">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1.5">
                      <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        {ann.title || 'Pengumuman'}
                        {isNewAnnouncement(sourceDate) && (
                          <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Baru
                          </span>
                        )}
                      </h2>
                    </div>

                    <div className="flex flex-wrap items-center text-xs text-text-muted mb-3 gap-y-2">
                      <span className="flex items-center">
                        <Calendar className="w-3.5 h-3.5 mr-1" />
                        {formatDate(sourceDate)}
                      </span>
                      <span className="mx-2 text-gray-300 hidden sm:inline">•</span>
                      <span className="flex items-center text-primary-dark font-medium bg-primary-soft/50 px-2.5 py-1 rounded-md">
                        <User className="w-3.5 h-3.5 mr-1.5" />
                        Oleh: {ann.author || 'Sistem'}
                      </span>
                    </div>

                    <p className="text-gray-700 leading-relaxed text-sm">
                      {ann.content || ann.message || '-'}
                    </p>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
