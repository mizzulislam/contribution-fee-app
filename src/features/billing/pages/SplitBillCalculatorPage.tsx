import React, { useState, useEffect } from 'react'
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
  Sliders
} from 'lucide-react'

interface Participant {
  id: string
  name: string
  amount: number // Used in itemized/custom split
}

interface CustomAdjustment {
  id: string
  name: string
  type: 'charge' | 'discount'
  valueType: 'nominal' | 'percentage'
  value: number
}

export default function SplitBillCalculator() {
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
    { id: '1', name: 'Peserta 1', amount: 0 },
    { id: '2', name: 'Peserta 2', amount: 0 }
  ])

  const [copied, setCopied] = useState(false)

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

  // Handlers for participants
  const handleAddParticipant = () => {
    const nextId = (participants.length + 1).toString()
    setParticipants([...participants, { id: nextId, name: `Peserta ${nextId}`, amount: 0 }])
  }

  const handleRemoveParticipant = (id: string) => {
    if (participants.length <= 1) return
    setParticipants(participants.filter(p => p.id !== id))
  }

  const handleParticipantChange = (id: string, field: 'name' | 'amount', value: string | number) => {
    setParticipants(
      participants.map(p => {
        if (p.id === id) {
          return {
            ...p,
            [field]: field === 'amount' ? Number(value) : value
          }
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
      { id: '1', name: 'Peserta 1', amount: 0 },
      { id: '2', name: 'Peserta 2', amount: 0 }
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

  // Copy result to clipboard
  const handleCopySummary = () => {
    const modeLabel = splitMode === 'equal' ? 'Bagi Rata (Equal Split)' : 'Bagi Kustom (Itemized Split)'
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
                <Users className={`w-4 h-4 shrink-0 ${activeTab === 'equal' ? 'text-emerald-500' : 'text-gray-400'}`} /> Bagi Rata (Equal Split)
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
                          className="bg-gray-50/50 border border-gray-200 hover:border-gray-300 focus:border-emerald-500 focus:bg-white rounded-xl pl-12 pr-4 h-14 w-full text-lg font-bold text-gray-800 transition-all focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
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
          <div className="bg-gradient-to-b from-emerald-950 via-[#064e3b] to-[#042f2c] rounded-[24px] text-white shadow-[0_20px_50px_rgba(4,120,87,0.12)] border border-emerald-800/40 relative overflow-hidden flex flex-col h-full">
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
                        <div className="min-w-0 pr-3">
                          <p className="font-extrabold text-xs sm:text-sm truncate text-white">{share.name}</p>
                          <p className="text-[10px] text-emerald-300/70 mt-0.5">
                            Murni: {formatCurrency(share.subtotal)} 
                            {taxValue > 0 || serviceValue > 0 || discountValue > 0 || customAdjustmentsTotal !== 0 ? ' + Penyesuaian' : ''}
                          </p>
                        </div>
                        <span className="font-black text-xs sm:text-base text-emerald-300 text-right shrink-0">{formatCurrency(share.total)}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Info Message */}
              <div className="bg-emerald-950/40 backdrop-blur-sm p-3 rounded-xl border border-white/5 flex items-start gap-2.5 text-[10.5px] text-emerald-200/90 leading-relaxed shadow-inner">
                <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p>Pajak, biaya layanan, dan diskon dialokasikan secara proporsional sesuai porsi belanja masing-masing peserta.</p>
              </div>

              {/* Actions button */}
              <button
                type="button"
                onClick={handleCopySummary}
                className={`w-full py-3.5 rounded-xl font-extrabold text-sm tracking-wide shadow-lg transition-all duration-300 flex items-center justify-center gap-2 active:scale-98 cursor-pointer ${
                  copied
                    ? 'bg-white text-emerald-950 shadow-emerald-950/20'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white border border-emerald-400/20 hover:shadow-emerald-500/10 shadow-xl'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-4.5 h-4.5 animate-bounce" /> Belhasil Disalin!
                  </>
                ) : (
                  <>
                    <Copy className="w-4.5 h-4.5" /> Salin Ringkasan (WhatsApp)
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
