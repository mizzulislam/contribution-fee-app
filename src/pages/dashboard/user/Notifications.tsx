import { useState } from 'react'
import { Bell, Check, Info, AlertTriangle } from 'lucide-react'

export default function Notifications() {
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Tagihan Baru', message: 'Tagihan Iuran Wajib bulan Juni 2026 telah terbit. Silakan lakukan pembayaran sebelum tanggal 10.', type: 'warning', date: 'Hari ini, 08:00', read: false },
    { id: 2, title: 'Pembayaran Terverifikasi', message: 'Pembayaran Iuran Wajib bulan Mei 2026 telah diverifikasi oleh Bendahara.', type: 'success', date: 'Kemarin, 14:30', read: true },
    { id: 3, title: 'Jadwal Piket', message: 'Jangan lupa jadwal piket angkat galon Anda besok!', type: 'info', date: '2 hari yang lalu', read: true }
  ])

  const markAsRead = (id: number) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })))
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="w-5 h-5 text-warning" />
      case 'success': return <Check className="w-5 h-5 text-success" />
      default: return <Info className="w-5 h-5 text-info" />
    }
  }

  const getBgColor = (type: string, read: boolean) => {
    if (read) return 'bg-white'
    switch (type) {
      case 'warning': return 'bg-orange-50'
      case 'success': return 'bg-green-50'
      default: return 'bg-blue-50'
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center">
            <Bell className="mr-3 text-primary w-8 h-8" />
            Notifikasi Pribadi
          </h1>
          <p className="text-text-secondary mt-1">Pesan pengingat tagihan dan informasi dari bendahara.</p>
        </div>
        <button 
          onClick={markAllAsRead}
          className="text-sm font-medium text-primary hover:text-primary-dark"
        >
          Tandai semua dibaca
        </button>
      </div>

      <div className="card-container overflow-hidden divide-y divide-gray-100">
        {notifications.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            Tidak ada notifikasi saat ini.
          </div>
        ) : (
          notifications.map((notif) => (
            <div 
              key={notif.id} 
              className={`p-5 sm:p-6 transition-colors flex gap-4 ${getBgColor(notif.type, notif.read)} hover:bg-gray-50`}
            >
              <div className="mt-1">
                {getIcon(notif.type)}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <h3 className={`font-semibold ${notif.read ? 'text-gray-700' : 'text-gray-900'}`}>
                    {notif.title}
                  </h3>
                  <span className="text-xs text-text-muted whitespace-nowrap ml-4">{notif.date}</span>
                </div>
                <p className={`text-sm ${notif.read ? 'text-gray-500' : 'text-gray-700'} mb-3`}>
                  {notif.message}
                </p>
                {!notif.read && (
                  <button 
                    onClick={() => markAsRead(notif.id)}
                    className="text-xs font-medium text-primary hover:text-primary-dark flex items-center"
                  >
                    <Check className="w-3.5 h-3.5 mr-1" /> Tandai sudah dibaca
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
