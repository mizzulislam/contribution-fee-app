import { useState, useMemo } from 'react'
import { Edit, Trash2, Search } from 'lucide-react'
import { TableLoader } from '@/components/ui/TableLoader'
import { SortDropdown } from '@/components/ui/SortDropdown'

export interface PaymentMethod {
  id: string | number
  bank_name: string
  account_name: string
  account_number: string
  status: string
}

export interface PaymentMethodTableProps {
  paymentMethods: PaymentMethod[]
  loading?: boolean
  onEdit: (pm: PaymentMethod) => void
  onDelete: (id: string | number) => void
}

export function PaymentMethodTable({ paymentMethods, loading, onEdit, onDelete }: PaymentMethodTableProps) {
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<string>(() => localStorage.getItem('soematra_sort_payment_by') || 'bank_name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(() => (localStorage.getItem('soematra_sort_payment_order') as 'asc' | 'desc') || 'asc')

  const handleSortByChange = (val: string) => {
    setSortBy(val)
    localStorage.setItem('soematra_sort_payment_by', val)
  }

  const handleSortOrderChange = (order: 'asc' | 'desc') => {
    setSortOrder(order)
    localStorage.setItem('soematra_sort_payment_order', order)
  }

  const filteredMethods = useMemo(() => {
    return paymentMethods.filter(pm => 
      (pm.bank_name && pm.bank_name.toLowerCase().includes(search.toLowerCase())) ||
      (pm.account_name && pm.account_name.toLowerCase().includes(search.toLowerCase())) ||
      (pm.account_number && pm.account_number.toLowerCase().includes(search.toLowerCase()))
    )
  }, [paymentMethods, search])

  const sortedMethods = useMemo(() => {
    return [...filteredMethods].sort((a, b) => {
      let valA: any = ''
      let valB: any = ''

      if (sortBy === 'bank_name') {
        valA = (a.bank_name || '').toLowerCase()
        valB = (b.bank_name || '').toLowerCase()
      } else if (sortBy === 'account_name') {
        valA = (a.account_name || '').toLowerCase()
        valB = (b.account_name || '').toLowerCase()
      } else if (sortBy === 'account_number') {
        valA = (a.account_number || '').toLowerCase()
        valB = (b.account_number || '').toLowerCase()
      } else if (sortBy === 'status') {
        valA = (a.status || '').toLowerCase()
        valB = (b.status || '').toLowerCase()
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1
      return 0
    })
  }, [filteredMethods, sortBy, sortOrder])

  return (
    <div className="card-container p-0 overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-border flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50/50">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Cari bank, atas nama, atau no. rekening..." 
            className="form-input pl-10 bg-white h-[42px]"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <SortDropdown
            options={[
              { label: 'Nama Bank / E-Wallet', value: 'bank_name' },
              { label: 'Atas Nama', value: 'account_name' },
              { label: 'No. Rekening', value: 'account_number' },
              { label: 'Status', value: 'status' }
            ]}
            sortBy={sortBy}
            onSortByChange={handleSortByChange}
            sortOrder={sortOrder}
            onSortOrderChange={handleSortOrderChange}
          />
        </div>
      </div>

      <div className="overflow-x-auto w-full">
        <table className="min-w-[650px] w-full text-left text-sm text-gray-600">
          <thead className="bg-[#F8FAFC] text-gray-700 text-xs uppercase font-semibold border-b border-border">
            <tr>
              <th className="px-6 py-4">Nama Bank / E-Wallet</th>
              <th className="px-6 py-4">Atas Nama</th>
              <th className="px-6 py-4">No. Rekening</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <TableLoader colSpan={5} />
            ) : sortedMethods.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  Belum ada metode pembayaran.
                </td>
              </tr>
            ) : (
              sortedMethods.map((pm, idx) => (
                <tr key={idx} className="hover:bg-primary-soft/30 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{pm.bank_name}</td>
                  <td className="px-6 py-4">{pm.account_name}</td>
                  <td className="px-6 py-4 font-mono text-gray-700">{pm.account_number}</td>
                  <td className="px-6 py-4">
                    <span className={pm.status === 'Aktif' ? 'badge badge-success' : 'badge bg-gray-200 text-gray-600'}>
                      {pm.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center space-x-2">
                    <button onClick={() => onEdit(pm)} className="text-blue-600 hover:text-blue-900 p-1 bg-blue-50 hover:bg-blue-100 rounded">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => onDelete(pm.id)} className="text-red-600 hover:text-red-900 p-1 bg-red-50 hover:bg-red-100 rounded">
                      <Trash2 className="w-4 h-4" />
                    </button>
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
