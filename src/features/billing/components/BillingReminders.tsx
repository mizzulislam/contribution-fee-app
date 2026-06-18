import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { BellRing, Send, CheckCircle2, X, Check, Loader2 } from 'lucide-react'
import { spreadsheetApi } from '@/services/sheets-client'
import { isDateInPeriod, type PeriodFilter } from '@/features/accounting/calculations/period'

interface UserRow {
  status?: string
  role?: string
  full_name?: string
  nickname?: string
  phone_number?: string | number
  room_number?: string | number
}

interface BillRow {
  status?: string
  resident_name?: string
  room_number?: string | number
  due_date?: string
  created_at?: string
  amount?: number
  contributions?: any
}

interface RemindersProps {
  period?: PeriodFilter
}

interface UnpaidResident {
  residentName: string
  nickname: string
  phoneNumber: string
  roomNumber: string
  bills: {
    title: string
    amount: number
    dueDate: string
  }[]
}

const defaultPeriod: PeriodFilter = { preset: 'all' }

const getContributionData = (contrib: any) => {
  if (typeof contrib === 'string') {
    try {
      return JSON.parse(contrib)
    } catch(e) {
      const titleMatch = contrib.match(/title=([^,}]+)/)
      const nameMatch = contrib.match(/name=([^,}]+)/)
      if (titleMatch || nameMatch) {
        return {
          title: titleMatch ? titleMatch[1].trim() : '',
          contribution_types: { name: nameMatch ? nameMatch[1].trim() : '' }
        }
      }
      return { title: contrib, contribution_types: { name: 'Kustom' } }
    }
  }
  return contrib || {}
}

