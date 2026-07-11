import { Edit, Trash2 } from 'lucide-react'
import { TableLoader } from '@/components/ui/TableLoader'

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
  return (
    <div className="card-container">
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
            ) : paymentMethods.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  Belum ada metode pembayaran.
                </td>
              </tr>
            ) : (
              paymentMethods.map((pm, idx) => (
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
