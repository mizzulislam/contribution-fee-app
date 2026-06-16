import { useState, useEffect } from 'react'
import { Database, Plus, Trash2, CreditCard } from 'lucide-react'
import { createPortal } from 'react-dom'
import { spreadsheetApi } from '@/lib/spreadsheet'
import { mergeAccounts, type Account } from '@/lib/chartOfAccounts'

import { CategoryTable } from '@/components/admin/master/CategoryTable'
import { PaymentMethodTable, type PaymentMethod } from '@/components/admin/master/PaymentMethodTable'
import { CategoryFormModal, PaymentMethodFormModal } from '@/components/admin/master/MasterFormModals'

export default function MasterData() {
  const [categories, setCategories] = useState<Account[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isPaymentLoading, setIsPaymentLoading] = useState(false)
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

  async function fetchPaymentMethods() {
    try {
      setIsPaymentLoading(true)
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
    } finally {
      setIsPaymentLoading(false)
    }
  }

  async function fetchCategories() {
    try {
      setIsLoading(true)
      const { data } = await spreadsheetApi.get('MasterData')
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

  const handleOpenEdit = (cat: Account & { id?: string | number }) => {
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
    
    const currentId = editingId || formData.account_number
    const payload = { 
      id: currentId, 
      ...formData, 
      updated_at: new Date().toISOString() 
    }
    
    if (editingId) {
      const res = await spreadsheetApi.put('MasterData', payload)
      // Jika gagal karena ID tidak ditemukan (berarti ini akun default yang baru pertama kali diedit) atau karena tabel masih kosong
      const errMessage = res.error instanceof Error ? res.error.message : ''
      if (!res.success && (errMessage.includes('not found') || errMessage.includes('No data'))) {
        await spreadsheetApi.post('MasterData', { ...payload, created_at: new Date().toISOString() })
      }
    } else {
      await spreadsheetApi.post('MasterData', { ...payload, created_at: new Date().toISOString() })
    }
    
    await fetchCategories()
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
      const res = await spreadsheetApi.put('PaymentMethods', payload)
      const errMessage = res.error instanceof Error ? res.error.message : ''
      if (!res.success && (errMessage.includes('not found') || errMessage.includes('No data'))) {
        await spreadsheetApi.post('PaymentMethods', { ...payload, created_at: new Date().toISOString() })
      }
    } else {
      await spreadsheetApi.post('PaymentMethods', { ...payload, created_at: new Date().toISOString() })
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

      <CategoryTable 
        categories={categories} 
        loading={isLoading}
        onEdit={handleOpenEdit} 
        onDelete={(id) => handleDelete(id, 'category')} 
      />

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

      <PaymentMethodTable 
        paymentMethods={paymentMethods} 
        loading={isPaymentLoading}
        onEdit={handleOpenEditPayment} 
        onDelete={(id) => handleDelete(id, 'payment')} 
      />

      <CategoryFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        formData={formData}
        setFormData={setFormData}
        isSubmitting={isLoading}
        onSubmit={handleSave}
        editingId={editingId}
        isDefaultAccount={!!editingId && categories.find(c => c.account_number === editingId)?.is_default}
      />

      <PaymentMethodFormModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        formData={paymentFormData}
        setFormData={setPaymentFormData}
        isSubmitting={isLoading}
        onSubmit={handleSavePayment}
        editingId={editingPaymentId}
      />

      {/* Alert Dialog */}
      {alertDialog.isOpen && createPortal(
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200"
          onMouseDown={() => setAlertDialog(prev => ({...prev, isOpen: false}))}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 p-6 text-center"
            onMouseDown={(event) => event.stopPropagation()}
          >
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
