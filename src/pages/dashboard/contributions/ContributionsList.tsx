import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { spreadsheetApi } from '@/lib/spreadsheet'
import { TableLoader } from '@/components/ui/TableLoader'
import { Plus, Search, FileText, X, Save, CheckCircle2, Pencil, Trash2, RotateCcw, Droplets, History, Users, Package, Wallet, UserCheck, TrendingUp, Info } from 'lucide-react'
import Select from '@/components/ui/Select'

export default function ContributionsList() {
  const [contributions, setContributions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedContribution, setSelectedContribution] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [newContribution, setNewContribution] = useState({ 
    title: '', category: 'Iuran Wajib', amount: '' as number | string, due_date: '', period_type: 'Bulanan',
    penghuni: 8 as number | string, hargaGalon: 20000 as number | string,
    calcMode: 'intensity' as 'intensity' | 'gallons',
    intensitas: 19/24, ukuranGalon: 19 as number | string, hariPerBulan: 30 as number | string,
    isEstimasiManual: false, manualEstimasiGalon: 10, useAutoCalc: false as number | string
  })
  const [editingId, setEditingId] = useState<number | string | null>(null)

    const isGalon = newContribution.title.toLowerCase().includes('galon')
  const isListrik = newContribution.title.toLowerCase().includes('listrik')

  const calcLabels = isGalon ? {
    title: 'Simulasi Kebutuhan Air',
    method1: 'Berdasarkan Intensitas Minum',
    method2: 'Data Historis',
    intensityLabel: 'Intensitas Minum (Per Orang)',
    unitLabel: 'Ukuran Galon (Liter)',
    priceLabel: 'Harga per Galon (Rp)',
    estimateLabel: 'Estimasi Galon Habis',
    unitName: 'Galon/bulan',
    usageName: 'Liter/bulan',
    icon: <Droplets className="w-3.5 h-3.5" />,
    totalNeedLabel: 'Total Kebutuhan Air',
    estimateResultLabel: 'Estimasi Galon',
    tooltip: 'Default: 8 org = 10 galon'
  } : isListrik ? {
    title: 'Simulasi Penggunaan Listrik',
    method1: 'Berdasarkan Intensitas Listrik',
    method2: 'Data Historis',
    intensityLabel: 'Intensitas (kWh/Hari per Orang)',
    unitLabel: 'Kapasitas Token (kWh)',
    priceLabel: 'Tarif per Token (Rp)',
    estimateLabel: 'Estimasi Token Habis',
    unitName: 'Token/bulan',
    usageName: 'kWh/bulan',
    icon: <TrendingUp className="w-3.5 h-3.5" />,
    totalNeedLabel: 'Total Kebutuhan Listrik',
    estimateResultLabel: 'Estimasi Token',
    tooltip: 'Berdasarkan data historis'
  } : {
    title: 'Simulasi Perhitungan Iuran',
    method1: 'Berdasarkan Intensitas',
    method2: 'Data Historis / Flat',
    intensityLabel: 'Intensitas Pemakaian (Per Orang)',
    unitLabel: 'Ukuran Satuan (Unit)',
    priceLabel: 'Harga per Satuan (Rp)',
    estimateLabel: 'Estimasi Satuan Habis',
    unitName: 'Unit/bulan',
    usageName: 'Unit/bulan',
    icon: <TrendingUp className="w-3.5 h-3.5" />,
    totalNeedLabel: 'Total Kebutuhan Pemakaian',
    estimateResultLabel: 'Estimasi Pemakaian',
    tooltip: 'Berdasarkan data historis'
  }

  const p = Number(newContribution.penghuni) || 0
  const i = Number(newContribution.intensitas) || 0
  const h = Number(newContribution.hariPerBulan) || 0
  const u = Number(newContribution.ukuranGalon) || 0
  const harga = Number(newContribution.hargaGalon) || 0
  const manualEst = Number(newContribution.manualEstimasiGalon) || 0

  const totalLiterSebulan = p * i * h
  const calcEstimasiHistory = Math.ceil(p * (10 / 8))
  
  const estimasiGalon = newContribution.calcMode === 'intensity' 
    ? (u > 0 ? Math.ceil(totalLiterSebulan / u) : 0)
    : (newContribution.isEstimasiManual ? manualEst : calcEstimasiHistory)
  
  const totalBiaya = estimasiGalon * harga
  const autoNominal = p > 0 ? Math.ceil(totalBiaya / p) : 0

  // Proyeksi Perubahan Penghuni (hanya relevan untuk mode intensitas)
  const galonMinusOne = u > 0 && p > 1 
    ? Math.ceil(((p - 1) * i * h) / u) : 0
  const galonPlusOne = u > 0 
    ? Math.ceil(((p + 1) * i * h) / u) : 0

  useEffect(() => {
    fetchContributions()
  }, [])

  const fetchContributions = async () => {
    setLoading(true)
    const { data, error } = await spreadsheetApi.get('Contributions')
    
    if (data && Array.isArray(data)) {
      setContributions(data)
    } else {
      setContributions([])
    }
    setLoading(false)
  }

  const filtered = contributions.filter(c => 
    c.title?.toLowerCase().includes(search.toLowerCase())
  )

  const formatDueDate = (dueDate: string, periodType: string) => {
    if (!dueDate) return '-'
    if (periodType === 'Bulanan') return `Tgl ${dueDate} tiap bulan`
    if (periodType === 'Tahunan') {
      const parts = dueDate.split('-')
      if (parts.length === 2) {
        const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des']
        return `${parts[1]} ${months[parseInt(parts[0])-1] || ''} tiap tahun`
      }
    }
    if (periodType === 'Mingguan') return `Tiap ${dueDate}`
    try {
      const d = new Date(dueDate)
      if (!isNaN(d.getTime())) return d.toLocaleDateString('id-ID')
    } catch(e) {}
    return dueDate
  }

  const formatCurrency = (amount: number) => {
    return (
      <div className="flex justify-between items-center w-full min-w-[100px]">
        <span className="text-gray-500 mr-2">Rp</span>
        <span>{new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(amount)}</span>
      </div>
    )
  }

  const getCategoryData = (contrib_types: any) => {
    if (!contrib_types) return { name: '-', period_type: 'Bulanan' }
    if (typeof contrib_types === 'string') {
      try {
        const parsed = JSON.parse(contrib_types)
        return { name: parsed.name, period_type: parsed.period_type || 'Bulanan' }
      } catch(e) {
        const nameMatch = contrib_types.match(/name=([^,}]+)/)
        const periodMatch = contrib_types.match(/period_type=([^,}]+)/)
        if (nameMatch) {
          return { name: nameMatch[1].trim(), period_type: periodMatch ? periodMatch[1].trim() : 'Bulanan' }
        }
        return { name: contrib_types, period_type: 'Bulanan' }
      }
    }
    return { name: contrib_types.name, period_type: contrib_types.period_type || 'Bulanan' }
  }

  const handleAddContribution = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    if (editingId) {
      const updated = {
        ...contributions.find(c => c.id === editingId),
        title: newContribution.title,
        contribution_types: { name: newContribution.category, period_type: newContribution.period_type },
        period_month: new Date(newContribution.due_date).getMonth() + 1 || 1,
        period_year: new Date(newContribution.due_date).getFullYear() || new Date().getFullYear(),
        amount: newContribution.useAutoCalc ? autoNominal : (Number(newContribution.amount) || 0),
        due_date: newContribution.due_date,
      }
      
      const { success } = await spreadsheetApi.put('Contributions', updated)
      if (success) {
        setContributions(contributions.map(c => c.id === editingId ? updated : c))
        setToastMessage('Iuran berhasil diperbarui!')
      } else {
        setToastMessage('Gagal memperbarui iuran.')
      }
      setTimeout(() => setToastMessage(''), 3000)
      setIsSubmitting(false)
      setIsAddModalOpen(false)
      return
    }

    const added = {
      id: Date.now(),
      title: newContribution.title,
      contribution_types: { name: newContribution.category, period_type: newContribution.period_type },
      period_month: new Date(newContribution.due_date).getMonth() + 1 || 1,
      period_year: new Date(newContribution.due_date).getFullYear() || new Date().getFullYear(),
      amount: newContribution.useAutoCalc ? autoNominal : (Number(newContribution.amount) || 0),
      due_date: newContribution.due_date,
      status: 'active'
    }

    const { success } = await spreadsheetApi.post('Contributions', added)
    
    setContributions([added, ...contributions])
    setIsSubmitting(false)
    setIsAddModalOpen(false)
    
    setToastMessage(success ? 'Iuran berhasil dibuat dan disimpan!' : 'Disimpan lokal (Gagal terhubung ke Sheets)')
    setTimeout(() => setToastMessage(''), 3000)
    
    setNewContribution({ 
      title: '', category: 'Iuran Wajib', amount: '', due_date: '', period_type: 'Bulanan',
      penghuni: 8, hargaGalon: 20000,
      calcMode: 'intensity', intensitas: 19/24, ukuranGalon: 19, hariPerBulan: 30,
      isEstimasiManual: false, manualEstimasiGalon: 10, useAutoCalc: false
    })
  }

  const handleToggleStatus = async (contribution: any) => {
    const newStatus = contribution.status === 'active' ? 'inactive' : 'active'
    setContributions(contributions.map(c => c.id === contribution.id ? {...c, status: newStatus} : c))
    setSelectedContribution({...contribution, status: newStatus})
    
    const { success } = await spreadsheetApi.put('Contributions', { id: contribution.id, status: newStatus })
    
    setToastMessage(success ? `Iuran diubah menjadi ${newStatus === 'active' ? 'Aktif' : 'Non-aktif'}.` : 'Perubahan status disimpan lokal.')
    setTimeout(() => setToastMessage(''), 3000)
  }

  const handleDelete = async (id: number | string) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus iuran ini? Tindakan ini tidak dapat dibatalkan.')) return
    const { success } = await spreadsheetApi.del('Contributions', id)
    if (success) {
      setContributions(contributions.filter(c => c.id !== id))
      setToastMessage('Iuran berhasil dihapus.')
    } else {
      setToastMessage('Gagal menghapus iuran.')
    }
    setTimeout(() => setToastMessage(''), 3000)
  }

  const handleEdit = (contribution: any) => {
    setEditingId(contribution.id)
    const catData = getCategoryData(contribution.contribution_types)
    setNewContribution({
      title: contribution.title,
      category: catData.name || 'Iuran Wajib',
      period_type: catData.period_type || 'Bulanan',
      amount: contribution.amount,
      due_date: contribution.due_date,
      penghuni: 8, hargaGalon: 20000,
      calcMode: 'intensity', intensitas: 19/24, ukuranGalon: 19, hariPerBulan: 30,
      isEstimasiManual: false, manualEstimasiGalon: 10, useAutoCalc: false
    })
    setIsAddModalOpen(true)
  }

  const openAddModal = () => {
    setEditingId(null)
    setNewContribution({ 
      title: '', category: 'Iuran Wajib', amount: '', due_date: '',
      penghuni: 8, hargaGalon: 20000,
      calcMode: 'intensity', intensitas: 19/24, ukuranGalon: 19, hariPerBulan: 30,
      isEstimasiManual: false, manualEstimasiGalon: 10, useAutoCalc: false
    })
    setIsAddModalOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Manajemen Iuran</h1>
          <p className="text-text-secondary mt-1">Kelola data tagihan dan iuran bulanan.</p>
        </div>
        <button onClick={openAddModal} className="btn-primary flex items-center">
          <Plus className="w-5 h-5 mr-2" /> Buat Iuran Baru
        </button>
      </div>

      <div className="card-container p-0 overflow-hidden">
        <div className="p-4 border-b border-border bg-white">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input 
              type="text" 
              placeholder="Cari iuran..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input pl-9"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#F3F4F6] border-b border-border text-gray-600">
              <tr>
                <th className="px-6 py-3 font-semibold whitespace-nowrap">Judul</th>
                <th className="px-6 py-3 font-semibold whitespace-nowrap">Kategori</th>
                <th className="px-6 py-3 font-semibold whitespace-nowrap text-center">Siklus</th>
                <th className="px-6 py-3 font-semibold whitespace-nowrap">Nominal</th>
                <th className="px-6 py-3 font-semibold whitespace-nowrap text-center">Jatuh Tempo</th>
                <th className="px-6 py-3 font-semibold whitespace-nowrap text-center">Status</th>
                <th className="px-6 py-3 font-semibold whitespace-nowrap text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-gray-700 bg-white">
              {loading ? (
                <TableLoader colSpan={7} />
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-text-muted flex flex-col items-center">
                    <FileText className="w-8 h-8 text-gray-300 mb-2" />
                    Tidak ada data iuran.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-[#ECFDF5] transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{c.title}</td>
                    <td className="px-6 py-4">{c.category || (getCategoryData(c.contribution_types).name)}</td>
                    <td className="px-6 py-4 text-blue-600 bg-blue-50/30 text-xs font-medium rounded-md w-max inline-block mt-3">{getCategoryData(c.contribution_types).period_type}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{formatCurrency(c.amount)}</td>
                    <td className="px-6 py-4">{formatDueDate(c.due_date, getCategoryData(c.contribution_types).period_type)}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`badge ${c.status === 'active' ? 'badge-success' : 'bg-gray-100 text-gray-700'}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-1.5">
                        <button 
                          onClick={() => { setSelectedContribution(c); setIsDetailModalOpen(true); }}
                          className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-200"
                          title="Lihat Detail"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleEdit(c)}
                          className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors border border-transparent hover:border-emerald-200"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(c.id)}
                          className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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

      {/* Add Contribution Modal */}
      {isAddModalOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50 shrink-0">
              <h2 className="text-xl font-bold text-gray-900">{editingId ? 'Edit Iuran' : 'Buat Iuran Baru'}</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddContribution} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Judul Iuran</label>
                <input required type="text" className="form-input" value={newContribution.title} onChange={e => setNewContribution({...newContribution, title: e.target.value})} placeholder="Contoh: Iuran WiFi" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Kategori</label>
                <Select 
                  options={[
                    { label: 'Iuran Wajib', value: 'Iuran Wajib' },
                    { label: 'Iuran Opsional', value: 'Iuran Opsional' }
                  ]}
                  value={newContribution.category}
                  onChange={(value) => setNewContribution({...newContribution, category: value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Siklus / Periode Waktu</label>
                <Select 
                  options={[
                    { label: 'Bulanan', value: 'Bulanan' },
                    { label: 'Mingguan', value: 'Mingguan' },
                    { label: 'Tahunan', value: 'Tahunan' },
                    { label: 'Satu Kali (Insidental)', value: 'Satu Kali' }
                  ]}
                  value={newContribution.period_type}
                  onChange={(value) => setNewContribution({...newContribution, period_type: value, due_date: ''})}
                />
              </div>
              
              
              <div className="flex items-center justify-between mb-2 mt-6">
                <label className="flex items-center text-sm font-bold text-gray-900 cursor-pointer">
                  <input type="checkbox" className="mr-2.5 text-emerald-600 focus:ring-emerald-500 rounded w-4 h-4 border-gray-300" checked={newContribution.useAutoCalc} onChange={(e) => setNewContribution({...newContribution, useAutoCalc: e.target.checked})} />
                  Gunakan Kalkulator Iuran Otomatis
                </label>
              </div>
              


              {newContribution.useAutoCalc && (
                <div className="bg-emerald-50/70 p-5 rounded-xl border border-emerald-100 space-y-5 mb-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-emerald-900">{calcLabels.title}</h3>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-emerald-800 mb-2.5">Metode Perhitungan</label>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <label className="flex items-center text-sm text-emerald-900 cursor-pointer">
                        <input type="radio" className="mr-2.5 text-emerald-600 focus:ring-emerald-500" checked={newContribution.calcMode === 'intensity'} onChange={() => setNewContribution({...newContribution, calcMode: 'intensity'})} />
                        {calcLabels.method1}
                      </label>
                      <label className="flex items-center text-sm text-emerald-900 cursor-pointer">
                        <input type="radio" className="mr-2.5 text-emerald-600 focus:ring-emerald-500" checked={newContribution.calcMode === 'gallons'} onChange={() => setNewContribution({...newContribution, calcMode: 'gallons'})} />
                        {calcLabels.method2}
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 items-end">
                    <div>
                      <label className="block text-xs font-medium text-emerald-800 mb-1">Jumlah Penghuni</label>
                      <input type="number" min="1" className="form-input text-sm bg-white" value={newContribution.penghuni} onChange={e => setNewContribution({...newContribution, penghuni: e.target.value === '' ? '' : Number(e.target.value)})} />
                    </div>
                    
                    {newContribution.calcMode === 'intensity' && (
                      <>
                        <div>
                        <label className="block text-xs font-medium text-emerald-800 mb-2">{calcLabels.intensityLabel}</label>
                        <Select 
                          options={[
                            { label: 'Data Historis (~0.8 L/Hari)', value: String(19/24) },
                            { label: 'Rendah (1.5 Liter/Hari)', value: '1.5' },
                            { label: 'Sedang (2 Liter/Hari)', value: '2' },
                            { label: 'Tinggi (3 Liter/Hari)', value: '3' }
                          ]}
                          value={String(newContribution.intensitas)}
                          onChange={(value) => setNewContribution({...newContribution, intensitas: Number(value)})}
                        />
                      </div>
                      <div>
                          <label className="block text-xs font-medium text-emerald-800 mb-1">{calcLabels.unitLabel}</label>
                          <input type="number" min="1" className="form-input text-sm bg-white" value={newContribution.ukuranGalon} onChange={e => setNewContribution({...newContribution, ukuranGalon: e.target.value === '' ? '' : Number(e.target.value)})} placeholder="Contoh: 19" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-emerald-800 mb-1">Hari dalam Sebulan</label>
                          <input type="number" min="28" max="31" className="form-input text-sm bg-white" value={newContribution.hariPerBulan} onChange={e => setNewContribution({...newContribution, hariPerBulan: e.target.value === '' ? '' : Number(e.target.value)})} />
                        </div>
                      </>
                    )}

                    <div>
                      <label className="block text-xs font-medium text-emerald-800 mb-1">{calcLabels.estimateLabel}</label>
                      <div className="relative">
                        <input 
                          type="number" 
                          disabled={newContribution.calcMode === 'intensity' || !newContribution.isEstimasiManual}
                          className={`form-input text-sm font-semibold w-full pr-10 ${newContribution.calcMode === 'intensity' || !newContribution.isEstimasiManual ? 'bg-emerald-100/50 text-emerald-900 cursor-not-allowed border-transparent' : 'bg-white text-gray-900 border-emerald-300 focus:border-emerald-500'}`} 
                          value={estimasiGalon} 
                          onChange={e => {
                            if (newContribution.calcMode === 'gallons' && newContribution.isEstimasiManual) {
                              setNewContribution({...newContribution, manualEstimasiGalon: e.target.value === '' ? '' : Number(e.target.value)})
                            }
                          }}
                        />
                        {newContribution.calcMode === 'gallons' && (
                          <button 
                            type="button"
                            onClick={() => {
                              if (!newContribution.isEstimasiManual) {
                                setNewContribution({...newContribution, isEstimasiManual: true, manualEstimasiGalon: calcEstimasiHistory})
                              } else {
                                setNewContribution({...newContribution, isEstimasiManual: false})
                              }
                            }}
                            className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md transition-colors ${newContribution.isEstimasiManual ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50'}`}
                            title={newContribution.isEstimasiManual ? "Kembali ke perhitungan otomatis" : "Edit estimasi manual"}
                          >
                            {newContribution.isEstimasiManual ? <RotateCcw className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
                          </button>
                        )}
                      </div>
                    </div>

                    <div className={newContribution.calcMode === 'gallons' ? "col-span-2" : ""}>
                      <label className="block text-xs font-medium text-emerald-800 mb-1">{calcLabels.priceLabel}</label>
                      <input type="number" min="0" step="500" className="form-input text-sm bg-white" value={newContribution.hargaGalon} onChange={e => setNewContribution({...newContribution, hargaGalon: e.target.value === '' ? '' : Number(e.target.value)})} />
                    </div>
                  </div>
                  
                  <div className="mt-4 space-y-3">
                    <div className="bg-white rounded-xl border border-emerald-100 shadow-sm">
                      <div className="bg-emerald-600/90 rounded-t-[11px] px-4 py-2.5 text-white font-medium text-xs flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          {newContribution.calcMode === "intensity" ? calcLabels.icon : <History className="w-3.5 h-3.5" />}
                          <span>Ringkasan Kalkulasi</span>
                        </div>
                        {!newContribution.isEstimasiManual && newContribution.calcMode === 'gallons' && (
                           <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-semibold">Default: 8 org = 10 galon</span>
                        )}
                      </div>
                      
                      <div className="p-4 space-y-3 pb-0">
                        {newContribution.calcMode === 'intensity' && (
                          <div className="flex justify-between items-center text-xs border-b border-gray-100 pb-3">
                             <span className="flex items-center gap-2 text-gray-500 font-medium"><Users className="w-3.5 h-3.5 text-emerald-500"/> Total Kebutuhan Air</span>
                             <div className="flex items-center gap-1.5 relative group cursor-help">
                               <span className="text-emerald-700 font-bold">{Number.isInteger(totalLiterSebulan) ? totalLiterSebulan : totalLiterSebulan.toFixed(1)} {calcLabels.usageName}</span>
                               <Info className="w-4 h-4 text-emerald-400 hover:text-emerald-600 transition-colors" />
                               
                               {/* Tooltip for Formula */}
                               <div className="absolute right-0 bottom-full mb-2 w-max max-w-[250px] bg-gray-900 text-white text-[10px] p-2.5 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 shadow-xl text-left">
                                 <div className="font-semibold mb-1.5 border-b border-gray-700 pb-1.5">Rumus Perhitungan:</div>
                                 <div className="space-y-1 text-gray-300">
                                   <div className="flex justify-between gap-4"><span>Penghuni:</span> <span>{p} orang</span></div>
                                   <div className="flex justify-between gap-4"><span>Intensitas:</span> <span>{Number.isInteger(i) ? i : i.toFixed(2)} L/hari</span></div>
                                   <div className="flex justify-between gap-4"><span>Waktu:</span> <span>{h} hari</span></div>
                                 </div>
                                 <div className="mt-2 pt-1.5 border-t border-gray-700 space-y-1">
                                   <div className="flex justify-between gap-4 text-gray-400">
                                     <span>Operasi:</span> <span>{p} × {Number.isInteger(i) ? i : i.toFixed(2)} × {h}</span>
                                   </div>
                                   <div className="text-emerald-400 font-bold flex justify-between gap-4">
                                     <span>Total Kebutuhan:</span> <span>{Number.isInteger(totalLiterSebulan) ? totalLiterSebulan : totalLiterSebulan.toFixed(1)} Liter</span>
                                   </div>
                                 </div>
                                 <div className="absolute top-full right-2 -mt-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                               </div>
                             </div>
                          </div>
                        )}
                        <div className="flex justify-between items-center text-xs border-b border-gray-100 pb-3">
                           <span className="flex items-center gap-2 text-gray-500 font-medium"><Package className="w-3.5 h-3.5 text-emerald-500"/> {calcLabels.estimateResultLabel}</span>
                           <span className="font-bold text-gray-900">{estimasiGalon} {calcLabels.unitName}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs pb-3">
                           <span className="flex items-center gap-2 text-gray-500 font-medium"><Wallet className="w-3.5 h-3.5 text-emerald-500"/> Total Biaya</span>
                           <span className="font-bold text-gray-900">Rp {totalBiaya.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs bg-emerald-50/80 border-t border-emerald-100 px-4 py-3 -mx-4">
                           <span className="flex items-center gap-2 text-emerald-900 font-bold"><UserCheck className="w-4 h-4 text-emerald-600"/> Iuran Per Orang</span>
                           <span className="text-emerald-700 font-bold text-sm">Rp {autoNominal.toLocaleString('id-ID')}</span>
                        </div>
                      </div>
                    </div>

                    {newContribution.calcMode === 'intensity' && (
                      <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100/60 rounded-xl p-3.5 shadow-sm">
                        <div className="flex items-center gap-1.5 text-amber-900 text-xs font-bold mb-3">
                          <TrendingUp className="w-3.5 h-3.5 text-amber-600" /> Proyeksi Perubahan Penghuni
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-white/90 rounded-lg p-2.5 border border-white shadow-sm flex flex-col justify-center items-center text-center">
                            <span className="text-gray-500 text-[10px] font-semibold mb-0.5">Jika Berkurang (-1 Org)</span>
                            <span className="text-gray-400 text-[9px] mb-1">Total {p > 1 ? p - 1 : 0} org</span>
                            <span className="font-bold text-amber-950 text-base">{p > 1 ? galonMinusOne : 0} <span className="font-medium text-gray-400 text-[10px]">{calcLabels.unitName}</span></span>
                          </div>
                          <div className="bg-white/90 rounded-lg p-2.5 border border-white shadow-sm flex flex-col justify-center items-center text-center">
                            <span className="text-gray-500 text-[10px] font-semibold mb-0.5">Jika Bertambah (+1 Org)</span>
                            <span className="text-gray-400 text-[9px] mb-1">Total {p + 1} org</span>
                            <span className="font-bold text-amber-950 text-base">{galonPlusOne} <span className="font-medium text-gray-400 text-[10px]">{calcLabels.unitName}</span></span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Nominal (Rp)</label>
                  <input required type="number" disabled={newContribution.useAutoCalc} className={`form-input ${newContribution.useAutoCalc ? 'bg-emerald-50/50 text-emerald-900 cursor-not-allowed border-emerald-200' : ''}`} value={newContribution.useAutoCalc ? autoNominal : newContribution.amount} onChange={e => setNewContribution({...newContribution, amount: e.target.value === '' ? '' : Number(e.target.value)})} placeholder="50000" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Jatuh Tempo Default</label>
                  {newContribution.period_type === 'Bulanan' ? (
                     <div className="flex items-center gap-2">
                       <span className="text-sm text-gray-500">Tgl</span>
                       <input required type="number" min="1" max="31" className="form-input" value={newContribution.due_date} onChange={e => setNewContribution({...newContribution, due_date: e.target.value})} placeholder="1-31" />
                     </div>
                  ) : newContribution.period_type === 'Tahunan' ? (
                     <div className="flex items-center gap-2">
                       <Select 
                         options={[{label: 'Januari', value: '01'}, {label: 'Februari', value: '02'}, {label: 'Maret', value: '03'}, {label: 'April', value: '04'}, {label: 'Mei', value: '05'}, {label: 'Juni', value: '06'}, {label: 'Juli', value: '07'}, {label: 'Agustus', value: '08'}, {label: 'September', value: '09'}, {label: 'Oktober', value: '10'}, {label: 'November', value: '11'}, {label: 'Desember', value: '12'}]}
                         value={newContribution.due_date?.split('-')[0] || '01'}
                         onChange={val => {
                           const d = newContribution.due_date?.split('-')[1] || '01';
                           setNewContribution({...newContribution, due_date: `${val}-${d}`})
                         }}
                       />
                       <input required type="number" min="1" max="31" className="form-input w-20" value={newContribution.due_date?.split('-')[1] || ''} onChange={e => {
                         const m = newContribution.due_date?.split('-')[0] || '01';
                         let val = e.target.value;
                         if (val && val.length < 2 && Number(val) < 10 && val !== '') val = '0' + val;
                         if (val === '0') val = '01';
                         setNewContribution({...newContribution, due_date: `${m}-${val}`})
                       }} placeholder="Tgl" />
                     </div>
                  ) : newContribution.period_type === 'Mingguan' ? (
                     <Select 
                       options={[{label:'Senin', value:'Senin'}, {label:'Selasa', value:'Selasa'}, {label:'Rabu', value:'Rabu'}, {label:'Kamis', value:'Kamis'}, {label:'Jumat', value:'Jumat'}, {label:'Sabtu', value:'Sabtu'}, {label:'Minggu', value:'Minggu'}]}
                       value={newContribution.due_date}
                       onChange={val => setNewContribution({...newContribution, due_date: val})}
                     />
                  ) : (
                     <input required type="date" className="form-input" value={newContribution.due_date} onChange={e => setNewContribution({...newContribution, due_date: e.target.value})} />
                  )}
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn-secondary flex-1">Batal</button>
                <button type="submit" disabled={isSubmitting} className="btn-primary flex-1 flex justify-center items-center">
                  {isSubmitting ? 'Memproses...' : <><Save className="w-5 h-5 mr-2" /> Simpan</>}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Detail Modal */}
      {isDetailModalOpen && selectedContribution && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900">Detail Iuran</h2>
              <button onClick={() => setIsDetailModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Judul</span>
                  <span className="font-semibold text-gray-900">{selectedContribution.title}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Kategori</span>
                  <span className="font-medium text-gray-900">{selectedContribution.contribution_types?.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Periode</span>
                  <span className="font-medium text-gray-900">{selectedContribution.period_month}/{selectedContribution.period_year}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                  <span className="text-sm text-gray-500">Nominal</span>
                  <span className="text-lg font-bold text-primary">{formatCurrency(selectedContribution.amount)}</span>
                </div>
              </div>
              <div className="flex justify-between items-center bg-white border border-gray-200 p-4 rounded-xl">
                <span className="text-sm font-medium text-gray-700">Status Aktif</span>
                <button 
                  onClick={() => handleToggleStatus(selectedContribution)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${selectedContribution.status === 'active' ? 'bg-emerald-500' : 'bg-gray-200'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${selectedContribution.status === 'active' ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
