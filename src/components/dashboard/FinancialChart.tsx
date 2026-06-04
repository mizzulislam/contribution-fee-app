import { useState } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

const monthlyData = [
  { name: 'Jan', pemasukan: 4000, pengeluaran: 2400 },
  { name: 'Feb', pemasukan: 3000, pengeluaran: 1398 },
  { name: 'Mar', pemasukan: 2000, pengeluaran: 9800 },
  { name: 'Apr', pemasukan: 2780, pengeluaran: 3908 },
  { name: 'Mei', pemasukan: 1890, pengeluaran: 4800 },
  { name: 'Jun', pemasukan: 2390, pengeluaran: 3800 },
  { name: 'Jul', pemasukan: 3490, pengeluaran: 4300 },
]

const weeklyData = [
  { name: 'Mg 1', pemasukan: 1200, pengeluaran: 800 },
  { name: 'Mg 2', pemasukan: 1500, pengeluaran: 1100 },
  { name: 'Mg 3', pemasukan: 900, pengeluaran: 1500 },
  { name: 'Mg 4', pemasukan: 1800, pengeluaran: 950 },
]

const dailyData = [
  { name: 'Sen', pemasukan: 200, pengeluaran: 150 },
  { name: 'Sel', pemasukan: 300, pengeluaran: 100 },
  { name: 'Rab', pemasukan: 150, pengeluaran: 400 },
  { name: 'Kam', pemasukan: 400, pengeluaran: 200 },
  { name: 'Jum', pemasukan: 500, pengeluaran: 300 },
  { name: 'Sab', pemasukan: 800, pengeluaran: 100 },
  { name: 'Min', pemasukan: 100, pengeluaran: 50 },
]

type TimeRange = 'harian' | 'mingguan' | 'bulanan'

export function FinancialChart() {
  const [timeRange, setTimeRange] = useState<TimeRange>('bulanan')

  const getData = () => {
    switch (timeRange) {
      case 'harian': return dailyData
      case 'mingguan': return weeklyData
      case 'bulanan': return monthlyData
    }
  }

  const getTitle = () => {
    switch (timeRange) {
      case 'harian': return '7 Hari Terakhir'
      case 'mingguan': return '4 Minggu Terakhir'
      case 'bulanan': return '6 Bulan Terakhir'
    }
  }

  return (
    <div className="card-container flex flex-col h-full min-h-[350px]">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Arus Kas ({getTitle()})</h3>
          <p className="text-sm text-gray-500">Perbandingan Pemasukan & Pengeluaran Kos</p>
        </div>
        
        {/* Slicer / Time Filter */}
        <div className="flex items-center bg-gray-100 p-1 rounded-xl w-fit">
          <button 
            onClick={() => setTimeRange('harian')}
            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${timeRange === 'harian' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Harian
          </button>
          <button 
            onClick={() => setTimeRange('mingguan')}
            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${timeRange === 'mingguan' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Mingguan
          </button>
          <button 
            onClick={() => setTimeRange('bulanan')}
            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${timeRange === 'bulanan' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Bulanan
          </button>
        </div>
      </div>
      
      <div className="flex-1 w-full min-h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={getData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPemasukan" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorPengeluaran" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} dy={10} />
            <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} dx={-10} tickFormatter={(val) => `Rp${val/1000}k`} />
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}
              formatter={(value: any) => [`Rp ${Number(value).toLocaleString()}`, '']}
            />
            <Area type="monotone" dataKey="pemasukan" name="Pemasukan" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorPemasukan)" />
            <Area type="monotone" dataKey="pengeluaran" name="Pengeluaran" stroke="#EF4444" strokeWidth={3} fillOpacity={1} fill="url(#colorPengeluaran)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
