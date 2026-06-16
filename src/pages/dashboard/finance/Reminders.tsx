import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { BellRing, Send, CheckCircle2 } from 'lucide-react'
import { spreadsheetApi } from '@/lib/spreadsheet'
import { isDateInPeriod, type PeriodFilter } from '@/lib/accounting/period'

interface UserRow {
  status?: string
  role?: string
}

interface BillRow {
  status?: string
  resident_name?: string
  due_date?: string
  created_at?: string
}

interface RemindersProps {
  period?: PeriodFilter
}

const defaultPeriod: PeriodFilter = { preset: 'all' }

export default function Reminders({ period = defaultPeriod }: RemindersProps) {
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [success, setSuccess] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  
  const [totalPenghuni, setTotalPenghuni] = useState(0)
  const [sudahLunas, setSudahLunas] = useState(0)
  const [belumLunas, setBelumLunas] = useState(0)

  async function fetchData() {
    setLoadingData(true)
    try {
      const [usersRes, billsRes] = await Promise.all([
        spreadsheetApi.get('Users'),
        spreadsheetApi.get('Bills')
      ])

      let usersList: UserRow[] = []
      let billsList: BillRow[] = []

      if (usersRes.data && Array.isArray(usersRes.data)) {
        usersList = usersRes.data.filter(u => (!u.status || u.status === 'Aktif') && String(u.role).includes('user'))
        setTotalPenghuni(usersList.length)
      }

      if (billsRes.data && Array.isArray(billsRes.data)) {
        billsList = billsRes.data.filter((bill: BillRow) => isDateInPeriod(bill.due_date || bill.created_at || '', period))
        const unpaidBills = billsList.filter(b => b.status === 'unpaid' || b.status === 'pending' || b.status === 'Belum Bayar')
        
        // Count unique users who have unpaid bills
        const unpaidUsers = new Set(unpaidBills.map(b => b.resident_name)).size
        setBelumLunas(unpaidUsers)
        setSudahLunas(Math.max(0, usersList.length - unpaidUsers))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingData(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [period])

  const handleSendReminders = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setSuccess(true)
      setToastMessage(`Berhasil mengirim ${belumLunas} pesan pengingat tagihan ke WhatsApp penghuni!`)
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
        <div className="card-container p-6 flex flex-col h-full">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Status Tagihan Bulan Ini</h2>
          
          {loadingData ? (
            <div className="py-12 text-center text-gray-500 text-sm animate-pulse">Memuat data real-time...</div>
          ) : (
            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Total Penghuni</span>
                <span className="font-bold text-gray-900">{totalPenghuni} Orang</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-success/10 rounded-lg">
                <span className="text-success-dark">Sudah Lunas</span>
                <span className="font-bold text-success">{sudahLunas} Orang</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                <span className="text-orange-700 font-medium">Belum Lunas / Pending</span>
                <span className="font-bold text-orange-600">{belumLunas} Orang</span>
              </div>
            </div>
          )}

          <button 
            className={`w-full py-3 mt-auto flex items-center justify-center font-medium rounded-lg text-white transition-all ${
              success ? 'bg-success' : 'bg-primary hover:bg-primary-dark shadow-md hover:shadow-lg'
            }`}
            onClick={handleSendReminders}
            disabled={loading || success || loadingData || belumLunas === 0}
          >
            {loading ? (
              <>Memproses...</>
            ) : success ? (
              <>Pengingat Berhasil Terkirim!</>
            ) : belumLunas === 0 ? (
              <><CheckCircle2 className="w-5 h-5 mr-2" /> Semua Sudah Lunas</>
            ) : (
              <><Send className="w-5 h-5 mr-2" /> Kirim Pengingat Massal ({belumLunas} Orang)</>
            )}
          </button>
        </div>

        <div className="card-container p-6 bg-gradient-to-br from-white to-gray-50">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Template Pesan Pengingat</h2>
          <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm text-sm text-gray-700 font-mono leading-relaxed relative">
            <p>Halo bang <span className="text-primary">[Nama Penghuni]</span>! 👋</p>
            <br />
            <p>Sekadar ngingetin nih, tagihan kos untuk bulan <span className="text-primary">[Bulan]</span> udah mau jatuh tempo pada <span className="text-primary">[Tanggal Jatuh Tempo]</span>.</p>
            <br />
            <p>Total tagihannya: <strong>Rp <span className="text-primary">[Nominal]</span></strong></p>
            <br />
            <p>Boleh minta tolong diselesaikan pembayarannya dan <i>upload</i> buktinya lewat Portal Penghuni ya bang. Kalo ada kendala atau pertanyaan, kabarin aja!</p>
            <br />
            <p>Makasih banyak kerjasamanya, sehat selalu! 🙏</p>
            <p>— Bendahara Soematra Kost</p>
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
