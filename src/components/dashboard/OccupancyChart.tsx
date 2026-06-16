import { useEffect, useMemo, useState } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { Loader2 } from 'lucide-react'
import { spreadsheetApi } from '@/lib/spreadsheet'

interface UserRow {
  role?: string
  status?: string
  room_number?: string
}

const COLORS = ['#10B981', '#E5E7EB']

export function OccupancyChart() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function fetchOccupancy() {
      setLoading(true)
      const { data } = await spreadsheetApi.get('Users')
      if (!isMounted) return
      setUsers(Array.isArray(data) ? data : [])
      setLoading(false)
    }

    fetchOccupancy()
    return () => {
      isMounted = false
    }
  }, [])

  const data = useMemo(() => {
    const activeResidents = users.filter(user =>
      String(user.status || '').toLowerCase() === 'aktif' &&
      String(user.role || '').toLowerCase().includes('user') &&
      Boolean(user.room_number)
    )
    const occupiedRooms = new Set(activeResidents.map(user => user.room_number)).size

    return [
      { name: 'Kamar Terisi', value: occupiedRooms },
      { name: 'Data Kamar Kosong Belum Tersedia', value: 0 },
    ]
  }, [users])

  const occupiedRooms = data[0].value

  return (
    <div className="card-container flex flex-col h-full min-h-[350px]">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900">Statistik Okupansi</h3>
        <p className="text-sm text-gray-500">Dihitung dari penghuni aktif yang memiliki nomor kamar.</p>
      </div>

      <div className="flex-1 w-full min-h-[250px] flex items-center justify-center relative">
        {loading ? (
          <div className="flex items-center text-emerald-700">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Memuat okupansi...
          </div>
        ) : occupiedRooms === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 px-6 py-10 text-center text-sm text-gray-500">
            Belum ada data kamar terisi.
          </div>
        ) : (
          <>
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
                    <Cell key={`cell-${entry.name}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>

            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
              <span className="text-3xl font-bold text-gray-900">{occupiedRooms}</span>
              <span className="text-xs font-semibold text-[#10B981]">Kamar Terisi</span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
