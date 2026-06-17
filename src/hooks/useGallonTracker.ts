import { useState, useEffect } from 'react'
import { spreadsheetApi } from '@/lib/spreadsheet'
import {
  GALLON_CAPACITY,
  calculateGallonStock,
  daysBetween,
  formatGallonQuantity,
  isReliableGallonPrediction,
  parseGallonStockDate,
} from '@/lib/gallonStock'
import { generateSecureId } from '@/utils/id'
import type { Gallon, GallonContainer } from '@/types/database'

interface GallonActivity extends Omit<Gallon, 'id'> {
  id: string | number
}

interface GallonPrediction {
  nextRefillDate: string;
  estimatedGallons: number;
  accuracy: number;
  insight: string;
  chartData: number[];
  chartDataNormalized: number[];
  daysLeft: number;
  avgConsumption: string;
  isReliable: boolean;
}

interface AlertDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  isConfirm: boolean;
  onConfirm: () => void;
}

export function useGallonTracker() {
  const [activities, setActivities] = useState<GallonActivity[]>([])
  const [gallonStock, setGallonStock] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [rotateX, setRotateX] = useState(0)
  const [rotateY, setRotateY] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const [prediction, setPrediction] = useState<GallonPrediction | null>(null)

  // History Edit State
  const [isHistoryEditMode, setIsHistoryEditMode] = useState(false)
  const [historySelectedIds, setHistorySelectedIds] = useState<(string | number)[]>([])
  const [isDeletingHistory, setIsDeletingHistory] = useState(false)
  const [alertDialog, setAlertDialog] = useState<AlertDialogState>({
    isOpen: false,
    title: '',
    message: '',
    isConfirm: false,
    onConfirm: () => {}
  })

  // Container Management State
  const [activeTab, setActiveTab] = useState<'overview' | 'containers'>('overview')
  const [containers, setContainers] = useState<GallonContainer[]>([])
  const [isContainerModalOpen, setIsContainerModalOpen] = useState(false)
  const [editingContainerId, setEditingContainerId] = useState<string | number | null>(null)
  const [containerForm, setContainerForm] = useState({ name: '', capacity: 0.6, type: 'Tumbler', photoUrl: '' })
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  async function fetchData() {
    setLoading(true)
    try {
      const [resContainers, gallonsRes, journalRes] = await Promise.all([
        spreadsheetApi.get('GallonContainers'),
        spreadsheetApi.get('Gallons'),
        spreadsheetApi.get('JournalEntries'),
      ])

      const contData = (Array.isArray(resContainers.data) ? resContainers.data : []) as GallonContainer[]
      setContainers(contData)

      // Fetch usage data (pengurangan)
      const rawData = (Array.isArray(gallonsRes.data) ? gallonsRes.data : []) as Gallon[]
      const journalEntries = Array.isArray(journalRes.data) ? journalRes.data : []
      const usageData = rawData.filter(g => g.type === 'Penggunaan') as GallonActivity[]
      setActivities([...usageData].reverse())

      const stockSummary = calculateGallonStock({
        gallonRows: rawData,
        journalEntries,
      })
      const usedGallons = stockSummary.used
      const finalStock = stockSummary.stock
      setGallonStock(finalStock)

      // Calculate real prediction data
      let avgConsumption = 0
      const chartData = [0, 0, 0, 0, 0, 0, 0] // H-6 to H-0 (Today)

      if (usageData.length > 0) {
        const dates = usageData.map(d => parseGallonStockDate(d.date).getTime()).filter(t => !isNaN(t))
        const oldest = dates.length > 0 ? Math.min(...dates) : new Date().getTime()
        const now = new Date().getTime()
        const daysDiff = daysBetween(new Date(oldest), new Date(now))

        avgConsumption = usedGallons / (daysDiff || 1)

        for (let i = 0; i < 7; i++) {
          const d = new Date(now - (6 - i) * 24 * 3600 * 1000)
          const dateStr = d.toISOString().split('T')[0]
          const dayUsed = usageData.filter(u => u.date === dateStr).reduce((acc, u) => acc + Number(u.quantity), 0)
          chartData[i] = dayUsed
        }
      }

      const isReliable = isReliableGallonPrediction(usageData.length, avgConsumption)
      const daysLeft = isReliable ? finalStock / avgConsumption : 0
      const estDate = isReliable ? new Date(Date.now() + daysLeft * 24 * 3600 * 1000) : null
      const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

      // Normalize chart data for UI height (percentage)
      const maxChartVal = Math.max(...chartData, 0.1) // prevent division by 0
      const chartDataNormalized = chartData.map(val => (val / maxChartVal) * 100)

      setPrediction({
        nextRefillDate: estDate ? `${estDate.getDate()} ${months[estDate.getMonth()]} ${estDate.getFullYear()}` : '-',
        estimatedGallons: isReliable ? Math.ceil(avgConsumption * 14) : 0,
        accuracy: Math.min(100, Math.round((usageData.length / 14) * 100)),
        insight: isReliable
          ? `Berdasarkan riwayat penggunaan yang tersimpan, rata-rata konsumsi harian adalah ${avgConsumption.toFixed(2)} Galon/hari. Stok saat ini diprediksi habis dalam ${Math.floor(daysLeft)} hari.`
          : 'Riwayat penggunaan galon belum cukup kuat untuk membuat prediksi hari habis yang akurat.',
        chartData,
        chartDataNormalized,
        daysLeft: Math.max(0, Math.floor(daysLeft)),
        avgConsumption: formatGallonQuantity(avgConsumption),
        isReliable
      })
    } catch (e) {
      console.error("Gagal memuat data galon:", e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleSaveContainer = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    if (editingContainerId) {
      const payload: GallonContainer = {
        id: String(editingContainerId),
        name: containerForm.name,
        capacity: Number(containerForm.capacity),
        type: containerForm.type,
        photoUrl: containerForm.photoUrl || undefined,
      }

      const res = await spreadsheetApi.put('GallonContainers', payload)
      if (res.success) {
        setContainers(containers.map(c => c.id === String(editingContainerId) ? payload : c))
      } else {
        setAlertDialog({
          isOpen: true,
          title: 'Gagal Menyimpan',
          message: 'Gagal menyimpan wadah ke sumber data.',
          isConfirm: false,
          onConfirm: () => {}
        })
      }
    } else {
      const newId = generateSecureId('GC')
      const payload: GallonContainer = {
        id: newId,
        name: containerForm.name,
        capacity: Number(containerForm.capacity),
        type: containerForm.type,
        photoUrl: containerForm.photoUrl || undefined,
      }

      const res = await spreadsheetApi.post('GallonContainers', payload)
      if (res.success) {
        setContainers([...containers, payload])
      } else {
        setAlertDialog({
          isOpen: true,
          title: 'Gagal Menambahkan',
          message: 'Gagal menambahkan wadah ke sumber data.',
          isConfirm: false,
          onConfirm: () => {}
        })
      }
    }

    setIsContainerModalOpen(false)
    setIsSaving(false)
    setContainerForm({ name: '', capacity: 0.6, type: 'Tumbler', photoUrl: '' })
    setEditingContainerId(null)
  }

  const handleEditContainer = (c: GallonContainer) => {
    setContainerForm({ name: c.name, capacity: c.capacity, type: c.type, photoUrl: c.photoUrl || '' })
    setEditingContainerId(c.id)
    setIsContainerModalOpen(true)
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setContainerForm(prev => ({ ...prev, photoUrl: reader.result as string }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDeleteContainer = (id: string | number) => {
    setAlertDialog({
      isOpen: true,
      title: 'Hapus Wadah',
      message: 'Yakin ingin menghapus wadah ini?',
      isConfirm: true,
      onConfirm: async () => {
        const res = await spreadsheetApi.del('GallonContainers', id)
        if (res.success) {
          setContainers(containers.filter(c => c.id !== String(id)))
          setAlertDialog(prev => ({ ...prev, isOpen: false }))
        } else {
          setAlertDialog({
            isOpen: true,
            title: 'Gagal Menghapus',
            message: 'Gagal menghapus wadah dari sumber data.',
            isConfirm: false,
            onConfirm: () => {}
          })
        }
      }
    })
  }

  const handleDeleteSelectedHistory = () => {
    if (historySelectedIds.length === 0) return
    setAlertDialog({
      isOpen: true,
      title: 'Hapus Riwayat',
      message: `Yakin ingin menghapus ${historySelectedIds.length} riwayat aktivitas?`,
      isConfirm: true,
      onConfirm: async () => {
        setAlertDialog(prev => ({ ...prev, isOpen: false }))
        setIsDeletingHistory(true)
        let hasError = false
        for (const id of historySelectedIds) {
          const res = await spreadsheetApi.del('Gallons', id)
          if (!res.success) hasError = true
        }

        if (hasError) {
          setAlertDialog({
            isOpen: true,
            title: 'Gagal Menghapus',
            message: 'Beberapa data gagal dihapus dari sumber data.',
            isConfirm: false,
            onConfirm: () => {}
          })
        } else {
          setHistorySelectedIds([])
          setIsHistoryEditMode(false)
          fetchData()
        }
        setIsDeletingHistory(false)
      }
    })
  }

  const handleToggleSelectAllHistory = () => {
    if (historySelectedIds.length === activities.length && activities.length > 0) {
      setHistorySelectedIds([])
    } else {
      setHistorySelectedIds(activities.map(a => a.id))
    }
  }

  const handleToggleSelectHistory = (id: string | number) => {
    setHistorySelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
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

  return {
    activities,
    gallonStock,
    loading,
    isSaving,
    rotateX,
    rotateY,
    isHovered,
    setIsHovered,
    prediction,
    isHistoryEditMode,
    setIsHistoryEditMode,
    historySelectedIds,
    setHistorySelectedIds,
    isDeletingHistory,
    alertDialog,
    setAlertDialog,
    activeTab,
    setActiveTab,
    containers,
    setContainers,
    isContainerModalOpen,
    setIsContainerModalOpen,
    editingContainerId,
    setEditingContainerId,
    containerForm,
    setContainerForm,
    previewImage,
    setPreviewImage,
    fetchData,
    handleSaveContainer,
    handleEditContainer,
    handlePhotoUpload,
    handleDeleteContainer,
    handleDeleteSelectedHistory,
    handleToggleSelectAllHistory,
    handleToggleSelectHistory,
    handleMouseMove,
    handleMouseLeave
  }
}
