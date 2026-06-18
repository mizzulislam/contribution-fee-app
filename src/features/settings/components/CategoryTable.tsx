import { Edit, Trash2 } from 'lucide-react'
import type { Account } from '@/features/accounting/data/chartOfAccounts'
import { TableLoader } from '@/components/ui/TableLoader'

export interface CategoryTableProps {
  categories: Account[]
  loading?: boolean
  onEdit: (cat: any) => void
  onDelete: (id: string | number) => void
}

export function CategoryTable({ categories, loading, onEdit, onDelete }: CategoryTableProps) {
  return (
    <div className="card-container">
      <div className="overflow-x-auto w-full">
        <table className="min-w-[650px] w-full text-left text-sm text-gray-600">
          <thead className="bg-[#F3F4F6] text-gray-700 text-xs uppercase font-semibold border-b border-border">
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
            ) : categories.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  Belum ada data kategori.
                </td>
              </tr>
            ) : (
              categories.map((cat, idx) => (
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
                    <button onClick={() => onDelete(cat.account_number)} className="text-red-600 hover:text-red-900 p-1 bg-red-50 hover:bg-red-100 rounded">
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
