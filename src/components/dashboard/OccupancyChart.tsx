import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from 'recharts'

const data = [
  { name: 'Kamar Terisi', value: 45 },
  { name: 'Kamar Kosong', value: 5 },
  { name: 'Booking', value: 2 },
]

const COLORS = ['#10B981', '#E5E7EB', '#F59E0B']

export function OccupancyChart() {
  return (
    <div className="card-container flex flex-col h-full min-h-[350px]">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900">Statistik Okupansi</h3>
        <p className="text-sm text-gray-500">Ketersediaan Kamar Saat Ini</p>
      </div>
      
      <div className="flex-1 w-full min-h-[250px] flex items-center justify-center relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={85}
              paddingAngle={5}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
            />
            <Legend verticalAlign="bottom" height={36} iconType="circle" />
          </PieChart>
        </ResponsiveContainer>
        
        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
          <span className="text-3xl font-bold text-gray-900">90%</span>
          <span className="text-xs font-semibold text-[#10B981]">Terisi</span>
        </div>
      </div>
    </div>
  )
}
