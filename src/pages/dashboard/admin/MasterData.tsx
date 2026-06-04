import { useState, useEffect } from 'react'
import { Database, Plus, Edit, Trash2, Loader2, X, CheckCircle2 } from 'lucide-react'
import { createPortal } from 'react-dom'
import Select from '@/components/ui/Select'
import { spreadsheetApi } from '@/lib/spreadsheet'
import { mergeAccounts, type Account } from '@/lib/chartOfAccounts'
import { CreditCard } from 'lucide-react'

export interface PaymentMethod {
  id: string | number
  bank_name: string
  account_name: string
  account_number: string
  status: string
}

export default function MasterData() {
  const [categories, setCategories] = useState<Account[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | number | null>(null)
  const [formData, setFormData] = useState({
    account_number: '',
    account_name: '',
    account_type: 'Beban',
    status: 'Aktif'
  })

  // Payment Methods state
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [editingPaymentId, setEditingPaymentId] = useState<string | number | null>(null)
  const [paymentFormData, setPaymentFormData] = useState({
    bank_name: '',
    account_name: '',
    account_number: '',
    status: 'Aktif'
  })

  const [alertDialog, setAlertDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    isConfirm: false,
    onConfirm: () => {}
  })

  useEffect(() => {
    fetchCategories()
    fetchPaymentMethods()
  }, [])

  const fetchPaymentMethods = async () => {
    try {
      const { data } = await spreadsheetApi.get('PaymentMethods')
      if (data && Array.isArray(data) && data.length > 0) {
        setPaymentMethods(data)
      } else {
        setPaymentMethods([
          { id: 1, bank_name: 'BCA', account_name: 'Soematra Kost', account_number: '1234567890', status: 'Aktif' }
        ])
      }
    } catch (err) {
      console.error(err)
    }
  }

  const fetchCategories = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await spreadsheetApi.get('MasterData')
      
      const customData = (data && Array.isArray(data)) ? data : []
      const merged = mergeAccounts(customData)
      setCategories(merged)
      
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenAdd = () => {
    setEditingId(null)
    setFormData({ account_number: '', account_name: '', account_type: 'Beban', status: 'Aktif' })
    setIsModalOpen(true)
  }

  const handleOpenEdit = (cat: any) => {
    setEditingId(cat.id || cat.account_number)
    setFormData({ 
      account_number: cat.account_number, 
      account_name: cat.account_name, 
      account_type: cat.account_type, 
      status: cat.status 
    })
    setIsModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    // Pastikan ID ada, bisa menggunakan no akun jika baru
    const currentId = editingId || formData.account_number
    const payload = { 
      id: currentId, 
      ...formData, 
      updated_at: new Date().toISOString() 
    }
    
    let res
    if (editingId) {
      res = await spreadsheetApi.put('MasterData', payload)
    } else {
      payload.created_at = new Date().toISOString()
      res = await spreadsheetApi.post('MasterData', payload)
    }

    if (!res?.success && !editingId) {
       // local fallback append
    }
    
    await fetchCategories() // re-fetch and merge
    setIsModalOpen(false)
    setIsLoading(false)
  }

  const handleDelete = (id: string | number, type: 'category' | 'payment' = 'category') => {
    setAlertDialog({
      isOpen: true,
      title: type === 'category' ? 'Hapus Kategori' : 'Hapus Metode Pembayaran',
      message: 'Apakah Anda yakin ingin menghapus data ini?',
      isConfirm: true,
      onConfirm: async () => {
        setIsLoading(true)
        if (type === 'category') {
          await spreadsheetApi.del('MasterData', id)
          await fetchCategories()
        } else {
          await spreadsheetApi.del('PaymentMethods', id)
          await fetchPaymentMethods()
        }
        setAlertDialog(prev => ({...prev, isOpen: false}))
        setIsLoading(false)
      }
    })
  }

  const handleOpenAddPayment = () => {
    setEditingPaymentId(null)
    setPaymentFormData({ bank_name: '', account_name: '', account_number: '', status: 'Aktif' })
    setIsPaymentModalOpen(true)
  }

  const handleOpenEditPayment = (pm: PaymentMethod) => {
    setEditingPaymentId(pm.id)
    setPaymentFormData({ 
      bank_name: pm.bank_name, 
      account_name: pm.account_name, 
      account_number: pm.account_number, 
      status: pm.status 
    })
    setIsPaymentModalOpen(true)
  }

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    const payload = { 
      id: editingPaymentId || Date.now(), 
      ...paymentFormData, 
      updated_at: new Date().toISOString() 
    }
    
    if (editingPaymentId) {
      await spreadsheetApi.put('PaymentMethods', payload)
    } else {
      payload.created_at = new Date().toISOString()
      await spreadsheetApi.post('PaymentMethods', payload)
    }
    
    await fetchPaymentMethods()
    setIsPaymentModalOpen(false)
    setIsLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center">
            <Database className="mr-3 text-primary w-8 h-8" />
            Data Master Kategori
          </h1>
          <p className="text-text-secondary mt-1">Kelola kategori pencatatan keuangan, metode pembayaran, dsb.</p>
        </div>
        <button onClick={handleOpenAdd} className="btn-primary flex items-center">
          <Plus className="w-5 h-5 mr-2" />
          Tambah Kategori
        </button>
      </div>

      <div className="card-container">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-[#F3F4F6] text-gray-700 text-xs uppercase font-semibold border-b border-border">
              <tr>
                <th className="px-6 py-4">Tipe Akun</th>
                <th className="px-6 py-4">No. Akun</th>
                <th className="px-6 py-4">Nama Akun</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {categories.map((cat, idx) => (
                <tr key={idx} className="hover:bg-primary-soft/30 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{cat.account_type}</td>
                  <td className="px-6 py-4"><span className="font-mono bg-gray-100 px-2 py-1 rounded text-sm">{cat.account_number}</span></td>
                  <td className="px-6 py-4">{cat.account_name}</td>
                  <td className="px-6 py-4">
                    <span className={cat.status === 'Aktif' ? 'badge badge-success' : 'badge bg-gray-200 text-gray-600'}>
                      {cat.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button onClick={() => handleOpenEdit(cat)} className="text-blue-600 hover:text-blue-900 p-1 bg-blue-50 hover:bg-blue-100 rounded">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(cat.account_number)} className="text-red-600 hover:text-red-900 p-1 bg-red-50 hover:bg-red-100 rounded">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mt-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center">
            <CreditCard className="mr-3 text-primary w-6 h-6" />
            Metode Pembayaran
          </h2>
          <p className="text-text-secondary mt-1">Kelola rekening bank atau e-wallet untuk menerima pembayaran.</p>
        </div>
        <button onClick={handleOpenAddPayment} className="btn-primary flex items-center">
          <Plus className="w-5 h-5 mr-2" />
          Tambah Metode
        </button>
      </div>

      <div className="card-container">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-[#F3F4F6] text-gray-700 text-xs uppercase font-semibold border-b border-border">
              <tr>
                <th className="px-6 py-4">Nama Bank / E-Wallet</th>
                <th className="px-6 py-4">Atas Nama</th>
                <th className="px-6 py-4">No. Rekening</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paymentMethods.map((pm, idx) => (
                <tr key={idx} className="hover:bg-primary-soft/30 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{pm.bank_name}</td>
                  <td className="px-6 py-4">{pm.account_name}</td>
                  <td className="px-6 py-4 font-mono text-gray-700">{pm.account_number}</td>
                  <td className="px-6 py-4">
                    <span className={pm.status === 'Aktif' ? 'badge badge-success' : 'badge bg-gray-200 text-gray-600'}>
                      {pm.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button onClick={() => handleOpenEditPayment(pm)} className="text-blue-600 hover:text-blue-900 p-1 bg-blue-50 hover:bg-blue-100 rounded">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(pm.id, 'payment')} className="text-red-600 hover:text-red-900 p-1 bg-red-50 hover:bg-red-100 rounded">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-border">
              <h2 className="text-xl font-bold text-gray-900">{editingId ? 'Edit Kategori' : 'Tambah Kategori'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-5">
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
                    disabled={!!editingId && categories.find(c => c.account_number === editingId)?.is_default}
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
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                  Batal
                </button>
                <button type="submit" disabled={isLoading} className="btn-primary flex items-center">
                  {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {isPaymentModalOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-border">
              <h2 className="text-xl font-bold text-gray-900">{editingPaymentId ? 'Edit Metode Pembayaran' : 'Tambah Metode Pembayaran'}</h2>
              <button onClick={() => setIsPaymentModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSavePayment} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Bank / E-Wallet</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="Misal: Bank BCA / GoPay"
                  value={paymentFormData.bank_name}
                  onChange={e => setPaymentFormData({...paymentFormData, bank_name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Atas Nama</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="Misal: Budi Santoso"
                  value={paymentFormData.account_name}
                  onChange={e => setPaymentFormData({...paymentFormData, account_name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">No. Rekening / No. HP</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="Misal: 1234567890"
                  value={paymentFormData.account_number}
                  onChange={e => setPaymentFormData({...paymentFormData, account_number: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <Select
                  className="w-full text-sm"
                  value={paymentFormData.status}
                  onChange={(val) => setPaymentFormData({...paymentFormData, status: val})}
                  options={[
                    { label: 'Aktif', value: 'Aktif' },
                    { label: 'Nonaktif', value: 'Nonaktif' }
                  ]}
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                  Batal
                </button>
                <button type="submit" disabled={isLoading} className="btn-primary flex items-center">
                  {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Alert Dialog */}
      {alertDialog.isOpen && createPortal(
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 p-6 text-center">
            <div className="mx-auto w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
              <Trash2 className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">{alertDialog.title}</h2>
            <p className="text-gray-500 mb-6 text-sm leading-relaxed">{alertDialog.message}</p>
            <div className="flex space-x-3">
              {alertDialog.isConfirm && (
                <button 
                  onClick={() => setAlertDialog(prev => ({...prev, isOpen: false}))}
                  className="flex-1 py-2.5 px-4 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
              )}
              <button 
                onClick={alertDialog.onConfirm}
                className="flex-1 py-2.5 px-4 rounded-lg font-medium text-white transition-colors shadow-md bg-red-600 hover:bg-red-700 shadow-red-500/20"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
