import { useState, useMemo } from 'react'
import { Edit, Trash2, Search } from 'lucide-react'
import type { Account } from '@/features/accounting/data/chartOfAccounts'
import { TableLoader } from '@/components/ui/TableLoader'
import { SortDropdown } from '@/components/ui/SortDropdown'

export interface CategoryTableProps {
  categories: Account[]
  loading?: boolean
  onEdit: (cat: any) => void
  onDelete: (id: string | number) => void
}

export function CategoryTable({ categories, loading, onEdit, onDelete }: CategoryTableProps) {
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<string>('account_number')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  const filteredCategories = useMemo(() => {
    return categories.filter(cat => 
      (cat.account_name && cat.account_name.toLowerCase().includes(search.toLowerCase())) ||
      (cat.account_number && cat.account_number.toLowerCase().includes(search.toLowerCase())) ||
      (cat.account_type && cat.account_type.toLowerCase().includes(search.toLowerCase()))
    )
  }, [categories, search])

  const sortedCategories = useMemo(() => {
    return [...filteredCategories].sort((a, b) => {
      let valA: any = ''
      let valB: any = ''

      if (sortBy === 'account_number') {
        valA = (a.account_number || '').toLowerCase()
        valB = (b.account_number || '').toLowerCase()
      } else if (sortBy === 'account_name') {
        valA = (a.account_name || '').toLowerCase()
        valB = (b.account_name || '').toLowerCase()
      } else if (sortBy === 'account_type') {
        valA = (a.account_type || '').toLowerCase()
        valB = (b.account_type || '').toLowerCase()
      } else if (sortBy === 'status') {
        valA = (a.status || '').toLowerCase()
        valB = (b.status || '').toLowerCase()
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1
      return 0
    })
  }, [filteredCategories, sortBy, sortOrder])

  return (
    <div className="card-container p-0 overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-border flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50/50">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Cari nama akun, nomor, atau tipe..." 
            className="form-input pl-10 bg-white h-[42px]"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <SortDropdown
            options={[
              { label: 'No. Akun', value: 'account_number' },
              { label: 'Nama Akun', value: 'account_name' },
              { label: 'Tipe Akun', value: 'account_type' },
              { label: 'Status', value: 'status' }
            ]}
            sortBy={sortBy}
            onSortByChange={setSortBy}
            sortOrder={sortOrder}
            onSortOrderChange={setSortOrder}
          />
        </div>
      </div>

      <div className="overflow-x-auto w-full">
        <table className="min-w-[650px] w-full text-left text-sm text-gray-600">
          <thead className="bg-[#F8FAFC] text-gray-700 text-xs uppercase font-semibold border-b border-border">
            <tr>
              <th className="px-6 py-4">Tipe Akun</th>
              <th className="px-6 py-4">No. Akun</th>
              <th className="px-6 py-4">Nama Akun</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <TableLoader colSpan={5} />
            ) : sortedCategories.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  Belum ada data kategori.
                </td>
              </tr>
            ) : (
              sortedCategories.map((cat, idx) => (
                <tr key={idx} className="hover:bg-primary-soft/30 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{cat.account_type}</td>
                  <td className="px-6 py-4"><span className="font-mono bg-gray-100 px-2 py-1 rounded text-sm">{cat.account_number}</span></td>
                  <td className="px-6 py-4">{cat.account_name}</td>
                  <td className="px-6 py-4">
                    <span className={cat.status === 'Aktif' ? 'badge badge-success' : 'badge bg-gray-200 text-gray-600'}>
                      {cat.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center space-x-2">
                    <button onClick={() => onEdit(cat)} className="text-blue-600 hover:text-blue-900 p-1 bg-blue-50 hover:bg-blue-100 rounded">
                      <Edit className="w-4 h-4" />
                    </button>
                    {!cat.is_default && (
                      <button onClick={() => onDelete(cat.account_number)} className="text-red-600 hover:text-red-900 p-1 bg-red-50 hover:bg-red-100 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
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
