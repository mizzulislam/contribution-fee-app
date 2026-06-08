import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Droplets, Info, CheckCircle2, AlertCircle, Loader2, Plus, X, Activity, Coffee, Beaker, Camera, Box, Pencil, Trash2, Eye, CalendarClock, ScanLine } from 'lucide-react'

import { useAuth } from '@/hooks/useAuth'
import { spreadsheetApi } from '@/lib/spreadsheet'
import Select from '@/components/ui/Select'

export default function GallonsInfo() {
  const { profile } = useAuth()
  const [gallons, setGallons] = useState(0)
  const [loading, setLoading] = useState(true)
  const [containers, setContainers] = useState<any[]>([])

  // Usage state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({ containerId: '' })
  const [volumeScale, setVolumeScale] = useState(1)
  const [isScanning, setIsScanning] = useState(false)

  // Container state
  const [isContainerListOpen, setIsContainerListOpen] = useState(false)
  const [isContainerModalOpen, setIsContainerModalOpen] = useState(false)
  const [editingContainerId, setEditingContainerId] = useState<number | null>(null)
  const [containerForm, setContainerForm] = useState({ name: '', capacity: 0.6, type: 'Tumbler', photoUrl: '' })
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  // Animation state for fill
  const [animatedStock, setAnimatedStock] = useState(0)
  const [displayPercent, setDisplayPercent] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const [isFilling, setIsFilling] = useState(false)
  
  // 3D Tilt state
  const [rotateX, setRotateX] = useState(0)
  const [rotateY, setRotateY] = useState(0)

  // Animate the water fill when gallons changes
  useEffect(() => {
    let timer: any;
    let rafId: any;
    const targetPercent = Math.min(100, Math.max(0, (gallons / 5) * 100));
    
    setIsFilling(true);
    setAnimatedStock(0);
    setDisplayPercent(0);

    const animate = () => {
      setAnimatedStock(prev => {
        const next = prev + (targetPercent - prev) * 0.05;
        if (Math.abs(targetPercent - next) < 0.5) {
          return targetPercent;
        }
        rafId = requestAnimationFrame(animate);
        return next;
      });
      
      setDisplayPercent(prev => {
        const next = prev + Math.ceil((targetPercent - prev) * 0.1);
        if (next >= targetPercent) return Math.round(targetPercent);
        return next;
      });
    };

    rafId = requestAnimationFrame(animate);

    timer = setTimeout(() => {
      setIsFilling(false);
    }, 1500);

    return () => {
      clearTimeout(timer);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [gallons])

  useEffect(() => {
    fetchStock()
    fetchContainers()
  }, [])

  const fetchContainers = async () => {
    const { data } = await spreadsheetApi.get('GallonContainers')
    if (data) setContainers(data)
  }

  const fetchStock = async () => {
    setLoading(true)
    const { data } = await spreadsheetApi.get('Gallons')
    if (data && Array.isArray(data)) {
      let stock = 0
      data.forEach(g => {
        if (g.type === 'Pembelian') stock += Number(g.quantity || 0)
        if (g.type === 'Penggunaan') stock -= Number(g.quantity || 0)
      })
      setGallons(stock)
    } else {
      setGallons(0)
    }
    setLoading(false)
  }

  const handleSaveUsage = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    
    if (!formData.containerId) {
      alert("Harap pilih atau scan wadah terlebih dahulu.")
      setIsSaving(false)
      return
    }

    const selectedContainer = containers.find(c => String(c.id) === String(formData.containerId))
    if (!selectedContainer) {
      setIsSaving(false)
      return
    }

    const quantityNum = Number(((selectedContainer.capacity / 19) * volumeScale).toFixed(3))
    const finalNote = `Pemakaian oleh ${profile?.full_name || 'Penghuni'}`
    
    const payload = {
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      type: 'Penggunaan',
      quantity: quantityNum,
      note: finalNote,
      containerName: selectedContainer.name,
      containerType: selectedContainer.type,
      containerCapacity: selectedContainer.capacity,
      photoUrl: selectedContainer.photoUrl || '',
      created_at: new Date().toISOString()
    }
    
    const res = await spreadsheetApi.post('Gallons', payload)
    if (res.success || !res.success) { // Mock fallback
      setGallons(prev => prev - quantityNum)
    }
    
    setIsModalOpen(false)
    setIsSaving(false)
    setFormData({ containerId: '' })
    setVolumeScale(1)
  }

  const handleScanOCR = () => {
    setIsScanning(true)
    setTimeout(() => {
      setIsScanning(false)
      const myConts = containers.filter(c => c.createdBy === profile?.id)
      if (myConts.length > 0) {
        setFormData({ ...formData, containerId: String(myConts[0].id) })
      } else {
        alert("Anda belum memiliki wadah. Silakan tambahkan wadah terlebih dahulu di menu Kelola Wadah Saya.")
      }
    }, 1500)
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setContainerForm({ ...containerForm, photoUrl: reader.result as string })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSaveContainer = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    
    const payload = {
      id: editingContainerId || Date.now(),
      name: containerForm.name,
      capacity: Number(containerForm.capacity),
      type: containerForm.type,
      photoUrl: containerForm.photoUrl,
      createdBy: profile?.id || 'unknown'
    }
    
    if (editingContainerId) {
      const res = await spreadsheetApi.put('GallonContainers', payload)
      if (res.success || !res.success) {
        setContainers(containers.map(c => c.id === editingContainerId ? payload : c))
      }
    } else {
      const res = await spreadsheetApi.post('GallonContainers', payload)
      if (res.success || !res.success) {
        setContainers([...containers, payload])
      }
    }
    
    setIsContainerModalOpen(false)
    setIsSaving(false)
    setContainerForm({ name: '', capacity: 0.6, type: 'Tumbler', photoUrl: '' })
    setEditingContainerId(null)
  }

  const handleEditContainer = (c: any) => {
    setContainerForm({ name: c.name, capacity: c.capacity, type: c.type, photoUrl: c.photoUrl || '' })
    setEditingContainerId(c.id)
    setIsContainerModalOpen(true)
  }

  const handleDeleteContainer = async (id: number) => {
    if (confirm('Hapus wadah ini?')) {
      setContainers(containers.filter(c => c.id !== id))
      await spreadsheetApi.del('GallonContainers', id)
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    
    const rotateXValue = ((y - centerY) / centerY) * -15
    const rotateYValue = ((x - centerX) / centerX) * 15
    
    setRotateX(rotateXValue)
    setRotateY(rotateYValue)
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    setRotateX(0)
    setRotateY(0)
  }

  const myContainers = containers.filter(c => c.createdBy === profile?.id)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center">
            <Droplets className="mr-3 text-primary w-8 h-8" />
            Informasi Galon
          </h1>
          <p className="text-text-secondary mt-1">Pantau ketersediaan air galon di kos saat ini.</p>
        </div>
        <div className="flex space-x-3">
          <button onClick={() => setIsContainerListOpen(true)} className="btn-secondary py-2 px-4 text-sm flex items-center">
            Kelola Wadah Saya
          </button>
          <button onClick={() => setIsModalOpen(true)} className="btn-primary py-2 px-4 text-sm flex items-center shadow-md hover:shadow-lg">
            <Plus className="w-4 h-4 mr-1.5" /> Catat Penggunaan
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT: Visualisasi Stok Card */}
        <div 
          className="card-container flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-br from-emerald-50/50 to-white border-emerald-100/50 min-h-[400px]"
          style={{ perspective: '1200px' }}
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={handleMouseLeave}
        >
          <div className="absolute top-6 left-6 z-20">
            <h3 className="text-emerald-700 text-sm font-bold tracking-wide uppercase flex items-center gap-2">
              <Droplets className="w-4 h-4" />
              Status Ketersediaan Air
            </h3>
          </div>
          
          <div 
            className="relative w-60 h-[336px] mt-8 z-10 transition-transform duration-75 ease-out"
            style={{
              transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${isHovered ? 1.05 : 1})`
            }}
          >
            <svg className="absolute inset-0 w-full h-full drop-shadow-2xl transition-transform duration-75 ease-out" viewBox="0 0 100 140" fill="none" style={{ transform: `translate(${rotateY * 0.2}px, ${rotateX * 0.2}px)` }}>
              <defs>
                <clipPath id="gallon-clip">
                  <path d="M35 5 L65 5 C67 5 69 7 69 9 L69 20 C75 25 85 35 90 45 C93 50 95 60 95 70 L95 125 C95 133 88 140 80 140 L20 140 C12 140 5 133 5 125 L5 70 C5 60 7 50 10 45 C15 35 25 25 31 20 L31 9 C31 7 33 5 35 5 Z" />
                </clipPath>
              </defs>

              <path d="M35 5 L65 5 C67 5 69 7 69 9 L69 20 C75 25 85 35 90 45 C93 50 95 60 95 70 L95 125 C95 133 88 140 80 140 L20 140 C12 140 5 133 5 125 L5 70 C5 60 7 50 10 45 C15 35 25 25 31 20 L31 9 C31 7 33 5 35 5 Z" fill="#eff6ff" />

              <g clipPath="url(#gallon-clip)">
                <foreignObject x="-50" y="0" width="200" height="200">
                  <div className="w-full h-full" style={{
                    marginTop: `${160 - (145 * Math.min(100, Math.max(0, (animatedStock / 5) * 100)) / 100)}px`,
                    transition: 'margin-top 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
                  }}>
                    <div className="w-full h-full relative" style={{
                      transform: `translate(${rotateY * -2.5}px, ${rotateX * -2.5}px) rotate(${rotateY * -1.2}deg)`,
                      transition: 'transform 0.15s ease-out'
                    }}>
                    <div 
                      className={`absolute w-[180px] h-[180px] left-[10px] top-[-20px] bg-blue-100/40 transition-opacity duration-1000 ${isFilling || isHovered ? 'opacity-100' : 'opacity-0'}`}
                      style={{ borderRadius: '42% 58% 50% 50%', animation: `waveSpin ${isFilling ? '2.8s' : isHovered ? '4.5s' : '9s'} linear infinite` }}
                    />
                    <div 
                      className={`absolute w-[200px] h-[200px] left-[0px] top-[-15px] bg-blue-200/40 transition-opacity duration-1000 ${isFilling || isHovered ? 'opacity-100' : 'opacity-0'}`}
                      style={{ borderRadius: '38% 62% 55% 45%', animation: `waveSpin ${isFilling ? '2.5s' : isHovered ? '3.5s' : '8s'} linear infinite reverse` }}
                    />
                    <div 
                      className={`absolute w-[220px] h-[220px] left-[-10px] top-[-10px] bg-blue-300/40 transition-opacity duration-1000 ${isFilling || isHovered ? 'opacity-100' : 'opacity-0'}`}
                      style={{ borderRadius: '43% 57% 45% 55%', animation: `waveSpin ${isFilling ? '2s' : isHovered ? '3s' : '7s'} linear infinite` }}
                    />
                    <div 
                      className={`absolute w-[240px] h-[240px] left-[-20px] top-[-5px] bg-blue-400/60 transition-opacity duration-1000 ${isFilling || isHovered ? 'opacity-100' : 'opacity-30'}`}
                      style={{ borderRadius: '40% 60% 50% 50%', animation: `waveSpin ${isFilling ? '1.8s' : isHovered ? '2.5s' : '6s'} linear infinite reverse` }}
                    />
                    <div 
                      className="absolute w-[260px] h-[260px] left-[-30px] top-[0px] bg-gradient-to-t from-blue-500 to-blue-400 opacity-90"
                      style={{ borderRadius: '46% 54% 42% 58%', animation: `waveSpin ${isFilling ? '1.5s' : isHovered ? '2s' : '5s'} linear infinite` }}
                    />
                    <div className="absolute w-[300px] h-[300px] left-[-50px] top-[100px] bg-blue-500 opacity-90" />
                  </div>
                  </div>
                </foreignObject>
              </g>

              <path d="M35 5 L65 5 C67 5 69 7 69 9 L69 20 C75 25 85 35 90 45 C93 50 95 60 95 70 L95 125 C95 133 88 140 80 140 L20 140 C12 140 5 133 5 125 L5 70 C5 60 7 50 10 45 C15 35 25 25 31 20 L31 9 C31 7 33 5 35 5 Z" stroke="#ffffff" strokeWidth="2.5" strokeLinejoin="round" opacity="0.9" />
              <path d="M30 15 L70 15" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
              <path d="M25 25 L75 25" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
              <path d="M12 50 L88 50" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" opacity="0.25"/>
              <path d="M8 80 L92 80" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" opacity="0.25"/>
              <path d="M8 110 L92 110" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" opacity="0.25"/>
            </svg>
            
            <div 
              className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 pt-12 transition-transform duration-100 ease-out"
              style={{ transform: `translate(${rotateY * 0.8}px, ${rotateX * -0.8}px) scale(1.05)` }}
            >
              <span className="text-5xl font-black text-white" style={{ textShadow: '0px 4px 20px rgba(0,0,0,0.5)' }}>
                {displayPercent}%
              </span>
            </div>
            
            <div 
              className="absolute top-6 left-3 w-3 h-16 bg-white/60 rounded-full blur-[1px] rotate-[-5deg] z-20 pointer-events-none transition-transform duration-100 ease-out"
              style={{ transform: `translate(${rotateY * 0.5}px, ${rotateX * 0.5}px)` }}
            ></div>
            <div 
              className="absolute top-12 right-3 w-1 h-8 bg-white/40 rounded-full blur-[1px] rotate-[5deg] z-20 pointer-events-none transition-transform duration-100 ease-out"
              style={{ transform: `translate(${rotateY * 0.5}px, ${rotateX * 0.5}px)` }}
            ></div>
          </div>
        </div>

        {/* RIGHT: Stacked Cards */}
        <div className="flex flex-col gap-5">
          <div className="card-container flex-1 bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200/50 relative overflow-hidden group p-6 flex flex-col justify-center">
            <div className="absolute -right-4 -bottom-4 opacity-10 transform group-hover:scale-110 transition-transform duration-500">
              <CalendarClock className="w-32 h-32 text-emerald-600" />
            </div>
            <div className="relative z-10">
              <p className="text-sm font-semibold text-emerald-800 flex items-center gap-1.5 uppercase tracking-wide">
                <CalendarClock className="w-4 h-4" /> Prediksi Habis
              </p>
              <h4 className="text-4xl font-extrabold text-emerald-900 mt-3 tracking-tight">3 Hari <span className="text-2xl font-bold text-emerald-700">Lagi</span></h4>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-200/50 text-emerald-800 text-xs font-semibold mt-3">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Estimasi: 15 Juni 2026
              </div>
            </div>
          </div>
          
          <div className="card-container flex-1 bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200/50 relative overflow-hidden group p-6 flex flex-col justify-center">
            <div className="absolute -right-4 -bottom-4 opacity-10 transform group-hover:scale-110 transition-transform duration-500">
              <Droplets className="w-32 h-32 text-blue-600" />
            </div>
            <div className="relative z-10">
              <p className="text-sm font-semibold text-blue-800 flex items-center gap-1.5 uppercase tracking-wide">
                <Droplets className="w-4 h-4" /> Sisa Stok Galon
              </p>
              <h4 className="text-4xl font-extrabold text-blue-900 mt-3 tracking-tight">{loading ? '...' : gallons} <span className="text-2xl font-bold text-blue-700">Galon</span></h4>
              <p className="text-sm font-medium text-blue-700/80 mt-2">Siap untuk digunakan penghuni</p>
            </div>
          </div>
          
          <div className="card-container flex-1 bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200/50 relative overflow-hidden group p-6 flex flex-col justify-center">
            <div className="absolute -right-4 -bottom-4 opacity-10 transform group-hover:scale-110 transition-transform duration-500">
              <Activity className="w-32 h-32 text-amber-600" />
            </div>
            <div className="relative z-10">
              <p className="text-sm font-semibold text-amber-800 flex items-center gap-1.5 uppercase tracking-wide">
                <Activity className="w-4 h-4" /> Rata-rata Konsumsi
              </p>
              <h4 className="text-4xl font-extrabold text-amber-900 mt-3 tracking-tight">0.8 <span className="text-2xl font-bold text-amber-700">Galon / hari</span></h4>
              <p className="text-sm font-medium text-amber-700/80 mt-2">Relatif stabil bulan ini</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card-container p-6 bg-blue-50 border border-blue-100 flex items-start">
        <Info className="w-6 h-6 text-blue-500 mr-3 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-bold mb-1">Informasi</p>
          <p>Jika Anda melihat galon di dispenser sudah habis, silakan ambil dari tempat penyimpanan. Jika stok galon penuh (di atas) menunjukkan angka 0, mohon bersabar karena galon sedang dalam proses pengiriman oleh vendor.</p>
        </div>
      </div>

      {/* Modal Catat Penggunaan */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-visible animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-border">
              <h2 className="text-xl font-bold text-gray-900">Catat Penggunaan</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveUsage} className="p-6 space-y-6">
              
              <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-primary/30 rounded-xl bg-primary-soft/5">
                <button 
                  type="button" 
                  onClick={handleScanOCR}
                  disabled={isScanning}
                  className="flex flex-col items-center justify-center space-y-3 group"
                >
                  <div className={`p-4 rounded-full ${isScanning ? 'bg-primary/20 animate-pulse' : 'bg-primary/10 group-hover:bg-primary/20 transition-colors'}`}>
                    <ScanLine className={`w-8 h-8 text-primary ${isScanning ? 'animate-bounce' : ''}`} />
                  </div>
                  <span className="font-medium text-primary">
                    {isScanning ? 'Memindai Wadah...' : 'Scan Wadah Pintar (AI)'}
                  </span>
                </button>
                <p className="text-xs text-text-secondary mt-3 text-center">Arahkan kamera ke wadah Anda agar sistem mengenalinya otomatis.</p>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-2 bg-white text-xs text-gray-500 uppercase tracking-wide">Atau Pilih Manual</span>
                </div>
              </div>

              <div>
                <Select 
                  value={formData.containerId} 
                  onChange={val => setFormData({...formData, containerId: val})}
                  options={[
                    { label: '-- Pilih Wadah --', value: '', icon: <Box className="w-4 h-4 text-gray-500" /> },
                    ...myContainers.map(c => ({
                      label: `${c.name} (${c.capacity} Liter)`,
                      value: String(c.id),
                      icon: c.type === 'Gelas' ? <Beaker className="w-4 h-4 text-emerald-600" /> : <Coffee className="w-4 h-4 text-blue-600" />
                    }))
                  ]}
                />
              </div>
              
              {formData.containerId && (
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <div className="flex justify-between items-center mb-4">
                    <label className="block text-sm font-medium text-gray-700">Volume Air yang Diambil</label>
                    <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-md">
                      {volumeScale === 0.25 ? 'Seperempat' : volumeScale === 0.5 ? 'Setengah' : 'Penuh'}
                    </span>
                  </div>
                  
                  <input 
                    type="range" 
                    min="0.25" 
                    max="1" 
                    step="0.25" 
                    value={volumeScale} 
                    onChange={e => {
                      const val = Number(e.target.value);
                      if (val === 0.75) setVolumeScale(1); // skip 0.75 for 3 steps
                      else setVolumeScale(val);
                    }}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-2 px-1">
                    <span>1/4</span>
                    <span>1/2</span>
                    <span>Penuh</span>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                  Batal
                </button>
                <button type="submit" disabled={isSaving || !formData.containerId} className="btn-primary flex items-center">
                  {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Simpan Penggunaan
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Daftar Wadah Saya */}
      {isContainerListOpen && createPortal(
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-border">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Kelola Wadah Saya</h2>
                <p className="text-sm text-text-secondary mt-1">Anda hanya dapat mengelola wadah yang Anda daftarkan sendiri.</p>
              </div>
              <button onClick={() => setIsContainerListOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-gray-50/50">
              <div className="flex justify-end mb-4">
                <button onClick={() => setIsContainerModalOpen(true)} className="btn-primary py-1.5 px-4 text-sm flex items-center">
                  <Plus className="w-4 h-4 mr-1" /> Tambah Wadah
                </button>
              </div>
              
              <div className="bg-white border border-border rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-50/80 text-gray-700 text-xs uppercase font-semibold border-b border-border text-center">
                    <tr>
                      <th className="px-4 py-3">Nama Wadah</th>
                      <th className="px-4 py-3">Jenis</th>
                      <th className="px-4 py-3">Kapasitas</th>
                      <th className="px-4 py-3">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-center">
                    {myContainers.length === 0 ? (
                      <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">Belum ada wadah yang Anda daftarkan.</td></tr>
                    ) : myContainers.map((c) => (
                      <tr key={c.id} className="hover:bg-primary-soft/30 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-900 flex items-center justify-start gap-3 text-left">
                          <div className="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center flex-shrink-0">
                            {c.type === 'Gelas' ? <Beaker className="w-4 h-4 text-emerald-600" /> : <Coffee className="w-4 h-4 text-blue-600" />}
                          </div>
                          {c.name}
                        </td>
                        <td className="px-4 py-3">{c.type}</td>
                        <td className="px-4 py-3 font-semibold text-gray-800 text-center">{c.capacity} L</td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center space-x-1">
                            {c.photoUrl && (
                              <button onClick={() => setPreviewImage(c.photoUrl)} className="text-gray-500 hover:text-gray-700 p-1.5 hover:bg-gray-100 rounded-lg transition-colors" title="Lihat Foto">
                                <Eye className="w-4 h-4" />
                              </button>
                            )}
                            <button onClick={() => handleEditContainer(c)} className="text-blue-500 hover:text-blue-700 p-1.5 hover:bg-blue-50 rounded-lg transition-colors">
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDeleteContainer(c.id)} className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-lg transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Tambah/Edit Wadah */}
      {isContainerModalOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-visible animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-border">
              <h2 className="text-xl font-bold text-gray-900">{editingContainerId ? 'Edit Wadah Saya' : 'Tambah Wadah Baru'}</h2>
              <button onClick={() => { setIsContainerModalOpen(false); setEditingContainerId(null); setContainerForm({ name: '', capacity: 0.6, type: 'Tumbler', photoUrl: '' }); }} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveContainer} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Wadah</label>
                <input
                  type="text" required className="form-input w-full"
                  placeholder="Misal: Tumbler Biru Budi"
                  value={containerForm.name} onChange={e => setContainerForm({...containerForm, name: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kapasitas (Liter)</label>
                  <input
                    type="number" required className="form-input w-full" min="0.1" step="0.1"
                    value={containerForm.capacity} onChange={e => setContainerForm({...containerForm, capacity: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Jenis</label>
                  <Select 
                    value={containerForm.type} 
                    onChange={val => setContainerForm({...containerForm, type: val})}
                    options={[
                      { label: 'Tumbler', value: 'Tumbler', icon: <Coffee className="w-4 h-4 text-blue-600" /> },
                      { label: 'Gelas', value: 'Gelas', icon: <Beaker className="w-4 h-4 text-emerald-600" /> },
                      { label: 'Botol', value: 'Botol', icon: <Coffee className="w-4 h-4 text-blue-600" /> },
                      { label: 'Lainnya', value: 'Lainnya', icon: <Box className="w-4 h-4 text-gray-600" /> },
                    ]}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Foto Wadah</label>
                <div className="flex items-center gap-4">
                  {containerForm.photoUrl ? (
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 flex-shrink-0">
                      <img src={containerForm.photoUrl} alt="Preview" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => setContainerForm({...containerForm, photoUrl: ''})} className="absolute top-0 right-0 bg-red-500/90 hover:bg-red-600 text-white p-0.5 rounded-bl-lg transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 flex-shrink-0">
                      <Camera className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <input type="file" accept="image/*" capture="environment" onChange={handlePhotoUpload} className="hidden" id="photo-upload-user" />
                    <label htmlFor="photo-upload-user" className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary cursor-pointer transition-colors">
                      <Camera className="w-4 h-4 mr-2 text-gray-500" />
                      {containerForm.photoUrl ? 'Ganti Foto' : 'Ambil Foto'}
                    </label>
                    <p className="text-xs text-gray-500 mt-2">Membantu AI mengenali wadah secara otomatis nantinya.</p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => { setIsContainerModalOpen(false); setEditingContainerId(null); setContainerForm({ name: '', capacity: 0.6, type: 'Tumbler', photoUrl: '' }); }} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                  Batal
                </button>
                <button type="submit" disabled={isSaving} className="btn-primary flex items-center">
                  {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Preview Foto */}
      {previewImage && createPortal(
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setPreviewImage(null)}>
          <div className="relative max-w-3xl max-h-[90vh] flex flex-col items-center justify-center" onClick={e => e.stopPropagation()}>
            <button onClick={() => setPreviewImage(null)} className="absolute -top-12 right-0 text-white hover:text-gray-300 p-2 transition-colors">
              <X className="w-8 h-8" />
            </button>
            <img src={previewImage} alt="Preview Foto Wadah" className="max-w-full max-h-[85vh] rounded-xl shadow-2xl object-contain bg-white/10" />
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
