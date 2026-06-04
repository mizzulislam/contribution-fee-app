import { useState, useEffect } from 'react'
import { spreadsheetApi } from '@/lib/spreadsheet'
import { PieChart, ArrowUpRight, ArrowDownRight, Wallet } from 'lucide-react'

export default function CashReports() {
  const [data, setData] = useState({ incoming: 0, outgoing: 0, balance: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate fetching transparent data for users
    setTimeout(() => {
      setData({
        incoming: 15500000,
        outgoing: 4200000,
        balance: 11300000
      })
      setLoading(false)
    }, 1000)
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center">
            <PieChart className="mr-3 text-primary w-8 h-8" />
            Transparansi Kas Kos
          </h1>
          <p className="text-text-secondary mt-1">Laporan mutasi kas bulanan yang dapat dipantau oleh seluruh penghuni.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card-container p-6 bg-white flex flex-col justify-center">
          <div className="flex items-center text-text-secondary mb-2">
            <Wallet className="w-5 h-5 mr-2" />
            <span className="font-medium">Saldo Kas Saat Ini</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {loading ? '...' : formatCurrency(data.balance)}
          </div>
        </div>

        <div className="card-container p-6 bg-white flex flex-col justify-center">
          <div className="flex items-center text-success mb-2">
            <ArrowUpRight className="w-5 h-5 mr-2" />
            <span className="font-medium">Pemasukan (Bulan Ini)</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {loading ? '...' : formatCurrency(data.incoming)}
          </div>
        </div>

        <div className="card-container p-6 bg-white flex flex-col justify-center">
          <div className="flex items-center text-danger mb-2">
            <ArrowDownRight className="w-5 h-5 mr-2" />
            <span className="font-medium">Pengeluaran (Bulan Ini)</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {loading ? '...' : formatCurrency(data.outgoing)}
          </div>
        </div>
      </div>

      <div className="card-container p-6 sm:p-8 text-center bg-primary-soft/10 border border-primary/20">
        <h3 className="text-lg font-bold text-gray-900 mb-2">Grafik dan Rincian Mendetail</h3>
        <p className="text-text-secondary mb-4">Fitur ini sedang dalam pengembangan. Ke depannya Anda dapat melihat rincian riwayat transaksi yang lebih mendetail terkait operasional kos.</p>
      </div>
    </div>
  )
}
