import { useState, useMemo } from 'react'
import { Search, Users, Edit, Trash2, Shield } from 'lucide-react'
import Select from '@/components/ui/Select'
import { TableLoader } from '@/components/ui/TableLoader'
import { SortDropdown } from '@/components/ui/SortDropdown'

export interface WargaTableProps {
  users: any[]
  loading: boolean
  search: string
  setSearch: (val: string) => void
  roleFilter: string
  setRoleFilter: (val: string) => void
  onEdit: (user: any) => void
  onDelete: (id: number | string) => void
}

export function WargaTable({
  users,
  loading,
  search,
  setSearch,
  roleFilter,
  setRoleFilter,
  onEdit,
  onDelete
}: WargaTableProps) {
  const [sortBy, setSortBy] = useState<string>('full_name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = 
        u.full_name?.toLowerCase().includes(search.toLowerCase()) || 
        u.email?.toLowerCase().includes(search.toLowerCase()) ||
        String(u.role || '').toLowerCase().includes(search.toLowerCase())
      
      const matchesRole = roleFilter === '' || String(u.role || '').toLowerCase().split(',').map(r => r.trim()).includes(roleFilter)
      
      return matchesSearch && matchesRole
    })
  }, [users, search, roleFilter])

  const sortedUsers = useMemo(() => {
    return [...filteredUsers].sort((a, b) => {
      let valA: any = ''
      let valB: any = ''

      if (sortBy === 'full_name') {
        valA = (a.full_name || a.name || '').toLowerCase()
        valB = (b.full_name || b.name || '').toLowerCase()
      } else if (sortBy === 'role') {
        valA = String(a.role || '').toLowerCase()
        valB = String(b.role || '').toLowerCase()
      } else if (sortBy === 'status') {
        valA = String(a.status || '').toLowerCase()
        valB = String(b.status || '').toLowerCase()
      } else if (sortBy === 'room_number') {
        const roomA = a.room_number || a.rooms?.room_number || ''
        const roomB = b.room_number || b.rooms?.room_number || ''
        valA = Number(roomA) || roomA
        valB = Number(roomB) || roomB
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1
      return 0
    })
  }, [filteredUsers, sortBy, sortOrder])

  const getRoleBadge = (roleStr: string | number | undefined | null) => {
    if (!roleStr) return <span className="text-gray-400">-</span>
    const safeRoleStr = String(roleStr)
    const roles = safeRoleStr.toLowerCase().split(',').map(r => r.trim())
    return (
      <div className="flex flex-wrap gap-1">
        {roles.includes('super admin') && <span className="badge badge-danger"><Shield className="w-3 h-3 mr-1" /> Super Admin</span>}
        {roles.includes('admin') && <span className="badge badge-info">Bendahara</span>}
        {roles.includes('user') && <span className="badge badge-success">Warga</span>}
      </div>
    )
  }

  return (
    <div className="card-container p-0 overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-border flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50/50">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Cari nama, email, atau role..." 
            className="form-input pl-10 bg-white h-[42px]"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Select 
            className="w-full sm:w-44 text-sm"
            value={roleFilter}
            onChange={(val) => setRoleFilter(val)}
            options={[
              { label: 'Semua Role', value: '' },
              { label: 'Super Admin', value: 'super admin' },
              { label: 'Bendahara', value: 'admin' },
              { label: 'Warga', value: 'user' }
            ]}
          />
          <SortDropdown
            options={[
              { label: 'Nama Pengguna', value: 'full_name' },
              { label: 'Role', value: 'role' },
              { label: 'Status', value: 'status' },
              { label: 'Nomor Kamar', value: 'room_number' }
            ]}
            sortBy={sortBy}
            onSortByChange={setSortBy}
            sortOrder={sortOrder}
            onSortOrderChange={setSortOrder}
          />
        </div>
      </div>
      
      <div className="overflow-x-auto w-full">
        <table className="min-w-[750px] w-full text-left text-sm">
          <thead className="bg-[#F8FAFC] border-b border-border text-gray-600 uppercase font-semibold text-xs">
            <tr>
              <th className="px-6 py-4 whitespace-nowrap text-left">Nama Pengguna</th>
              <th className="px-6 py-4 whitespace-nowrap text-left">Role</th>
              <th className="px-6 py-4 whitespace-nowrap text-center">Status</th>
              <th className="px-6 py-4 whitespace-nowrap text-left">Kamar</th>
              <th className="px-6 py-4 whitespace-nowrap text-left">Kontak</th>
              <th className="px-6 py-4 whitespace-nowrap text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-gray-700 bg-white">
            {loading ? (
              <TableLoader colSpan={6} />
            ) : sortedUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-text-muted flex flex-col items-center">
                  <Users className="w-8 h-8 text-gray-300 mb-2" />
                  Belum ada pengguna ditemukan.
                </td>
              </tr>
            ) : (
              sortedUsers.map((r) => (
                <tr key={r.id} className="hover:bg-primary-soft/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">
                      {r.full_name || r.name} {r.nickname && <span className="text-gray-500 font-normal">({r.nickname})</span>}
                    </div>
                    <div className="text-xs text-text-muted mt-0.5">{r.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-start">
                      {getRoleBadge(r.role)}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${r.status === 'Aktif' ? 'bg-emerald-100 text-emerald-700' : (r.status === 'Pending' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700')}`}>
                      {r.status || 'Tidak Diketahui'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {r.room_number || r.rooms?.room_number ? (
                      <span className="font-medium text-gray-700">Kamar {r.room_number || r.rooms?.room_number}</span>
                    ) : (
                      <span className="text-text-muted">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">{r.phone_number || <span className="text-text-muted">-</span>}</td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center space-x-2">
                      <button 
                        onClick={() => onEdit(r)}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors" 
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => onDelete(r.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" 
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
