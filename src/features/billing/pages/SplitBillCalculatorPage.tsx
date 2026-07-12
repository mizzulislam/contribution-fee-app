import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import html2canvas from 'html2canvas'
import { 
  Calculator, 
  Users, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  Percent, 
  RotateCcw, 
  Receipt, 
  UserPlus, 
  Sparkles, 
  Tag, 
  Info,
  Sliders,
  MessageSquare,
  Send
} from 'lucide-react'
import { spreadsheetApi } from '@/services/sheets-client'

interface Participant {
  id: string
  name: string
  amount: number // Used in itemized/custom split
  phone?: string
}

interface CustomAdjustment {
  id: string
  name: string
  type: 'charge' | 'discount'
  valueType: 'nominal' | 'percentage'
  value: number
}

export default function SplitBillCalculator() {
  const [searchParams] = useSearchParams()
  const viewMode = searchParams.get('view')
  const rawData = searchParams.get('data')

  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const alertShared = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => {
      setToastMessage(null)
    }, 2500)
  }

  const [activeTab, setActiveTab] = useState<'equal' | 'custom' | 'manage'>('equal')
  const splitMode = activeTab === 'custom' ? 'custom' : 'equal'
  const [billAmount, setBillAmount] = useState<number>(0)
  
  const [taxValue, setTaxValue] = useState<number>(0)
  const [taxValueType, setTaxValueType] = useState<'percentage' | 'nominal'>(() => {
    try {
      return (localStorage.getItem('splitz_tax_value_type') as 'percentage' | 'nominal') || 'percentage'
    } catch (e) {
      return 'percentage'
    }
  })
  
  const [serviceValue, setServiceValue] = useState<number>(0)
  const [serviceValueType, setServiceValueType] = useState<'percentage' | 'nominal'>(() => {
    try {
      return (localStorage.getItem('splitz_service_value_type') as 'percentage' | 'nominal') || 'percentage'
    } catch (e) {
      return 'percentage'
    }
  })
  
  const [discountValue, setDiscountValue] = useState<number>(0)
  const [discountValueType, setDiscountValueType] = useState<'nominal' | 'percentage'>(() => {
    try {
      return (localStorage.getItem('splitz_discount_value_type') as 'nominal' | 'percentage') || 'nominal'
    } catch (e) {
      return 'nominal'
    }
  })

  const [customAdjustments, setCustomAdjustments] = useState<CustomAdjustment[]>(() => {
    try {
      const saved = localStorage.getItem('splitz_custom_adjustments')
      if (saved) {
        const parsed = JSON.parse(saved) as CustomAdjustment[]
        return parsed.map(adj => ({ ...adj, value: 0 }))
      }
      return []
    } catch (e) {
      console.error('Error loading custom adjustments', e)
      return []
    }
  })
  
  const [participants, setParticipants] = useState<Participant[]>([
    { id: '1', name: 'Peserta 1', amount: 0, phone: '' },
    { id: '2', name: 'Peserta 2', amount: 0, phone: '' }
  ])

  const [systemUsers, setSystemUsers] = useState<any[]>([])
  const [copied, setCopied] = useState(false)

  // Load system users on mount
  useEffect(() => {
    async function loadSystemUsers() {
      try {
        const { data } = await spreadsheetApi.get('Users')
        if (data && Array.isArray(data)) {
          setSystemUsers(data)
        }
      } catch (e) {
        console.error('Gagal memuat daftar pengguna sistem:', e)
      }
    }
    loadSystemUsers()
  }, [])

  // Persist toggles and custom adjustments to localStorage with try-catch safety
  useEffect(() => {
    try {
      localStorage.setItem('splitz_tax_value_type', taxValueType)
    } catch (e) {
      console.error(e)
    }
  }, [taxValueType])

  useEffect(() => {
    try {
      localStorage.setItem('splitz_service_value_type', serviceValueType)
    } catch (e) {
      console.error(e)
    }
  }, [serviceValueType])

  useEffect(() => {
    try {
      localStorage.setItem('splitz_discount_value_type', discountValueType)
    } catch (e) {
      console.error(e)
    }
  }, [discountValueType])

  useEffect(() => {
    try {
      localStorage.setItem('splitz_custom_adjustments', JSON.stringify(customAdjustments))
    } catch (e) {
      console.error('Error saving custom adjustments', e)
    }
  }, [customAdjustments])

  // Helper to find system user phone
  const findSystemUserPhone = (name: string) => {
    if (!name) return ''
    const cleanName = name.trim().toLowerCase()
    const found = systemUsers.find(u => {
      const uFullName = (u.full_name || '').trim().toLowerCase()
      const uNickname = (u.nickname || '').trim().toLowerCase()
      return uFullName === cleanName || uNickname === cleanName
    })
    return found ? (found.phone_number || '') : ''
  }

  // Handlers for participants
  const handleAddParticipant = () => {
    const nextId = (participants.length + 1).toString()
    setParticipants([...participants, { id: nextId, name: `Peserta ${nextId}`, amount: 0, phone: '' }])
  }

  const handleRemoveParticipant = (id: string) => {
    if (participants.length <= 1) return
    setParticipants(participants.filter(p => p.id !== id))
  }

  const handleParticipantChange = (id: string, field: 'name' | 'amount' | 'phone', value: string | number) => {
    setParticipants(prev =>
      prev.map(p => {
        if (p.id === id) {
          const updated = {
            ...p,
            [field]: field === 'amount' ? Number(value) : value
          }
          if (field === 'name') {
            const phone = findSystemUserPhone(value as string)
            if (phone) {
              updated.phone = phone
            }
          }
          return updated
        }
        return p
      })
    )
  }

  // Handlers for custom adjustments
  const handleAddCustomAdjustment = () => {
    const newId = Date.now().toString()
    setCustomAdjustments([...customAdjustments, { id: newId, name: '', type: 'charge', valueType: 'nominal', value: 0 }])
  }

  const handleRemoveCustomAdjustment = (id: string) => {
    setCustomAdjustments(customAdjustments.filter(a => a.id !== id))
  }

  const handleCustomAdjustmentChange = (id: string, field: keyof CustomAdjustment, value: any) => {
    setCustomAdjustments(
      customAdjustments.map(a => {
        if (a.id === id) {
          return {
            ...a,
            [field]: value
          }
        }
        return a
      })
    )
  }

  const handleReset = () => {
    setBillAmount(0)
    setTaxValue(0)
    setServiceValue(0)
    setDiscountValue(0)
    // Keep custom adjustment pocket templates but reset values to 0
    setCustomAdjustments(prev => prev.map(adj => ({ ...adj, value: 0 })))
    setParticipants([
      { id: '1', name: 'Peserta 1', amount: 0, phone: '' },
      { id: '2', name: 'Peserta 2', amount: 0, phone: '' }
    ])
    setCopied(false)
  }

  // Calculations
  const numParticipants = participants.length
  
  // Subtotal calculation based on mode
  const rawSubtotal = splitMode === 'equal' ? billAmount : participants.reduce((sum, p) => sum + p.amount, 0)
  
  const taxAmount = taxValueType === 'percentage' ? (rawSubtotal * taxValue) / 100 : taxValue
  const serviceAmount = serviceValueType === 'percentage' ? (rawSubtotal * serviceValue) / 100 : serviceValue
  const discountAmount = discountValueType === 'percentage' ? (rawSubtotal * discountValue) / 100 : discountValue

  const customAdjustmentsTotal = customAdjustments.reduce((sum, adj) => {
    let amount = 0
    if (adj.valueType === 'percentage') {
      amount = (rawSubtotal * adj.value) / 100
    } else {
      amount = adj.value
    }
    return sum + (adj.type === 'charge' ? amount : -amount)
  }, 0)

  const grandTotal = Math.max(0, rawSubtotal + taxAmount + serviceAmount - discountAmount + customAdjustmentsTotal)

  // Compute shares
  const shares = participants.map(p => {
    let personalSubtotal = 0
    if (splitMode === 'equal') {
      personalSubtotal = numParticipants > 0 ? billAmount / numParticipants : 0
    } else {
      personalSubtotal = p.amount
    }

    // Proportional tax, service, discount, and custom adjustments
    const proportion = rawSubtotal > 0 ? personalSubtotal / rawSubtotal : 0
    const personalTax = taxAmount * proportion
    const personalService = serviceAmount * proportion
    const personalDiscount = discountAmount * proportion
    const personalCustom = customAdjustmentsTotal * proportion
    const personalTotal = Math.max(0, personalSubtotal + personalTax + personalService - personalDiscount + personalCustom)

    return {
      ...p,
      subtotal: personalSubtotal,
      tax: personalTax,
      service: personalService,
      discount: personalDiscount,
      custom: personalCustom,
      total: personalTotal
    }
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)
  }

  const cleanPhoneNumber = (phone: string) => {
    if (!phone) return ''
    let cleaned = phone.replace(/[^0-9]/g, '')
    if (cleaned.startsWith('0')) {
      cleaned = '62' + cleaned.substring(1)
    }
    return cleaned
  }

  const handleSendIndividualWhatsApp = (share: any) => {
    const phone = cleanPhoneNumber(share.phone || '')
    let text = `Hi *${share.name}*,\n\n`
    text += `Berikut rincian tagihan Anda untuk *Split Bill - ${splitMode === 'equal' ? 'Bagi Rata' : 'Bagi Kustom'}*:\n`
    text += `-------------------------------------------\n`
    text += `- Belanja Murni: ${formatCurrency(share.subtotal)}\n`
    
    const personalAdjustments = share.total - share.subtotal
    if (personalAdjustments !== 0) {
      text += `- Tambahan (Pajak/Biaya/Diskon): ${personalAdjustments > 0 ? '+' : ''}${formatCurrency(personalAdjustments)}\n`
    }
    
    text += `-------------------------------------------\n`
    text += `*Total yang Harus Dibayar: ${formatCurrency(share.total)}*\n\n`
    text += `Terima kasih! 🙏`

    const url = phone 
      ? `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(text)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`
    
    window.open(url, '_blank')
  }

  const handleSendWhatsAppGeneral = () => {
    const modeLabel = splitMode === 'equal' ? 'Bagi Rata' : 'Bagi Kustom'
    let text = `*⚡ RINGKASAN SPLIT BILL - SPLITZ ⚡*\n`
    text += `Mode: ${modeLabel}\n`
    text += `-------------------------------------------\n`
    text += `Subtotal: ${formatCurrency(rawSubtotal)}\n`
    if (taxValue > 0) {
      const typeSuffix = taxValueType === 'percentage' ? ` (${taxValue}%)` : ''
      text += `Pajak${typeSuffix}: ${formatCurrency(taxAmount)}\n`
    }
    if (serviceValue > 0) {
      const typeSuffix = serviceValueType === 'percentage' ? ` (${serviceValue}%)` : ''
      text += `Biaya Layanan${typeSuffix}: ${formatCurrency(serviceAmount)}\n`
    }
    if (discountValue > 0) {
      const typeSuffix = discountValueType === 'percentage' ? ` (${discountValue}%)` : ''
      text += `Diskon${typeSuffix}: -${formatCurrency(discountAmount)}\n`
    }

    customAdjustments.forEach((adj) => {
      if (adj.value <= 0) return
      let amount = 0
      if (adj.valueType === 'percentage') {
        amount = (rawSubtotal * adj.value) / 100
      } else {
        amount = adj.value
      }
      const isDiscount = adj.type === 'discount'
      const label = adj.name || (isDiscount ? 'Diskon Kustom' : 'Biaya Kustom')
      const valueSuffix = adj.valueType === 'percentage' ? ` (${adj.value}%)` : ''
      text += `${label}${valueSuffix}: ${isDiscount ? '-' : ''}${formatCurrency(amount)}\n`
    })

    text += `*Total Akhir: ${formatCurrency(grandTotal)}*\n`
    text += `-------------------------------------------\n`
    text += `*Rincian Pembayaran per Orang:*\n\n`

    shares.forEach((share, idx) => {
      text += `${idx + 1}. *${share.name}*\n`
      text += `   - Belanja: ${formatCurrency(share.subtotal)}\n`
      
      const totalAdditions = taxAmount + serviceAmount - discountAmount + customAdjustmentsTotal
      if (totalAdditions !== 0) {
        const proportion = rawSubtotal > 0 ? share.subtotal / rawSubtotal : 0
        const personalAdditions = totalAdditions * proportion
        text += `   - Tambahan (Pajak/Layanan/Biaya/Diskon): ${formatCurrency(personalAdditions)}\n`
      }
      text += `   - *Total: ${formatCurrency(share.total)}*\n\n`
    })

    text += `Dihitung menggunakan Aplikasi Splitz.`

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`
    window.open(url, '_blank')
  }

  // Copy result to clipboard
  const handleCopySummary = () => {
    const modeLabel = splitMode === 'equal' ? 'Bagi Rata' : 'Bagi Kustom'
    let text = `*⚡ RINGKASAN SPLIT BILL - SPLITZ ⚡*\n`
    text += `Mode: ${modeLabel}\n`
    text += `-------------------------------------------\n`
    text += `Subtotal: ${formatCurrency(rawSubtotal)}\n`
    if (taxValue > 0) {
      const typeSuffix = taxValueType === 'percentage' ? ` (${taxValue}%)` : ''
      text += `Pajak${typeSuffix}: ${formatCurrency(taxAmount)}\n`
    }
    if (serviceValue > 0) {
      const typeSuffix = serviceValueType === 'percentage' ? ` (${serviceValue}%)` : ''
      text += `Biaya Layanan${typeSuffix}: ${formatCurrency(serviceAmount)}\n`
    }
    if (discountValue > 0) {
      const typeSuffix = discountValueType === 'percentage' ? ` (${discountValue}%)` : ''
      text += `Diskon${typeSuffix}: -${formatCurrency(discountAmount)}\n`
    }

    customAdjustments.forEach((adj) => {
      if (adj.value <= 0) return
      let amount = 0
      if (adj.valueType === 'percentage') {
        amount = (rawSubtotal * adj.value) / 100
      } else {
        amount = adj.value
      }
      const isDiscount = adj.type === 'discount'
      const label = adj.name || (isDiscount ? 'Diskon Kustom' : 'Biaya Kustom')
      const valueSuffix = adj.valueType === 'percentage' ? ` (${adj.value}%)` : ''
      text += `${label}${valueSuffix}: ${isDiscount ? '-' : ''}${formatCurrency(amount)}\n`
    })

    text += `*Total Akhir: ${formatCurrency(grandTotal)}*\n`
    text += `-------------------------------------------\n`
    text += `*Rincian Pembayaran per Orang:*\n\n`

    shares.forEach((share, idx) => {
      text += `${idx + 1}. *${share.name}*\n`
      text += `   - Belanja: ${formatCurrency(share.subtotal)}\n`
      
      const totalAdditions = taxAmount + serviceAmount - discountAmount + customAdjustmentsTotal
      if (totalAdditions !== 0) {
        const proportion = rawSubtotal > 0 ? share.subtotal / rawSubtotal : 0
        const personalAdditions = totalAdditions * proportion
        text += `   - Tambahan (Pajak/Layanan/Biaya/Diskon): ${formatCurrency(personalAdditions)}\n`
      }
      text += `   - *Total: ${formatCurrency(share.total)}*\n\n`
    })

    text += `Dihitung menggunakan Aplikasi Splitz.`

    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const generateShareLink = () => {
    const shareState = {
      b: billAmount,
      t: taxValue,
      tt: taxValueType,
      s: serviceValue,
      st: serviceValueType,
      d: discountValue,
      dt: discountValueType,
      ca: customAdjustments.map(adj => ({ n: adj.name, t: adj.type, vt: adj.valueType, v: adj.value })),
      p: participants.map(p => ({ n: p.name, a: p.amount, ph: p.phone })),
      m: splitMode
    }
    const encoded = btoa(encodeURIComponent(JSON.stringify(shareState)))
    const url = `${window.location.origin}${window.location.pathname}?view=receipt&data=${encoded}`
    return url
  }

  const handleDownloadPNG = async () => {
    const element = document.getElementById('premium-receipt-card')
    if (!element) return
    try {
      const canvas = await html2canvas(element, {
        backgroundColor: '#022c22', // Match the receipt theme
        scale: 2, // High DPI capture
        logging: false,
        useCORS: true,
        ignoreElements: (el) => el.classList.contains('no-export')
      })
      const dataUrl = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.download = `split-bill-receipt-${Date.now()}.png`
      link.href = dataUrl
      link.click()
    } catch (err) {
      console.error('Gagal mengunduh gambar PNG:', err)
      alertShared('Gagal membuat gambar PNG. Silakan coba lagi.')
    }
  }

  let decodedState: any = null
  if (viewMode === 'receipt' && rawData) {
    try {
      decodedState = JSON.parse(decodeURIComponent(atob(rawData)))
    } catch (e) {
      console.error('Failed to decode shared split bill data:', e)
    }
  }

  if (viewMode === 'receipt' && decodedState) {
    const sharedBillAmount = decodedState.b || 0
    const sharedTaxValue = decodedState.t || 0
    const sharedTaxValueType = decodedState.tt || 'percentage'
    const sharedServiceValue = decodedState.s || 0
    const sharedServiceValueType = decodedState.st || 'percentage'
    const sharedDiscountValue = decodedState.d || 0
    const sharedDiscountValueType = decodedState.dt || 'nominal'
    const sharedCustomAdjustments = (decodedState.ca || []).map((adj: any, idx: number) => ({
      id: idx.toString(),
      name: adj.n,
      type: adj.t,
      valueType: adj.vt,
      value: adj.v
    }))
    const sharedParticipants = (decodedState.p || []).map((p: any, idx: number) => ({
      id: idx.toString(),
      name: p.n,
      amount: p.a,
      phone: p.ph
    }))
    const sharedSplitMode = decodedState.m || 'equal'

    // calculations for view-only receipt page
    const numParticipants = sharedParticipants.length
    const rawSubtotal = sharedSplitMode === 'equal' ? sharedBillAmount : sharedParticipants.reduce((sum: number, p: any) => sum + p.amount, 0)
    const taxAmount = sharedTaxValueType === 'percentage' ? (rawSubtotal * sharedTaxValue) / 100 : sharedTaxValue
    const serviceAmount = sharedServiceValueType === 'percentage' ? (rawSubtotal * sharedServiceValue) / 100 : sharedServiceValue
    const discountAmount = sharedDiscountValueType === 'percentage' ? (rawSubtotal * sharedDiscountValue) / 100 : sharedDiscountValue

    const customAdjustmentsTotal = sharedCustomAdjustments.reduce((sum: number, adj: any) => {
      let amount = 0
      if (adj.valueType === 'percentage') {
        amount = (rawSubtotal * adj.value) / 100
      } else {
        amount = adj.value
      }
      return sum + (adj.type === 'charge' ? amount : -amount)
    }, 0)

    const grandTotal = Math.max(0, rawSubtotal + taxAmount + serviceAmount - discountAmount + customAdjustmentsTotal)

    const shares = sharedParticipants.map((p: any) => {
      let personalSubtotal = 0
      if (sharedSplitMode === 'equal') {
        personalSubtotal = numParticipants > 0 ? sharedBillAmount / numParticipants : 0
      } else {
        personalSubtotal = p.amount
      }
      const proportion = rawSubtotal > 0 ? personalSubtotal / rawSubtotal : 0
      const personalTax = taxAmount * proportion
      const personalService = serviceAmount * proportion
      const personalDiscount = discountAmount * proportion
      const personalCustom = customAdjustmentsTotal * proportion
      const personalTotal = Math.max(0, personalSubtotal + personalTax + personalService - personalDiscount + personalCustom)

      return {
        ...p,
        subtotal: personalSubtotal,
        tax: personalTax,
        service: personalService,
        discount: personalDiscount,
        custom: personalCustom,
        total: personalTotal
      }
    })

    return (
      <div className="max-w-2xl mx-auto py-8 px-4 animate-in fade-in duration-300">
        {toastMessage && (
          <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] bg-gray-900 text-white text-xs font-extrabold px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 animate-in slide-in-from-top-4 duration-300">
            <Check className="w-4 h-4 text-emerald-400" />
            {toastMessage}
          </div>
        )}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-950 flex items-center gap-2">
            <Calculator className="w-6 h-6 text-emerald-600" />
            Detail Perhitungan Split Bill
          </h1>
          <button
            onClick={() => window.location.href = window.location.pathname}
            className="text-xs sm:text-sm font-bold text-emerald-600 hover:text-white hover:bg-emerald-600 bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-sm active:scale-95"
          >
            Buat Kalkulasi Baru
          </button>
        </div>

        {/* Premium Receipt Card (Rendered Read-Only) */}
        <div id="premium-receipt-card" className="bg-gradient-to-b from-emerald-950 via-[#064e3b] to-[#042f2c] rounded-[24px] text-white shadow-[0_20px_50px_rgba(4,120,87,0.12)] border border-emerald-800/40 relative overflow-hidden flex flex-col p-6 space-y-6">
          <div className="absolute right-[-40px] top-[-40px] h-36 w-36 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute left-[-20px] bottom-[-20px] h-36 w-36 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex justify-between items-center border-b border-white/10 pb-4">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base sm:text-lg font-extrabold tracking-wide text-white">Ringkasan Pembagian</h2>
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider bg-white/10 px-2.5 py-1 rounded-md text-emerald-300 border border-white/5">
              {sharedSplitMode === 'equal' ? 'Bagi Rata' : 'Bagi Kustom'}
            </span>
          </div>

          <div className="space-y-3.5 text-sm">
            <div className="flex justify-between items-center text-emerald-200/80">
              <span className="font-medium">Subtotal Belanja</span>
              <span className="font-bold text-white text-base">{formatCurrency(rawSubtotal)}</span>
            </div>

            {sharedTaxValue > 0 && (
              <div className="flex justify-between items-center text-emerald-200/80">
                <span className="flex items-center gap-1">
                  <Percent className="w-3.5 h-3.5 text-emerald-400" /> 
                  Pajak (Tax {sharedTaxValueType === 'percentage' ? `${sharedTaxValue}%` : ''})
                </span>
                <span className="font-bold text-white">+{formatCurrency(taxAmount)}</span>
              </div>
            )}

            {sharedServiceValue > 0 && (
              <div className="flex justify-between items-center text-emerald-200/80">
                <span className="flex items-center gap-1">
                  <Percent className="w-3.5 h-3.5 text-emerald-400" /> 
                  Layanan (Service {sharedServiceValueType === 'percentage' ? `${sharedServiceValue}%` : ''})
                </span>
                <span className="font-bold text-white">+{formatCurrency(serviceAmount)}</span>
              </div>
            )}

            {sharedDiscountValue > 0 && (
              <div className="flex justify-between items-center text-emerald-200/80">
                <span className="flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-amber-400" /> 
                  Diskon (Discount {sharedDiscountValueType === 'percentage' ? `${sharedDiscountValue}%` : ''})
                </span>
                <span className="font-bold text-amber-400">-{formatCurrency(discountAmount)}</span>
              </div>
            )}

            {sharedCustomAdjustments.map((adj: any) => {
              if (adj.value <= 0) return null
              let amount = 0
              if (adj.valueType === 'percentage') {
                amount = (rawSubtotal * adj.value) / 100
              } else {
                amount = adj.value
              }
              const isDiscount = adj.type === 'discount'
              return (
                <div key={adj.id} className="flex justify-between items-center text-emerald-200/80">
                  <span className="flex items-center gap-1">
                    {isDiscount ? (
                      <Tag className="w-3.5 h-3.5 text-amber-400" />
                    ) : (
                      <Receipt className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                    {adj.name || (isDiscount ? 'Diskon Kustom' : 'Biaya Kustom')} 
                    {adj.valueType === 'percentage' && ` (${adj.value}%)`}
                  </span>
                  <span className={`font-bold ${isDiscount ? 'text-amber-400' : 'text-white'}`}>
                    {isDiscount ? '-' : '+'}{formatCurrency(amount)}
                  </span>
                </div>
              )
            })}

            <div className="flex justify-between items-baseline border-t border-white/10 pt-4">
              <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">Total Akhir</span>
              <span className="text-3xl font-black tracking-tight bg-gradient-to-r from-white via-emerald-100 to-teal-200 bg-clip-text text-transparent">
                {formatCurrency(grandTotal)}
              </span>
            </div>
          </div>

          <div className="relative my-1 flex items-center justify-between gap-1.5 overflow-hidden opacity-20 select-none">
            {Array.from({ length: 30 }).map((_, i) => (
              <div key={i} className="w-1.5 h-1.5 bg-white rounded-full shrink-0" />
            ))}
          </div>

          <div className="flex-1 flex flex-col space-y-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 block">Rincian Pembayaran:</span>
            <div className="space-y-2.5">
              {shares.map((share: any) => (
                <div key={share.id} className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                  <div className="min-w-0 pr-3 flex-grow">
                    <p className="font-extrabold text-xs sm:text-sm text-white flex items-center gap-1.5">
                      {share.name}
                      {share.phone && (
                        <span className="text-[9px] text-emerald-300 font-bold bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">
                          {share.phone}
                        </span>
                      )}
                    </p>
                    <p className="text-[10px] text-emerald-300/70 mt-0.5">
                      Murni: {formatCurrency(share.subtotal)} 
                      {sharedTaxValue > 0 || sharedServiceValue > 0 || sharedDiscountValue > 0 || customAdjustmentsTotal !== 0 ? ' + Penyesuaian' : ''}
                    </p>
                  </div>
                  <span className="font-black text-xs sm:text-base text-emerald-300">{formatCurrency(share.total)}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-emerald-950/40 backdrop-blur-sm p-3 rounded-xl border border-white/5 flex items-start gap-2.5 text-[10.5px] text-emerald-200/90 leading-relaxed no-export">
            <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p>Pajak, biaya layanan, dan diskon dialokasikan secara proporsional sesuai porsi belanja masing-masing peserta.</p>
          </div>

          {/* Download button for shared page */}
          <div className="no-export pt-2">
            <button
              onClick={handleDownloadPNG}
              className="w-full py-3 rounded-xl font-extrabold text-xs tracking-wide shadow-lg transition-all duration-300 flex items-center justify-center gap-2 active:scale-98 cursor-pointer bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white border border-emerald-400/20 hover:shadow-emerald-500/10 shadow-xl"
            >
              Unduh Gambar (PNG)
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 w-full animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-white to-gray-50/50 p-6 rounded-2xl border border-gray-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-2.5 rounded-xl text-white shadow-md shadow-emerald-500/10">
              <Calculator className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            Kalkulator Split Bill
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1.5 pl-0.5">
            Sistem Cerdas untuk membagi tagihan secara adil, baik dibagi rata maupun proporsional.
          </p>
        </div>
        <button 
          onClick={handleReset}
          className="group bg-white hover:bg-gray-50 text-gray-700 hover:text-emerald-600 border border-gray-200 hover:border-emerald-200 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all self-start sm:self-auto cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5 transition-transform duration-500 group-hover:rotate-180" /> Reset
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: Form Inputs */}
        <div className="lg:col-span-7 flex flex-col">
          <div className="bg-white border border-gray-200 shadow-[0_8px_30px_rgb(0,0,0,0.03)] rounded-2xl flex flex-col h-full overflow-hidden">
            {/* Mode Switch Tabs (Segmented Control) */}
            <div className="bg-gray-50/70 p-2 border-b border-gray-150 flex gap-2.5 overflow-x-auto [&::-webkit-scrollbar]:hidden">
              <button
                type="button"
                className={`flex-grow py-3 px-4 rounded-xl font-extrabold text-xs sm:text-sm transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap ${
                  activeTab === 'equal'
                    ? 'bg-white text-emerald-600 shadow-sm border border-emerald-100/50'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-white/40'
                }`}
                onClick={() => setActiveTab('equal')}
              >
                <Users className={`w-4 h-4 shrink-0 ${activeTab === 'equal' ? 'text-emerald-500' : 'text-gray-400'}`} /> Bagi Rata
              </button>
              <button
                type="button"
                className={`flex-grow py-3 px-4 rounded-xl font-extrabold text-xs sm:text-sm transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap ${
                  activeTab === 'custom'
                    ? 'bg-white text-emerald-600 shadow-sm border border-emerald-100/50'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-white/40'
                }`}
                onClick={() => setActiveTab('custom')}
              >
                <Sparkles className={`w-4 h-4 shrink-0 ${activeTab === 'custom' ? 'text-emerald-500' : 'text-gray-400'}`} /> Bagi Kustom
              </button>
              <button
                type="button"
                className={`flex-grow py-3 px-4 rounded-xl font-extrabold text-xs sm:text-sm transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap ${
                  activeTab === 'manage'
                    ? 'bg-white text-emerald-600 shadow-sm border border-emerald-100/50'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-white/40'
                }`}
                onClick={() => setActiveTab('manage')}
              >
                <Sliders className={`w-4 h-4 shrink-0 ${activeTab === 'manage' ? 'text-emerald-500' : 'text-gray-400'}`} /> Atur Penyesuaian
              </button>
            </div>

            <div className="p-6 flex flex-col flex-1 space-y-6">
              {activeTab === 'manage' ? (
                /* Manage Pockets View */
                <div className="space-y-4 flex flex-col flex-1">
                  <div>
                    <h3 className="text-sm font-extrabold text-gray-700 flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-emerald-500" />
                      Daftar Penyesuaian Kustom
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">
                      Penyesuaian yang Anda buat di sini akan muncul sebagai field input tambahan pada tab Bagi Rata dan Bagi Kustom.
                    </p>
                  </div>

                  <div className="space-y-3 flex-grow overflow-y-auto pr-1 max-h-[360px] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#E5E7EB] [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-emerald-300">
                    {customAdjustments.map((adj, idx) => (
                      <div key={adj.id} className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3 rounded-xl border border-gray-200 shadow-sm hover:border-emerald-300/40 transition-all duration-200 animate-in fade-in duration-200">
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50/60 w-7 h-7 flex items-center justify-center rounded-lg border border-emerald-100/30 shrink-0 select-none">
                          {idx + 1}
                        </span>
                        
                        {/* Name Input */}
                        <input
                          type="text"
                          className="bg-gray-50/50 border border-gray-200 hover:border-gray-300 focus:border-emerald-500 focus:bg-white rounded-lg px-3 py-2 text-xs sm:text-sm font-semibold text-gray-800 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/10 flex-1 min-w-[120px]"
                          placeholder="Nama penyesuaian (misal: Ongkir)..."
                          value={adj.name}
                          onChange={e => handleCustomAdjustmentChange(adj.id, 'name', e.target.value)}
                        />
                        
                        {/* Type Toggle: Charge / Discount */}
                        <div className="flex bg-gray-100 p-0.5 rounded-lg shrink-0">
                          <button
                            type="button"
                            onClick={() => handleCustomAdjustmentChange(adj.id, 'type', 'charge')}
                            className={`px-2.5 py-1.5 rounded-md text-[10px] sm:text-xs font-bold transition-all cursor-pointer ${
                              adj.type === 'charge'
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                          >
                            Biaya (+)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCustomAdjustmentChange(adj.id, 'type', 'discount')}
                            className={`px-2.5 py-1.5 rounded-md text-[10px] sm:text-xs font-bold transition-all cursor-pointer ${
                              adj.type === 'discount'
                                ? 'bg-amber-600 text-white shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                          >
                            Diskon (-)
                          </button>
                        </div>

                        {/* Value Type Toggle: Nominal / Percentage */}
                        <div className="flex bg-gray-100 p-0.5 rounded-lg shrink-0">
                          <button
                            type="button"
                            onClick={() => handleCustomAdjustmentChange(adj.id, 'valueType', 'nominal')}
                            className={`px-2.5 py-1.5 rounded-md text-[10px] sm:text-xs font-bold transition-all cursor-pointer ${
                              adj.valueType === 'nominal'
                                ? 'bg-white text-gray-800 shadow-sm border border-gray-150'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                          >
                            Rp
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCustomAdjustmentChange(adj.id, 'valueType', 'percentage')}
                            className={`px-2.5 py-1.5 rounded-md text-[10px] sm:text-xs font-bold transition-all cursor-pointer ${
                              adj.valueType === 'percentage'
                                ? 'bg-white text-gray-800 shadow-sm border border-gray-150'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                          >
                            %
                          </button>
                        </div>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => handleRemoveCustomAdjustment(adj.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all border border-transparent hover:border-red-100 cursor-pointer shrink-0"
                          title="Hapus penyesuaian"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}

                    {customAdjustments.length === 0 && (
                      <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 text-xs">
                        Belum ada penyesuaian tambahan. Klik tombol di bawah untuk membuat penyesuaian baru.
                      </div>
                    )}
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleAddCustomAdjustment}
                      className="group w-full text-xs font-bold text-emerald-600 hover:text-white bg-emerald-50 hover:bg-emerald-500 transition-all py-3 rounded-xl border border-emerald-250 flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer shadow-sm"
                    >
                      <Plus className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" />
                      Tambah Penyesuaian Baru
                    </button>
                  </div>
                </div>
              ) : (
                /* Main Split Bill Inputs View */
                <>
                  {/* Billing Input (Equal Split only) */}
                  {splitMode === 'equal' && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                      <label className="block text-xs font-extrabold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Receipt className="w-3.5 h-3.5 text-emerald-500" />
                        Total Tagihan (Subtotal)
                      </label>
                      <div className="relative flex items-center">
                        <div className="absolute left-4 text-emerald-600 font-extrabold text-lg select-none">
                          Rp
                        </div>
                        <input
                          type="number"
                          className="bg-gray-50/50 border border-gray-200 hover:border-gray-300 focus:border-emerald-500 focus:bg-white rounded-xl pl-12 pr-4 h-14 w-full text-lg font-bold text-gray-800 placeholder:font-medium placeholder-gray-300 transition-all focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
                          placeholder="Masukkan nominal tagihan utama..."
                          value={billAmount || ''}
                          onChange={e => setBillAmount(Number(e.target.value))}
                        />
                      </div>
                    </div>
                  )}

                  {/* Adjustments Section */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="block text-xs font-extrabold text-gray-400 uppercase tracking-wider">Tambahan & Penyesuaian</span>
                      <button
                        type="button"
                        onClick={() => setActiveTab('manage')}
                        className="text-[10px] font-extrabold text-emerald-600 hover:text-white hover:bg-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-250 flex items-center gap-1 transition-all duration-300 cursor-pointer shadow-sm active:scale-95"
                        title="Klik untuk menambah atau mengedit field biaya/diskon baru"
                      >
                        <Sliders className="w-3 h-3 text-emerald-500 group-hover:text-white" />
                        Atur Penyesuaian
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-gray-50/40 p-3 rounded-2xl border border-gray-150">
                      {/* Tax */}
                      <div className="relative bg-white border border-gray-200 rounded-xl p-2.5 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all flex flex-col justify-between min-h-[76px]">
                        <div className="flex justify-between items-center w-full">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1">
                            <Percent className="w-3 h-3 text-emerald-500" /> Pajak (Tax)
                          </span>
                          <button
                            type="button"
                            onClick={() => setTaxValueType(taxValueType === 'percentage' ? 'nominal' : 'percentage')}
                            className="text-[10px] font-extrabold text-emerald-600 hover:text-white hover:bg-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/20 transition-all select-none cursor-pointer"
                          >
                            {taxValueType === 'percentage' ? '%' : 'Rp'}
                          </button>
                        </div>
                        <div className="relative mt-1 flex items-center">
                          {taxValueType === 'nominal' && (
                            <span className="text-gray-400 font-bold text-xs mr-1 select-none">Rp</span>
                          )}
                          <input
                            type="number"
                            className="w-full text-sm font-bold text-gray-800 bg-transparent border-0 p-0 focus:ring-0 focus:outline-none placeholder-gray-300"
                            placeholder="0"
                            value={taxValue || ''}
                            onChange={e => setTaxValue(Math.max(0, Number(e.target.value)))}
                          />
                          {taxValueType === 'percentage' && (
                            <span className="text-gray-400 font-bold text-xs ml-1 select-none">%</span>
                          )}
                        </div>
                      </div>

                      {/* Service Charge */}
                      <div className="relative bg-white border border-gray-200 rounded-xl p-2.5 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all flex flex-col justify-between min-h-[76px]">
                        <div className="flex justify-between items-center w-full">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1">
                            <Percent className="w-3 h-3 text-emerald-500" /> Layanan (Service)
                          </span>
                          <button
                            type="button"
                            onClick={() => setServiceValueType(serviceValueType === 'percentage' ? 'nominal' : 'percentage')}
                            className="text-[10px] font-extrabold text-emerald-600 hover:text-white hover:bg-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/20 transition-all select-none cursor-pointer"
                          >
                            {serviceValueType === 'percentage' ? '%' : 'Rp'}
                          </button>
                        </div>
                        <div className="relative mt-1 flex items-center">
                          {serviceValueType === 'nominal' && (
                            <span className="text-gray-400 font-bold text-xs mr-1 select-none">Rp</span>
                          )}
                          <input
                            type="number"
                            className="w-full text-sm font-bold text-gray-800 bg-transparent border-0 p-0 focus:ring-0 focus:outline-none placeholder-gray-300"
                            placeholder="0"
                            value={serviceValue || ''}
                            onChange={e => setServiceValue(Math.max(0, Number(e.target.value)))}
                          />
                          {serviceValueType === 'percentage' && (
                            <span className="text-gray-400 font-bold text-xs ml-1 select-none">%</span>
                          )}
                        </div>
                      </div>

                      {/* Discount */}
                      <div className="relative bg-white border border-gray-200 rounded-xl p-2.5 focus-within:border-amber-500 focus-within:ring-4 focus-within:ring-amber-500/10 transition-all flex flex-col justify-between min-h-[76px]">
                        <div className="flex justify-between items-center w-full">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1">
                            <Tag className="w-3 h-3 text-amber-500" /> Diskon (Discount)
                          </span>
                          <button
                            type="button"
                            onClick={() => setDiscountValueType(discountValueType === 'nominal' ? 'percentage' : 'nominal')}
                            className="text-[10px] font-extrabold text-amber-600 hover:text-white hover:bg-amber-500 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/20 transition-all select-none cursor-pointer"
                          >
                            {discountValueType === 'nominal' ? 'Rp' : '%'}
                          </button>
                        </div>
                        <div className="relative mt-1 flex items-center">
                          {discountValueType === 'nominal' && (
                            <span className="text-gray-400 font-bold text-xs mr-1 select-none">Rp</span>
                          )}
                          <input
                            type="number"
                            className="w-full text-sm font-bold text-gray-800 bg-transparent border-0 p-0 focus:ring-0 focus:outline-none placeholder-gray-300"
                            placeholder="0"
                            value={discountValue || ''}
                            onChange={e => setDiscountValue(Math.max(0, Number(e.target.value)))}
                          />
                          {discountValueType === 'percentage' && (
                            <span className="text-gray-400 font-bold text-xs ml-1 select-none">%</span>
                          )}
                        </div>
                      </div>

                      {/* Custom Pockets */}
                      {customAdjustments.map((adj) => {
                        const isDiscount = adj.type === 'discount'
                        const ringColor = isDiscount ? 'focus-within:border-amber-500 focus-within:ring-amber-500/10' : 'focus-within:border-emerald-500 focus-within:ring-emerald-500/10'
                        return (
                          <div key={adj.id} className={`relative bg-white border border-gray-200 rounded-xl p-2.5 focus-within:border transition-all flex flex-col justify-between min-h-[76px] ${ringColor} hover:border-gray-300`}>
                            <div className="flex justify-between items-center w-full">
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1 truncate max-w-[80%]" title={adj.name}>
                                {isDiscount ? (
                                  <Tag className="w-3 h-3 text-amber-500 shrink-0" />
                                ) : (
                                  <Receipt className="w-3 h-3 text-emerald-500 shrink-0" />
                                )} 
                                {adj.name || (isDiscount ? 'Diskon Kustom' : 'Biaya Kustom')}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCustomAdjustmentChange(adj.id, 'valueType', adj.valueType === 'percentage' ? 'nominal' : 'percentage')}
                                className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded border transition-all select-none cursor-pointer ${
                                  isDiscount 
                                    ? 'text-amber-600 hover:text-white hover:bg-amber-500 bg-amber-50 border-amber-200/20' 
                                    : 'text-emerald-600 hover:text-white hover:bg-emerald-500 bg-emerald-50 border-emerald-200/20'
                                }`}
                              >
                                {adj.valueType === 'percentage' ? '%' : 'Rp'}
                              </button>
                            </div>
                            <div className="relative mt-1 flex items-center">
                              {adj.valueType === 'nominal' && (
                                <span className="text-gray-400 font-bold text-xs mr-1 select-none">Rp</span>
                              )}
                              <input
                                type="number"
                                className="w-full text-sm font-bold text-gray-800 bg-transparent border-0 p-0 focus:ring-0 focus:outline-none placeholder-gray-300"
                                placeholder="0"
                                value={adj.value || ''}
                                onChange={e => handleCustomAdjustmentChange(adj.id, 'value', Math.max(0, Number(e.target.value)))}
                              />
                              {adj.valueType === 'percentage' && (
                                <span className="text-gray-400 font-bold text-xs ml-1 select-none">%</span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Participants Section */}
                  <div className="space-y-4 pt-2 flex flex-col flex-1">
                    <div className="flex justify-between items-center border-b pb-3 border-gray-150">
                      <h3 className="text-sm font-extrabold text-gray-700 flex items-center gap-2">
                        <Users className="w-4 h-4 text-emerald-500" /> 
                        Daftar Peserta
                        <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-lg border border-emerald-100 font-bold ml-1">
                          {numParticipants} Orang
                        </span>
                      </h3>
                      <button
                        type="button"
                        onClick={handleAddParticipant}
                        className="group text-xs font-bold text-emerald-600 hover:text-white bg-emerald-50 hover:bg-emerald-500 transition-all px-3.5 py-2 rounded-xl border border-emerald-200/50 flex items-center gap-1.5 active:scale-95 cursor-pointer"
                      >
                        <UserPlus className="w-3.5 h-3.5 transition-transform duration-300 group-hover:scale-110" /> Tambah Peserta
                      </button>
                    </div>

                    {/* Participant Row List */}
                    <div className="space-y-2.5 flex-grow overflow-y-auto pr-1 max-h-[300px] lg:max-h-[340px] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#E5E7EB] [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-emerald-300">
                      {participants.map((p, idx) => (
                        <div key={p.id} className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-gray-200 hover:border-emerald-200 hover:shadow-[0_4px_16px_rgba(16,185,129,0.03)] transition-all">
                          {/* Badge Index */}
                          <span className="text-xs font-bold text-emerald-600 bg-emerald-50/60 w-7 h-7 flex items-center justify-center rounded-lg border border-emerald-100/30 shrink-0">
                            {idx + 1}
                          </span>
                          
                          {/* Name input */}
                          <input
                            type="text"
                            className="bg-gray-50/50 border border-gray-200 hover:border-gray-300 focus:border-emerald-500 focus:bg-white rounded-lg px-3 py-2 text-xs sm:text-sm font-semibold text-gray-800 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/10 flex-1"
                            placeholder="Nama Peserta..."
                            value={p.name}
                            onChange={e => handleParticipantChange(p.id, 'name', e.target.value)}
                          />

                          {/* WhatsApp / Phone input */}
                          <div className="relative bg-gray-50/50 border border-gray-200 hover:border-gray-300 focus-within:border-emerald-500 focus-within:bg-white transition-all rounded-lg px-2 py-1.5 flex items-center w-28 sm:w-36 shrink-0">
                            <span className="text-gray-400 font-bold text-[10px] sm:text-[11px] mr-1 select-none">WA:</span>
                            <input
                              type="text"
                              className="w-full text-xs sm:text-sm font-semibold text-gray-850 bg-transparent border-0 p-0 focus:ring-0 focus:outline-none placeholder-gray-300"
                              placeholder="No. Telp..."
                              value={p.phone || ''}
                              onChange={e => handleParticipantChange(p.id, 'phone', e.target.value)}
                            />
                          </div>

                          {/* Spent Amount input (Custom Split only) */}
                          {splitMode === 'custom' && (
                            <div className="relative bg-gray-50/50 border border-gray-200 hover:border-gray-300 focus-within:border-emerald-500 focus-within:bg-white transition-all rounded-lg px-2.5 py-2 flex items-center w-36 sm:w-44 shrink-0">
                              <span className="text-gray-400 font-bold text-xs mr-1">Rp</span>
                              <input
                                type="number"
                                className="w-full text-xs sm:text-sm font-semibold text-gray-800 bg-transparent border-0 p-0 text-right focus:ring-0 focus:outline-none placeholder-gray-300"
                                placeholder="Nominal..."
                                value={p.amount || ''}
                                onChange={e => handleParticipantChange(p.id, 'amount', e.target.value)}
                              />
                            </div>
                          )}

                          {/* Delete button */}
                          <button
                            type="button"
                            disabled={participants.length <= 1}
                            onClick={() => handleRemoveParticipant(p.id)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all border border-transparent hover:border-red-100 disabled:opacity-20 cursor-pointer shrink-0"
                            title="Hapus peserta"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
             {/* Right Column: Premium Receipt Card */}
        <div className="lg:col-span-5 flex flex-col">
          <div id="premium-receipt-card" className="bg-gradient-to-b from-emerald-950 via-[#064e3b] to-[#042f2c] rounded-[24px] text-white shadow-[0_20px_50px_rgba(4,120,87,0.12)] border border-emerald-800/40 relative overflow-hidden flex flex-col h-full">
            {/* Background blur patterns */}
            <div className="absolute right-[-40px] top-[-40px] h-36 w-36 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute left-[-20px] bottom-[-20px] h-36 w-36 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
            
            {/* Card Title Header (aligned with left tab bar) */}
            <div className="h-[60px] flex justify-between items-center px-6 border-b border-white/10 shrink-0 bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-400" />
                <h2 className="text-base sm:text-lg font-extrabold tracking-wide text-white">
                  Ringkasan Pembagian
                </h2>
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider bg-white/10 px-2.5 py-1 rounded-md text-emerald-300 border border-white/5">
                {splitMode === 'equal' ? 'Bagi Rata' : 'Bagi Kustom'}
              </span>
            </div>

            <div className="p-6 space-y-6 flex-1 flex flex-col">
              {/* Calculations List */}
              <div className="space-y-3.5 text-sm">
                <div className="flex justify-between items-center text-emerald-200/80">
                  <span className="font-medium">Subtotal Belanja</span>
                  <span className="font-bold text-white text-base">{formatCurrency(rawSubtotal)}</span>
                </div>

                {taxValue > 0 && (
                  <div className="flex justify-between items-center text-emerald-200/80">
                    <span className="flex items-center gap-1">
                      <Percent className="w-3.5 h-3.5 text-emerald-400" /> 
                      Pajak (Tax {taxValueType === 'percentage' ? `${taxValue}%` : ''})
                    </span>
                    <span className="font-bold text-white">+{formatCurrency(taxAmount)}</span>
                  </div>
                )}

                {serviceValue > 0 && (
                  <div className="flex justify-between items-center text-emerald-200/80">
                    <span className="flex items-center gap-1">
                      <Percent className="w-3.5 h-3.5 text-emerald-400" /> 
                      Layanan (Service {serviceValueType === 'percentage' ? `${serviceValue}%` : ''})
                    </span>
                    <span className="font-bold text-white">+{formatCurrency(serviceAmount)}</span>
                  </div>
                )}

                {discountValue > 0 && (
                  <div className="flex justify-between items-center text-emerald-200/80">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5 text-amber-400" /> 
                      Diskon (Discount {discountValueType === 'percentage' ? `${discountValue}%` : ''})
                    </span>
                    <span className="font-bold text-amber-400">-{formatCurrency(discountAmount)}</span>
                  </div>
                )}

                {customAdjustments.map((adj) => {
                  if (adj.value <= 0) return null
                  let amount = 0
                  if (adj.valueType === 'percentage') {
                    amount = (rawSubtotal * adj.value) / 100
                  } else {
                    amount = adj.value
                  }
                  const isDiscount = adj.type === 'discount'
                  return (
                    <div key={adj.id} className="flex justify-between items-center text-emerald-200/80 animate-in fade-in duration-200">
                      <span className="flex items-center gap-1">
                        {isDiscount ? (
                          <Tag className="w-3.5 h-3.5 text-amber-400" />
                        ) : (
                          <Receipt className="w-3.5 h-3.5 text-emerald-400" />
                        )}
                        {adj.name || (isDiscount ? 'Diskon Kustom' : 'Biaya Kustom')} 
                        {adj.valueType === 'percentage' && ` (${adj.value}%)`}
                      </span>
                      <span className={`font-bold ${isDiscount ? 'text-amber-400' : 'text-white'}`}>
                        {isDiscount ? '-' : '+'}{formatCurrency(amount)}
                      </span>
                    </div>
                  )
                })}

                {/* Total Display */}
                <div className="flex justify-between items-baseline border-t border-white/10 pt-4">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">Total Akhir</span>
                  <span className="text-3xl font-black tracking-tight bg-gradient-to-r from-white via-emerald-100 to-teal-200 bg-clip-text text-transparent">
                    {formatCurrency(grandTotal)}
                  </span>
                </div>
              </div>

              {/* Serrated Border Separator */}
              <div className="relative my-1 flex items-center justify-between gap-1.5 overflow-hidden opacity-20 select-none pointer-events-none">
                {Array.from({ length: 30 }).map((_, i) => (
                  <div key={i} className="w-1.5 h-1.5 bg-white rounded-full shrink-0" />
                ))}
              </div>

              {/* Shares Detail list */}
              <div className="flex-1 flex flex-col space-y-3 min-h-[220px]">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 block">Rincian Pembayaran:</span>
                
                <div className="flex-1 space-y-2.5 overflow-y-auto pr-1 max-h-[250px] lg:max-h-[300px] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/20">
                  {shares.length === 0 ? (
                    <div className="text-center text-xs text-emerald-300/60 py-8 flex flex-col items-center gap-2">
                      <Users className="w-8 h-8 opacity-30" />
                      Belum ada peserta terdaftar.
                    </div>
                  ) : (
                    shares.map(share => (
                      <div key={share.id} className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5 hover:bg-white/[0.08] hover:border-white/10 transition-all duration-200 animate-in fade-in duration-300">
                        <div className="min-w-0 pr-3 flex-grow">
                          <p className="font-extrabold text-xs sm:text-sm truncate text-white flex items-center gap-1.5">
                            {share.name}
                            {share.phone && (
                              <span className="text-[9px] text-emerald-300 font-bold bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">
                                {share.phone}
                              </span>
                            )}
                          </p>
                          <p className="text-[10px] text-emerald-300/70 mt-0.5">
                            Murni: {formatCurrency(share.subtotal)} 
                            {taxValue > 0 || serviceValue > 0 || discountValue > 0 || customAdjustmentsTotal !== 0 ? ' + Penyesuaian' : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-black text-xs sm:text-base text-emerald-300 text-right">{formatCurrency(share.total)}</span>
                          <button
                            type="button"
                            onClick={() => handleSendIndividualWhatsApp(share)}
                            className="p-1.5 text-emerald-400 hover:text-white hover:bg-emerald-500 rounded-lg transition-all border border-emerald-800/40 hover:border-emerald-500 cursor-pointer flex items-center justify-center no-export"
                            title={`Kirim WA personal ke ${share.name}`}
                          >
                            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.46h.005c6.56 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Info Message */}
              <div className="bg-emerald-950/40 backdrop-blur-sm p-3 rounded-xl border border-white/5 flex items-start gap-2.5 text-[10.5px] text-emerald-200/90 leading-relaxed shadow-inner no-export">
                <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p>Pajak, biaya layanan, dan diskon dialokasikan secara proporsional sesuai porsi belanja masing-masing peserta.</p>
              </div>

              {/* Actions button */}
              <div className="flex flex-col sm:flex-row gap-2 no-export">
                <button
                  type="button"
                  onClick={handleCopySummary}
                  className={`flex-grow py-3 rounded-xl font-extrabold text-xs tracking-wide shadow-md transition-all duration-300 flex items-center justify-center gap-2 active:scale-98 cursor-pointer ${
                    copied
                      ? 'bg-white text-emerald-950 shadow-emerald-950/20'
                      : 'bg-emerald-900 hover:bg-emerald-800 text-white border border-emerald-700/40'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 animate-bounce" /> Belhasil Disalin!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" /> Salin Ringkasan
                    </>
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(true)}
                  className="flex-grow py-3 rounded-xl font-extrabold text-xs tracking-wide shadow-lg transition-all duration-300 flex items-center justify-center gap-2 active:scale-98 cursor-pointer bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white border border-emerald-400/20 hover:shadow-emerald-500/10 shadow-xl"
                >
                  <Send className="w-4 h-4" /> Bagikan
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Share Modal Dialog */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-gray-150 rounded-2xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-extrabold text-gray-900 mb-4 flex items-center gap-2">
              <Send className="w-5 h-5 text-emerald-600" />
              Bagikan Hasil Perhitungan
            </h3>
            
            <p className="text-xs text-gray-500 mb-5">
              Pilih saluran untuk membagikan ringkasan tagihan atau simpan sebagai gambar PNG.
            </p>

            <div className="space-y-4">
              {/* Section 1: Saluran Berbagi */}
              <div className="space-y-2.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">Saluran Berbagi</span>
                
                <button
                  onClick={() => {
                    handleSendWhatsAppGeneral()
                    setIsShareModalOpen(false)
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:border-emerald-500 hover:bg-emerald-50/20 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-105 transition-all">
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.46h.005c6.56 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold text-gray-800">WhatsApp</p>
                      <p className="text-[10px] text-gray-400">Bagikan seluruh rincian langsung ke chat WA</p>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-emerald-600 opacity-0 group-hover:opacity-100 transition-all mr-2">Buka &rarr;</span>
                </button>

                {/* Copy Link Button */}
                <button
                  onClick={() => {
                    const link = generateShareLink()
                    navigator.clipboard.writeText(link)
                    setIsShareModalOpen(false)
                    alertShared('Link interaktif berhasil disalin!')
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:border-emerald-500 hover:bg-emerald-50/20 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-105 transition-all">
                      <svg className="w-4 h-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold text-gray-800">Salin Link Hasil</p>
                      <p className="text-[10px] text-gray-400">Link interaktif (view-only) tanpa form input</p>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-blue-600 opacity-0 group-hover:opacity-100 transition-all mr-2">Salin &rarr;</span>
                </button>

                {/* Copy Text Summary */}
                <button
                  onClick={() => {
                    handleCopySummary()
                    setIsShareModalOpen(false)
                    alertShared('Ringkasan teks berhasil disalin!')
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:border-emerald-500 hover:bg-emerald-50/20 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 group-hover:scale-105 transition-all">
                      <Copy className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold text-gray-800">Salin Teks Ringkasan</p>
                      <p className="text-[10px] text-gray-400">Salin seluruh rincian teks ke clipboard</p>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-gray-600 opacity-0 group-hover:opacity-100 transition-all mr-2">Salin &rarr;</span>
                </button>
              </div>

              {/* Section 2: Ekspor Gambar */}
              <div className="space-y-2.5 pt-2 border-t border-gray-150">
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">Ekspor File</span>
                
                <button
                  onClick={() => {
                    handleDownloadPNG()
                    setIsShareModalOpen(false)
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:border-emerald-500 hover:bg-emerald-50/20 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 group-hover:scale-105 transition-all">
                      <svg className="w-4 h-4 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold text-gray-800">Unduh Struk (PNG)</p>
                      <p className="text-[10px] text-gray-400">Unduh gambar struk pembagian resolusi tinggi</p>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-amber-600 opacity-0 group-hover:opacity-100 transition-all mr-2">Unduh &rarr;</span>
                </button>
              </div>
            </div>

            {/* Modal Footer / Close Button */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-250 text-gray-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shared Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] bg-gray-900 text-white text-xs font-extrabold px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 animate-in slide-in-from-top-4 duration-300">
          <Check className="w-4 h-4 text-emerald-400" />
          {toastMessage}
        </div>
      )}
    </div>
  )
}
