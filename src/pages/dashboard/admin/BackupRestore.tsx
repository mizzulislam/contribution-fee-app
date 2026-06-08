import { useState } from 'react'
import { DatabaseBackup, Download, Upload, Clock, Loader2 } from 'lucide-react'
import { spreadsheetApi } from '@/lib/spreadsheet'

export default function BackupRestore() {
  const [loading, setLoading] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [restoreProgress, setRestoreProgress] = useState('')

  const handleBackup = async () => {
    try {
      setLoading(true)
      
      // Fetch all important tables
      const tablesToBackup = [
        'Users', 'Gallons', 'Payments', 'MasterData', 'PaymentMethods', 
        'JournalEntries', 'Expenses', 'Bills', 'Bailouts', 'Schedules', 
        'Contributions', 'Settings'
      ]
      
      const backupData: Record<string, any> = {}
      
      // Fetch concurrently to save time, or sequentially to avoid rate limit. 
      // Sequentially is safer for simple Apps Script deployments.
      for (const table of tablesToBackup) {
        try {
          const res = await spreadsheetApi.get(table)
          backupData[table] = res.data || []
        } catch (err) {
          console.warn(`Gagal memuat tabel ${table} untuk backup`, err)
        }
      }
      
      // Add metadata
      const backupPayload = {
        metadata: {
          app_name: "Soematra Kost",
          backup_date: new Date().toISOString(),
          version: "1.0"
        },
        data: backupData
      }
      
      // Create and download file
      const blob = new Blob([JSON.stringify(backupPayload, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `soematrakost_backup_${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
    } catch (error) {
      console.error("Backup failed", error)
      alert("Terjadi kesalahan saat membuat backup.")
    } finally {
      setLoading(false)
    }
  }

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!confirm('PERINGATAN: Proses ini akan menghapus semua data saat ini dan menggantinya dengan data dari file backup. Apakah Anda yakin ingin melanjutkan?')) {
      e.target.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        setRestoring(true)
        const content = event.target?.result as string
        const parsed = JSON.parse(content)

        if (!parsed.metadata || !parsed.data) {
          throw new Error('Format file backup tidak valid.')
        }

        const tables = Object.keys(parsed.data)
        for (let i = 0; i < tables.length; i++) {
          const table = tables[i]
          setRestoreProgress(`Memulihkan tabel ${table} (${i + 1}/${tables.length})...`)
          const tableData = parsed.data[table]
          if (Array.isArray(tableData)) {
            const res = await spreadsheetApi.restore(table, tableData)
            if (!res.success) {
              console.warn(`Gagal memulihkan tabel ${table}`, res.error)
            }
          }
        }

        alert('Proses restore data selesai! Halaman akan dimuat ulang.')
        window.location.reload()
      } catch (error: any) {
        console.error("Restore failed", error)
        alert("Gagal melakukan restore: " + (error.message || 'File rusak atau tidak valid.'))
      } finally {
        setRestoring(false)
        setRestoreProgress('')
        e.target.value = ''
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center">
          <DatabaseBackup className="mr-3 text-primary w-8 h-8" />
          Backup & Restore Data
        </h1>
        <p className="text-text-secondary mt-1">Buat cadangan data aplikasi untuk mencegah kehilangan data.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card-container p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <Download className="w-5 h-5 mr-2 text-primary" /> Backup Manual
          </h2>
          <p className="text-sm text-text-secondary mb-6">Unduh seluruh data (penghuni, transaksi, pengaturan) dalam format aman.</p>
          
          <button 
            className="btn-primary w-full flex items-center justify-center"
            onClick={handleBackup}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Sedang Mengunduh...
              </>
            ) : 'Mulai Backup Sekarang'}
          </button>
          
          <div className="mt-4 flex items-start text-xs text-gray-500 bg-gray-50 p-3 rounded">
            <Clock className="w-4 h-4 mr-2 flex-shrink-0" />
            <p>Data yang tersimpan di Google Sheets sudah otomatis ter-backup di server Google.</p>
          </div>
        </div>

        <div className="card-container p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <Upload className="w-5 h-5 mr-2 text-warning" /> Restore Data
          </h2>
          <p className="text-sm text-text-secondary mb-6">Unggah file backup sebelumnya untuk mengembalikan keadaan sistem.</p>
          
          <label className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center transition-colors cursor-pointer ${restoring ? 'border-primary bg-primary-soft/10' : 'border-gray-300 hover:bg-gray-50'}`}>
            <input 
              type="file" 
              accept=".json" 
              className="hidden" 
              onChange={handleRestore}
              disabled={restoring}
            />
            {restoring ? (
              <>
                <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
                <p className="text-sm font-bold text-primary">{restoreProgress || 'Mempersiapkan restore...'}</p>
                <p className="text-xs text-primary mt-1">Jangan tutup halaman ini</p>
              </>
            ) : (
              <>
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <p className="text-sm font-medium text-gray-700">Pilih file .json hasil backup</p>
                <p className="text-xs text-gray-500 mt-1">Maksimal 50MB</p>
              </>
            )}
          </label>
        </div>
      </div>
    </div>
  )
}
