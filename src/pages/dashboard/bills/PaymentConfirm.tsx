import { useState } from 'react'
import { UploadCloud, FileText, CheckCircle2, Loader2 } from 'lucide-react'
import Select from '@/components/ui/Select'
import { spreadsheetApi } from '@/lib/spreadsheet'

export default function PaymentConfirm() {
  const [billId, setBillId] = useState('')
  const [bankTarget, setBankTarget] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState('')
  const [note, setNote] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    const payload = {
      id: Date.now(),
      billId,
      bankTarget,
      amount: Number(amount),
      date,
      note,
      fileName: file?.name || '',
      status: 'Menunggu Verifikasi',
      created_at: new Date().toISOString()
    }

    try {
      await spreadsheetApi.post('Payments', payload)
    } catch (err) {
      console.error(err)
    }

    setIsSubmitting(false)
    setIsSuccess(true)
  }

  if (isSuccess) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto mt-10">
        <div className="card-container p-10 text-center flex flex-col items-center">
          <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="w-10 h-10 text-success" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Konfirmasi Berhasil Dikirim!</h2>
          <p className="text-text-secondary mb-8">
            Bukti pembayaran Anda telah kami terima dan sedang menunggu verifikasi dari Bendahara. 
            Proses verifikasi biasanya memakan waktu 1x24 jam.
          </p>
          <button 
            onClick={() => setIsSuccess(false)}
            className="btn-primary"
          >
            Kirim Konfirmasi Lainnya
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center">
          <UploadCloud className="mr-3 text-primary w-8 h-8" />
          Konfirmasi Pembayaran
        </h1>
        <p className="text-text-secondary mt-1">Unggah bukti transfer untuk ditinjau oleh Bendahara.</p>
      </div>

      <div className="card-container p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Tagihan</label>
              <Select 
                className="w-full text-sm"
                placeholder="-- Pilih Tagihan yang Dibayar --"
                value={billId}
                onChange={setBillId}
                options={[
                  { label: 'Iuran Wajib Bulanan - Juni 2026 (Rp 500.000)', value: '1' },
                  { label: 'Iuran Sampah - Juni 2026 (Rp 25.000)', value: '2' }
                ]}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nominal Transfer (Rp)</label>
              <input 
                type="number" 
                required
                className="form-input" 
                placeholder="Contoh: 500000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal Transfer</label>
              <input 
                type="date" 
                required
                className="form-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bank Tujuan</label>
              <Select 
                className="w-full text-sm"
                placeholder="-- Pilih Bank Tujuan --"
                value={bankTarget}
                onChange={setBankTarget}
                options={[
                  { label: 'BCA - 1234567890 a.n Bendahara Kos', value: 'bca' },
                  { label: 'Mandiri - 0987654321 a.n Bendahara Kos', value: 'mandiri' },
                  { label: 'BNI - 1122334455 a.n Bendahara Kos', value: 'bni' }
                ]}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Unggah Bukti Transfer</label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-xl hover:border-primary transition-colors bg-gray-50/50">
              <div className="space-y-2 text-center">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600 justify-center">
                  <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary-dark focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary px-2 py-1">
                    <span>Pilih file</span>
                    <input 
                      id="file-upload" 
                      name="file-upload" 
                      type="file" 
                      className="sr-only"
                      accept="image/*,.pdf"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      required
                    />
                  </label>
                  <p className="pl-1 py-1">atau drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">PNG, JPG, PDF maksimal 5MB</p>
                {file && (
                  <div className="text-sm font-medium text-success mt-2">
                    File terpilih: {file.name}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Catatan Tambahan (Opsional)</label>
            <textarea 
              rows={3} 
              className="form-input resize-none" 
              placeholder="Tulis pesan untuk bendahara jika diperlukan..."
              value={note}
              onChange={e => setNote(e.target.value)}
            ></textarea>
          </div>

          <div className="pt-4 flex justify-end">
            <button 
              type="submit" 
              className="btn-primary w-full sm:w-auto min-w-[200px] flex items-center justify-center"
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
              {isSubmitting ? 'Mengirim...' : 'Kirim Konfirmasi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