export default function Reminders({ period = defaultPeriod }: RemindersProps) {
  const [loadingData, setLoadingData] = useState(true)
  const [toastMessage, setToastMessage] = useState('')
  
  const [totalPenghuni, setTotalPenghuni] = useState(0)
  const [sudahLunas, setSudahLunas] = useState(0)
  const [belumLunas, setBelumLunas] = useState(0)
  const [unpaidResidents, setUnpaidResidents] = useState<UnpaidResident[]>([])
  
  const [isQueueOpen, setIsQueueOpen] = useState(false)
  const [sentStatus, setSentStatus] = useState<Record<string, boolean>>({})
  const [sendingStatus, setSendingStatus] = useState<Record<string, boolean>>({})
  const [whatsappSettings, setWhatsappSettings] = useState({
    provider: 'manual',
    token: '',
    sender: ''
  })

  async function fetchData() {
    setLoadingData(true)
    try {
      const [usersRes, billsRes, settingsRes] = await Promise.all([
        spreadsheetApi.get('Users'),
        spreadsheetApi.get('Bills'),
        spreadsheetApi.get('NotificationSettings')
      ])

      let usersList: UserRow[] = []
      let billsList: BillRow[] = []

      if (usersRes.data && Array.isArray(usersRes.data)) {
        usersList = usersRes.data.filter(u => (!u.status || u.status === 'Aktif') && String(u.role).includes('user'))
        setTotalPenghuni(usersList.length)
      }

      if (settingsRes.data && Array.isArray(settingsRes.data) && settingsRes.data.length > 0) {
        const remoteSettings = settingsRes.data[0]
        setWhatsappSettings({
          provider: remoteSettings.whatsappProvider || 'manual',
          token: remoteSettings.whatsappToken || '',
          sender: remoteSettings.whatsappSender || ''
        })
      }

      if (billsRes.data && Array.isArray(billsRes.data)) {
        billsList = billsRes.data.filter((bill: BillRow) => isDateInPeriod(bill.due_date || bill.created_at || '', period))
        const unpaidBills = billsList.filter(b => b.status === 'unpaid' || b.status === 'pending' || b.status === 'Belum Bayar')
        
        const residentMap = new Map<string, UnpaidResident>()
        
        unpaidBills.forEach(bill => {
          const name = bill.resident_name || ''
          if (!name) return
          
          if (!residentMap.has(name)) {
            const user = usersList.find(u => u.full_name === name || u.nickname === name)
            residentMap.set(name, {
              residentName: name,
              nickname: user?.nickname || name.split(' ')[0],
              phoneNumber: user?.phone_number ? String(user.phone_number) : '',
              roomNumber: bill.room_number ? String(bill.room_number) : (user?.room_number ? String(user.room_number) : ''),
              bills: []
            })
          }
          
          const residentData = residentMap.get(name)!
          const contribData = getContributionData(bill.contributions)
          residentData.bills.push({
            title: contribData?.title || 'Iuran',
            amount: Number(bill.amount) || 0,
            dueDate: bill.due_date || ''
          })
        })
        
        const list = Array.from(residentMap.values())
        setUnpaidResidents(list)
        setBelumLunas(list.length)
        setSudahLunas(Math.max(0, usersList.length - list.length))
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
    setIsQueueOpen(true)
  }

  const formatWAMessage = (res: UnpaidResident) => {
    const nickname = res.nickname
    let billsStr = ''
    let totalAmount = 0
    
    res.bills.forEach(bill => {
      const amountStr = new Intl.NumberFormat('id-ID').format(bill.amount)
      const dueDateStr = bill.dueDate 
        ? new Date(bill.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) 
        : '-'
      billsStr += `• *${bill.title}*: Rp ${amountStr} (Jatuh Tempo: ${dueDateStr})\n`
      totalAmount += bill.amount
    })
    
    const totalStr = new Intl.NumberFormat('id-ID').format(totalAmount)
    
    return `Halo bang ${nickname}! \u{1F44B}\n\nSekadar ngingetin nih, ada tagihan kos untuk bulan ini yang belum lunas:\n\n${billsStr}\nTotal Tagihan: *Rp ${totalStr}*\n\nBoleh minta tolong diselesaikan pembayarannya dan upload buktinya lewat Portal Penghuni ya bang. Kalo ada kendala atau pertanyaan, kabarin aja!\n\nMakasih banyak kerjasamanya, sehat selalu! \u{1F64F}\n— Bendahara Soematra Kost`
  }

  const sendIndividualWA = async (res: UnpaidResident) => {
    const phone = res.phoneNumber.replace(/[^0-9]/g, '')
    let formattedPhone = phone
    if (phone.startsWith('0')) {
      formattedPhone = '62' + phone.slice(1)
    } else if (phone.startsWith('8')) {
      formattedPhone = '62' + phone
    }
    
    if (!formattedPhone) {
      setToastMessage(`Nomor telepon ${res.residentName} tidak ditemukan atau kosong`)
      setTimeout(() => setToastMessage(''), 3000)
      return
    }

    const msg = formatWAMessage(res)

    if (whatsappSettings.provider === 'fonnte' && whatsappSettings.token) {
      setSendingStatus(prev => ({ ...prev, [res.residentName]: true }))
      try {
        const response = await (spreadsheetApi as any).sendCustomAction('send_whatsapp', {
          target: formattedPhone,
          message: msg
        })
        if (response.success) {
          setSentStatus(prev => ({ ...prev, [res.residentName]: true }))
          setToastMessage(`Pesan otomatis berhasil dikirim ke ${res.nickname}!`)
        } else {
          throw new Error(response.error?.message || 'Gagal mengirim pesan')
        }
      } catch (err: any) {
        console.error(err)
        setToastMessage(`Gagal mengirim: ${err.message || 'Error tidak diketahui'}`)
      } finally {
        setSendingStatus(prev => ({ ...prev, [res.residentName]: false }))
        setTimeout(() => setToastMessage(''), 4000)
      }
    } else {
      window.open(`https://api.whatsapp.com/send/?phone=${formattedPhone}&text=${encodeURIComponent(msg)}`, '_blank')
      setSentStatus(prev => ({ ...prev, [res.residentName]: true }))
    }
  }

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight flex items-center">
          <BellRing className="mr-2 sm:mr-3 text-primary w-6 h-6 sm:w-8 sm:h-8" />
          Kirim Reminder Tagihan
        </h1>
        <p className="text-xs sm:text-sm text-text-secondary mt-1">Kirim peringatan otomatis tagihan jatuh tempo ke penghuni via sistem/WhatsApp.</p>
      </div>

      <div className="grid w-full grid-cols-1 gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.35fr)]">
        <div className="card-container flex h-full min-h-[420px] flex-col p-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-6">Status Tagihan Bulan Ini</h2>
          
          {loadingData ? (
            <div className="py-12 text-center text-gray-500 text-sm animate-pulse">Memuat data real-time...</div>
          ) : (
            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg text-sm">
                <span className="text-gray-600">Total Penghuni</span>
                <span className="font-bold text-gray-900">{totalPenghuni} Orang</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-success/10 rounded-lg text-sm">
                <span className="text-success-dark">Sudah Lunas</span>
                <span className="font-bold text-success">{sudahLunas} Orang</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg text-sm">
                <span className="text-orange-700 font-medium">Belum Lunas / Pending</span>
                <span className="font-bold text-orange-600">{belumLunas} Orang</span>
              </div>
            </div>
          )}

          <button 
            className="w-full py-3 mt-auto flex items-center justify-center font-semibold rounded-xl text-white bg-primary hover:bg-primary-dark shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleSendReminders}
            disabled={loadingData || belumLunas === 0}
          >
            <Send className="w-5 h-5 mr-2" /> Kirim Pengingat Massal ({belumLunas} Orang)
          </button>
        </div>

        <div className="card-container flex h-full min-h-[420px] flex-col bg-gradient-to-br from-white to-gray-50 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Template Pesan Pengingat</h2>
          <div className="relative flex-1 rounded-lg border border-gray-200 bg-white p-4 font-mono text-sm leading-relaxed text-gray-700 shadow-sm">
            <p>Halo bang <span className="text-primary">[Nama Penghuni]</span>! 👋</p>
            <br />
            <p>Sekadar ngingetin nih, ada tagihan kos untuk bulan ini yang belum lunas:</p>
            <p className="text-primary">• [Nama Iuran]: Rp [Nominal] (Jatuh Tempo: [Jatuh Tempo])</p>
            <p>Total Tagihan: <strong>Rp <span className="text-primary">[Total Nominal]</span></strong></p>
            <br />
            <p>Boleh minta tolong diselesaikan pembayarannya dan <i>upload</i> buktinya lewat Portal Penghuni ya bang. Kalo ada kendala atau pertanyaan, kabarin aja!</p>
            <br />
            <p>Makasih banyak kerjasamanya, sehat selalu! 🙏</p>
            <p>— Bendahara Soematra Kost</p>
          </div>
        </div>
      </div>

      {/* Queue Modal */}
      {isQueueOpen && createPortal(
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm"
          onMouseDown={() => setIsQueueOpen(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <BellRing className="w-5 h-5 text-primary" />
                Antrean Kirim Pengingat
              </h2>
              <button 
                onClick={() => setIsQueueOpen(false)} 
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4 max-h-[380px] overflow-y-auto custom-scrollbar">
              {unpaidResidents.map((res) => {
                const isSent = !!sentStatus[res.residentName]
                return (
                  <div key={res.residentName} className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-xl">
                    <div className="min-w-0 flex-1 pr-4">
                      <div className="font-semibold text-gray-900 text-sm truncate">
                        {res.nickname} <span className="text-xs font-normal text-gray-500">(Kamar {res.roomNumber || '-'})</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1.5 space-y-1">
                        {res.bills.map((bill, index) => (
                          <div key={index} className="truncate">
                            • {bill.title} (Rp {new Intl.NumberFormat('id-ID').format(bill.amount)})
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      {isSent ? (
                        <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-lg">
                          <Check className="w-4 h-4" /> Terkirim
                        </div>
                      ) : (
                        <button
                          onClick={() => sendIndividualWA(res)}
                          disabled={sendingStatus[res.residentName]}
                          className="btn-primary py-1.5 px-3 text-xs flex items-center justify-center font-semibold disabled:opacity-50"
                        >
                          {sendingStatus[res.residentName] ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Mengirim...
                            </>
                          ) : (
                            <>
                              <Send className="w-3.5 h-3.5 mr-1.5" /> Kirim WA
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="flex justify-between items-center border-t border-gray-100 bg-gray-50 px-6 py-4">
              <button
                type="button"
                onClick={() => setSentStatus({})}
                className="text-xs font-semibold text-gray-500 hover:text-gray-700 px-3 py-2 hover:bg-gray-200/50 rounded-lg transition-colors"
                disabled={Object.keys(sentStatus).length === 0}
              >
                Reset Status
              </button>
              <button
                type="button"
                onClick={() => setIsQueueOpen(false)}
                className="btn-secondary text-xs px-4 py-2"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

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
