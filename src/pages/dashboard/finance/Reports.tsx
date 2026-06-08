import { useState } from 'react'
import { FileLineChart, TrendingUp, TrendingDown, Download, Calendar } from 'lucide-react'
import Select from '@/components/ui/Select'

export default function Reports() {
  const [period, setPeriod] = useState('Juni 2026')

  // Mock data for the report
  const summary = {
    totalIncome: 12500000,
    totalExpense: 1450000,
    netBalance: 11050000,
    expectedIncome: 15000000
  }

  const transactions = [
    { id: 1, date: '2026-06-10', description: 'Iuran Kamar 101 - Budi', type: 'income', amount: 1500000 },
    { id: 2, date: '2026-06-08', description: 'Iuran Kamar 102 - Siti', type: 'income', amount: 1500000 },
    { id: 3, date: '2026-06-05', description: 'Beli 3 Galon Aqua', type: 'expense', amount: 60000 },
    { id: 4, date: '2026-06-01', description: 'Iuran Sampah RT', type: 'expense', amount: 50000 },
  ]

  const formatCurrency = (amount: number) => {
    return (
      <div className="flex justify-between items-center w-full min-w-[80px]">
        <span className="text-gray-500 mr-2">Rp</span>
        <span>{new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(amount)}</span>
      </div>
    )
  }

  const downloadCSV = () => {
    const headers = ['ID', 'Tanggal', 'Keterangan', 'Jenis', 'Nominal']
    const csvContent = [
      headers.join(','),
      ...transactions.map(t => `${t.id},${t.date},"${t.description}",${t.type},${t.amount}`)
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `laporan_keuangan_${period.replace(' ', '_').toLowerCase()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center">
            <FileLineChart className="mr-3 text-primary w-8 h-8" />
            Laporan Keuangan
          </h1>
          <p className="text-text-secondary mt-1">Rekapitulasi pemasukan dan pengeluaran kas kos.</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Select 
              className="w-40 text-sm"
              value={period}
              onChange={setPeriod}
              options={[
                { label: 'Juni 2026', value: 'Juni 2026' },
                { label: 'Mei 2026', value: 'Mei 2026' },
                { label: 'April 2026', value: 'April 2026' }
              ]}
            />
          </div>
          <button 
            onClick={downloadCSV}
            className="btn-primary flex items-center whitespace-nowrap bg-gray-900 hover:bg-gray-800 text-white"
          >
            <Download className="w-5 h-5 mr-2" />
            Unduh CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-border rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-full bg-[#ECFDF5] flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-[#10B981]" />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Pemasukan</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{formatCurrency(summary.totalIncome)}</p>
            <p className="text-xs text-text-muted mt-2">Dari target {formatCurrency(summary.expectedIncome)}</p>
          </div>
        </div>

        <div className="bg-white border border-border rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Pengeluaran</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{formatCurrency(summary.totalExpense)}</p>
            <p className="text-xs text-text-muted mt-2">Operasional rutin bulan {period}</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#10B981] to-[#047857] rounded-xl p-6 shadow-md flex flex-col justify-between text-white">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <FileLineChart className="w-6 h-6 text-white" />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-white/80">Saldo Kas Bersih</p>
            <p className="text-3xl font-bold text-white mt-1">{formatCurrency(summary.netBalance)}</p>
            <p className="text-xs text-white/70 mt-2">Masuk - Keluar</p>
          </div>
        </div>
      </div>

      <div className="card-container mt-8">
        <div className="p-4 sm:p-6 border-b border-border">
          <h2 className="text-lg font-bold text-gray-900">Rincian Transaksi ({period})</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50/80 text-gray-700 text-xs uppercase font-semibold border-b border-border">
              <tr>
                <th className="px-6 py-4">Tanggal</th>
                <th className="px-6 py-4">Keterangan</th>
                <th className="px-6 py-4">Jenis</th>
                <th className="px-6 py-4 text-right">Nominal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">Tidak ada transaksi di periode ini.</td>
                </tr>
              ) : (
                transactions.map((item) => (
                  <tr key={item.id} className="hover:bg-primary-soft/30 transition-colors">
                    <td className="px-6 py-4">{item.date}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{item.description}</td>
                    <td className="px-6 py-4">
                      {item.type === 'income' ? (
                        <span className="bg-success/10 text-success px-2.5 py-1 rounded-md text-xs font-medium">Pemasukan</span>
                      ) : (
                        <span className="bg-danger/10 text-danger px-2.5 py-1 rounded-md text-xs font-medium">Pengeluaran</span>
                      )}
                    </td>
                    <td className={`px-6 py-4 font-bold text-right ${item.type === 'income' ? 'text-success' : 'text-danger'}`}>
                      {item.type === 'income' ? '+' : '-'} {formatCurrency(item.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
