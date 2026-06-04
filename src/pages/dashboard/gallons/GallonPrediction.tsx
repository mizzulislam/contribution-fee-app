import { useState, useEffect } from 'react'
import { Brain, TrendingUp, AlertCircle, Calendar } from 'lucide-react'

export default function GallonPrediction() {
  const [loading, setLoading] = useState(true)
  const [prediction, setPrediction] = useState<any>(null)

  useEffect(() => {
    // Simulate AI model processing time
    setTimeout(() => {
      setPrediction({
        nextRefillDate: '06 Juni 2026',
        estimatedGallons: 12,
        accuracy: 94,
        insight: 'Konsumsi air diprediksi meningkat akhir pekan ini karena cuaca panas ekstrim dan libur.'
      })
      setLoading(false)
    }, 1500)
  }, [])

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center">
          <Brain className="mr-3 text-primary w-8 h-8" />
          AI Prediksi Kebutuhan Galon
        </h1>
        <p className="text-text-secondary mt-1">Menggunakan machine learning untuk memprediksi kapan stok galon akan habis.</p>
      </div>

      {loading ? (
        <div className="card-container p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
          <Brain className="w-16 h-16 text-primary animate-pulse mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">Menganalisis Data Pemakaian...</h2>
          <p className="text-gray-500 mt-2">Model AI sedang mempelajari pola konsumsi air penghuni 3 bulan terakhir.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="col-span-1 md:col-span-2 space-y-6">
            <div className="card-container p-6 bg-gradient-to-br from-white to-primary-soft/20 border-l-4 border-l-primary relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Brain className="w-32 h-32" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">Hasil Prediksi Sistem</h2>
              
              <div className="mt-6 flex flex-col sm:flex-row gap-6">
                <div>
                  <p className="text-sm text-text-secondary mb-1">Perkiraan Habis Pada</p>
                  <div className="text-2xl font-black text-primary flex items-center">
                    <Calendar className="w-6 h-6 mr-2" /> {prediction.nextRefillDate}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-text-secondary mb-1">Rekomendasi Pesanan</p>
                  <div className="text-2xl font-black text-gray-900 flex items-center">
                    <TrendingUp className="w-6 h-6 mr-2 text-success" /> {prediction.estimatedGallons} Galon
                  </div>
                </div>
              </div>

              <div className="mt-6 bg-white/80 p-4 rounded-lg border border-primary/20 backdrop-blur-sm relative z-10">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-primary mr-3 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Insight AI</p>
                    <p className="text-sm text-gray-700">{prediction.insight}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="card-container p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Tren Konsumsi Mingguan</h2>
              <div className="h-48 flex items-end space-x-2 w-full justify-between mt-8">
                {/* Dummy chart */}
                {[4, 6, 5, 8, 7, 5, 9].map((val, i) => (
                  <div key={i} className="flex flex-col items-center w-full group">
                    <div className="w-full bg-primary-soft/50 rounded-t-sm group-hover:bg-primary transition-colors relative" style={{ height: `${val * 10}%` }}>
                      <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">{val}</span>
                    </div>
                    <span className="text-xs text-gray-400 mt-2">H-{7-i}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="col-span-1 space-y-6">
            <div className="card-container p-6 text-center">
              <div className="relative w-32 h-32 mx-auto flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path className="text-gray-200" strokeWidth="4" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className="text-success" strokeDasharray={`${prediction.accuracy}, 100`} strokeWidth="4" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold">{prediction.accuracy}%</span>
                </div>
              </div>
              <h3 className="font-semibold text-gray-900 mt-4">Akurasi Prediksi</h3>
              <p className="text-xs text-text-muted mt-1">Berdasarkan komparasi data real dan prediksi sebelumnya.</p>
            </div>
            
            <button className="btn-primary w-full py-3">Pesan Galon Sekarang</button>
          </div>
        </div>
      )}
    </div>
  )
}
