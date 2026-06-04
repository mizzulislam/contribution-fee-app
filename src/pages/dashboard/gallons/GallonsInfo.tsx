import { useState, useEffect } from 'react'
import { Droplets, Info, CheckCircle2, AlertCircle } from 'lucide-react'

export default function GallonsInfo() {
  const [gallons, setGallons] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate fetching gallons stock
    setTimeout(() => {
      setGallons(4)
      setLoading(false)
    }, 800)
  }, [])

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center">
          <Droplets className="mr-3 text-primary w-8 h-8" />
          Informasi Galon
        </h1>
        <p className="text-text-secondary mt-1">Pantau ketersediaan air galon di kos saat ini.</p>
      </div>

      <div className="card-container p-8 text-center bg-gradient-to-b from-white to-primary-soft/10">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Stok Galon Penuh Saat Ini</h2>
        
        <div className="flex justify-center items-center mb-8">
          {loading ? (
            <div className="text-3xl font-bold text-gray-400">Memuat...</div>
          ) : (
            <div className="relative">
              <Droplets className="w-40 h-40 text-primary opacity-20" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-6xl font-black text-primary">{gallons}</span>
              </div>
            </div>
          )}
        </div>

        {gallons > 2 ? (
          <div className="inline-flex items-center text-success bg-success/10 px-4 py-2 rounded-full">
            <CheckCircle2 className="w-5 h-5 mr-2" />
            <span className="font-medium">Stok galon aman</span>
          </div>
        ) : (
          <div className="inline-flex items-center text-orange-600 bg-orange-100 px-4 py-2 rounded-full">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span className="font-medium">Stok menipis, bendahara akan segera memesan.</span>
          </div>
        )}
      </div>

      <div className="card-container p-6 bg-blue-50 border border-blue-100 flex items-start">
        <Info className="w-6 h-6 text-blue-500 mr-3 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-bold mb-1">Informasi</p>
          <p>Jika Anda melihat galon di dispenser sudah habis, silakan ambil dari tempat penyimpanan. Jika stok galon penuh (di atas) menunjukkan angka 0, mohon bersabar karena galon sedang dalam proses pengiriman oleh vendor.</p>
        </div>
      </div>
    </div>
  )
}
