import { X, Save, Loader2 } from 'lucide-react'
import { createPortal } from 'react-dom'
import Select from '@/components/ui/Select'

export interface CategoryFormData {
  account_number: string
  account_name: string
  account_type: string
  status: string
}

export interface CategoryFormModalProps {
  isOpen: boolean
  onClose: () => void
  formData: CategoryFormData
  setFormData: (data: CategoryFormData) => void
  isSubmitting: boolean
  onSubmit: (e: React.FormEvent) => void
  editingId: string | number | null
  isDefaultAccount?: boolean
}

export function CategoryFormModal({
  isOpen,
  onClose,
  formData,
  setFormData,
  isSubmitting,
  onSubmit,
  editingId,
  isDefaultAccount
}: CategoryFormModalProps) {
  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-border">
          <h2 className="text-xl font-bold text-gray-900">{editingId ? 'Edit Kategori' : 'Tambah Kategori'}</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-200">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipe Akun</label>
            <Select
              className="w-full text-sm"
              value={formData.account_type}
              onChange={(val) => setFormData({...formData, account_type: val})}
              options={[
                { label: 'Harta', value: 'Harta' },
                { label: 'Kewajiban', value: 'Kewajiban' },
                { label: 'Modal', value: 'Modal' },
                { label: 'Pendapatan', value: 'Pendapatan' },
                { label: 'Beban', value: 'Beban' }
              ]}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">No. Akun</label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="Misal: 5106"
                value={formData.account_number}
                onChange={e => setFormData({...formData, account_number: e.target.value})}
                disabled={!!editingId && isDefaultAccount}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Akun</label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="Misal: Beban Wi-Fi"
                value={formData.account_name}
                onChange={e => setFormData({...formData, account_name: e.target.value})}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <Select
              className="w-full text-sm"
              value={formData.status}
              onChange={(val) => setFormData({...formData, status: val})}
              options={[
                { label: 'Aktif', value: 'Aktif' },
                { label: 'Nonaktif', value: 'Nonaktif' }
              ]}
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
              Batal
            </button>
            <button type="submit" disabled={isSubmitting} className="btn-primary flex items-center">
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}


export interface PaymentMethodFormData {
  bank_name: string
  account_name: string
  account_number: string
  status: string
}

export interface PaymentMethodFormModalProps {
  isOpen: boolean
  onClose: () => void
  formData: PaymentMethodFormData
  setFormData: (data: PaymentMethodFormData) => void
  isSubmitting: boolean
  onSubmit: (e: React.FormEvent) => void
  editingId: string | number | null
}

export function PaymentMethodFormModal({
  isOpen,
  onClose,
  formData,
  setFormData,
  isSubmitting,
  onSubmit,
  editingId
}: PaymentMethodFormModalProps) {
  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-border">
          <h2 className="text-xl font-bold text-gray-900">{editingId ? 'Edit Metode Pembayaran' : 'Tambah Metode Pembayaran'}</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-200">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Bank / E-Wallet</label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="Misal: Bank BCA / GoPay"
              value={formData.bank_name}
              onChange={e => setFormData({...formData, bank_name: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Atas Nama</label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="Misal: Budi Santoso"
              value={formData.account_name}
              onChange={e => setFormData({...formData, account_name: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">No. Rekening / No. HP</label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="Misal: 1234567890"
              value={formData.account_number}
              onChange={e => setFormData({...formData, account_number: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <Select
              className="w-full text-sm"
              value={formData.status}
              onChange={(val) => setFormData({...formData, status: val})}
              options={[
                { label: 'Aktif', value: 'Aktif' },
                { label: 'Nonaktif', value: 'Nonaktif' }
              ]}
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
              Batal
            </button>
            <button type="submit" disabled={isSubmitting} className="btn-primary flex items-center">
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
