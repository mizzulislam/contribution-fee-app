import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

const data = [
  { name: 'Jan', tagihan: 1500000, air: 50000 },
  { name: 'Feb', tagihan: 1500000, air: 60000 },
  { name: 'Mar', tagihan: 1500000, air: 45000 },
  { name: 'Apr', tagihan: 1500000, air: 55000 },
  { name: 'Mei', tagihan: 1500000, air: 50000 },
  { name: 'Jun', tagihan: 1500000, air: 0 },
]

export function UserActivityChart() {
  return (
    <div className="card-container flex flex-col h-full min-h-[350px]">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900">Riwayat Pembayaran</h3>
        <p className="text-sm text-gray-500">Tagihan Kos & Air (6 Bulan Terakhir)</p>
      </div>
      
      <div className="flex-1 w-full min-h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} dy={10} />
            <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} dx={-10} tickFormatter={(val) => `Rp${val/1000}k`} />
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
              formatter={(value: any) => [`Rp ${Number(value).toLocaleString()}`, '']}
              cursor={{ fill: '#F3F4F6' }}
            />
            <Bar dataKey="tagihan" name="Tagihan Kos" fill="#10B981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="air" name="Tagihan Air" fill="#3B82F6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
