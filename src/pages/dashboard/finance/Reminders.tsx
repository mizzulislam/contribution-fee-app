import { useState } from 'react'
import { createPortal } from 'react-dom'
import { BellRing, Send, Clock, Users, CheckCircle2 } from 'lucide-react'

export default function Reminders() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  const handleSendReminders = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setSuccess(true)
      setToastMessage('Berhasil mengirim 5 pesan pengingat tagihan ke WhatsApp penghuni!')
      setTimeout(() => {
        setSuccess(false)
        setToastMessage('')
      }, 4000)
    }, 1500)
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center">
          <BellRing className="mr-3 text-primary w-8 h-8" />
          Kirim Reminder Tagihan
        </h1>
        <p className="text-text-secondary mt-1">Kirim peringatan otomatis tagihan jatuh tempo ke penghuni via sistem/WhatsApp.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card-container p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Status Tagihan Bulan Ini</h2>
          
          <div className="space-y-4 mb-8">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Total Penghuni</span>
              <span className="font-bold text-gray-900">20 Orang</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-success/10 rounded-lg">
              <span className="text-success-dark">Sudah Lunas</span>
              <span className="font-bold text-success">15 Orang</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
              <span className="text-orange-700 font-medium">Belum Lunas (Jatuh Tempo H-3)</span>
              <span className="font-bold text-orange-600">5 Orang</span>
            </div>
          </div>

          <button 
            className={`w-full py-3 flex items-center justify-center font-medium rounded-lg text-white transition-all ${
              success ? 'bg-success' : 'bg-primary hover:bg-primary-dark shadow-md hover:shadow-lg'
            }`}
            onClick={handleSendReminders}
            disabled={loading || success}
          >
            {loading ? (
              <>Memproses...</>
            ) : success ? (
              <>Pengingat Berhasil Terkirim!</>
            ) : (
              <><Send className="w-5 h-5 mr-2" /> Kirim Pengingat Massal (5 Orang)</>
            )}
          </button>
        </div>

        <div className="card-container p-6 bg-gradient-to-br from-white to-gray-50">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Template Pesan Pengingat</h2>
          <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm text-sm text-gray-700 font-mono leading-relaxed relative">
            <p>Halo <span className="text-primary">[Nama Penghuni]</span>,</p>
            <br />
            <p>Mengingatkan bahwa tagihan Iuran Kos untuk periode <span className="text-primary">[Bulan]</span> akan jatuh tempo pada <span className="text-primary">[Tanggal Jatuh Tempo]</span>.</p>
            <br />
            <p>Total Tagihan: Rp <span className="text-primary">[Nominal]</span></p>
            <br />
            <p>Silakan melakukan pembayaran dan mengunggah bukti transfer melalui Portal Penghuni.</p>
            <br />
            <p>Terima kasih,</p>
            <p>Bendahara Soematra Kost</p>
          </div>
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
    </div>
  )
}
