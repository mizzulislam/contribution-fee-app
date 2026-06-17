import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { spreadsheetApi } from '@/lib/spreadsheet'
import { Search, BadgeDollarSign, Plus, Loader2, X, Trash2 } from 'lucide-react'
import Select from '@/components/ui/Select'
import { TableLoader } from '@/components/ui/TableLoader'
import { generateSecureId } from '@/utils/id'
import { defaultEngine } from '@/lib/accounting'
import { checkPeriodLock } from '@/lib/accounting/period'
import ConfirmDialog from '@/components/ui/ConfirmDialog'

const EXPENSE_ACCOUNT_BY_CATEGORY: Record<string, string> = {
  'Air & Galon': '5106',
  Listrik: '5101',
  Kebersihan: '5102',
  Perbaikan: '5103',
  Lainnya: '5105',
}

const CASH_ACCOUNT_NUMBER = '1102'

interface Expense {
  id: number | string
  title: string
  category: string
  amount: number
  date: string
  note?: string
  created_at?: string
}

export default function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [alertDialog, setAlertDialog] = useState<{
    isOpen: boolean
    title: string
    message: string
    variant: 'danger' | 'info' | 'success'
    showCancel?: boolean
    confirmLabel?: string
    onConfirm?: () => void
  }>({
    isOpen: false,
    title: '',
    message: '',
    variant: 'info',
    showCancel: false,
    confirmLabel: 'Mengerti'
  })
  
  const [formData, setFormData] = useState({
    title: '',
    category: 'Air & Galon',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    note: ''
  })

  async function fetchExpenses() {
    setLoading(true)
    const { data } = await spreadsheetApi.get('Expenses')
    
    if (data && Array.isArray(data)) {
      setExpenses(data as Expense[])
    } else {
      setExpenses([])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchExpenses()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    
    // Check Period Lock
    const isLocked = await checkPeriodLock(formData.date)
    if (isLocked) {
      setAlertDialog({
        isOpen: true,
        title: 'Periode Terkunci',
        message: 'Gagal menyimpan pengeluaran: Periode akuntansi pada tanggal tersebut sudah ditutup (Locked).',
        variant: 'danger',
        showCancel: false,
        confirmLabel: 'Mengerti'
      })
      setIsSaving(false)
      return
    }

    const newId = generateSecureId('EXP')
    const payload = { 
      id: newId, 
      ...formData, 
      amount: Number(formData.amount),
      created_at: new Date().toISOString() 
    }
    
    let step1Success = false
    try {
      // Step 1: Post Expense
      const res = await spreadsheetApi.post('Expenses', payload)
      if (!res.success) throw new Error((res.error as any)?.message || 'Gagal menyimpan pengeluaran ke Sheets.')
      step1Success = true

      // Step 2: Post Journal
      const debitAccountNumber = EXPENSE_ACCOUNT_BY_CATEGORY[formData.category] || EXPENSE_ACCOUNT_BY_CATEGORY.Lainnya
      const debits = [{ accountNumber: debitAccountNumber, amount: Number(formData.amount) }]
      const credits = [{ accountNumber: CASH_ACCOUNT_NUMBER, amount: Number(formData.amount) }]
      const description = `${formData.title}${formData.note ? ` - ${formData.note}` : ''}`
      const journalId = `EXP-${newId}`

      const journalPayload = {
        id: journalId,
        date: formData.date,
        description,
        debits: JSON.stringify(debits),
        credits: JSON.stringify(credits),
        source: 'Expenses',
        source_id: newId,
        created_at: new Date().toISOString(),
      }

      const journalRes = await spreadsheetApi.post('JournalEntries', journalPayload)
      if (!journalRes.success) {
        throw new Error((journalRes.error as any)?.message || 'Gagal memposting jurnal otomatis untuk pengeluaran ke Sheets.')
      }

      // Re-record locally
      defaultEngine.recordTransaction(formData.date, debits, credits, description)

      setExpenses([payload, ...expenses])
      setIsModalOpen(false)
      setFormData({
        title: '',
        category: 'Air & Galon',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        note: ''
      })
    } catch (err: any) {
      console.error(err)
      // Rollback
      if (step1Success) {
        await spreadsheetApi.del('Expenses', newId)
      }
      setAlertDialog({
        isOpen: true,
        title: 'Transaksi Gagal',
        message: `Transaksi gagal: ${err.message || err}. Perubahan telah dibatalkan.`,
        variant: 'danger',
        showCancel: false,
        confirmLabel: 'Mengerti'
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteClick = (id: number | string) => {
    setAlertDialog({
      isOpen: true,
      title: 'Hapus Pengeluaran',
      message: 'Apakah Anda yakin ingin menghapus pengeluaran ini?',
      variant: 'danger',
      showCancel: true,
      confirmLabel: 'Ya, Hapus',
      onConfirm: () => {
        setAlertDialog(prev => ({ ...prev, isOpen: false }))
        executeDelete(id)
      }
    })
  }

  const executeDelete = async (id: number | string) => {
    const targetExpense = expenses.find(e => e.id === id)
    if (!targetExpense) return

    // Find journal entry to check date and verify if locked
    let journalDate = new Date().toISOString().split('T')[0]
    try {
      const { data: journals } = await spreadsheetApi.get('JournalEntries')
      const matchedJournal = Array.isArray(journals) && journals.find(j => String(j.id) === `EXP-${id}`)
      if (matchedJournal) {
        journalDate = matchedJournal.date
      }
    } catch (e) {
      console.warn("Gagal mengambil data jurnal untuk check lock:", e)
    }

    const isLocked = await checkPeriodLock(journalDate)
    if (isLocked) {
      setAlertDialog({
        isOpen: true,
        title: 'Periode Terkunci',
        message: 'Gagal menghapus pengeluaran: Transaksi ini berada di periode yang sudah ditutup (Locked).',
        variant: 'danger',
        showCancel: false,
        confirmLabel: 'Mengerti'
      })
      return
    }

    let step1Success = false
    try {
      // Step 1: Delete expense
      const expenseRes = await spreadsheetApi.del('Expenses', id)
      if (!expenseRes.success) throw new Error((expenseRes.error as any)?.message || 'Gagal menghapus pengeluaran di Sheets.')
      step1Success = true

      // Step 2: Delete journal
      const journalRes = await spreadsheetApi.del('JournalEntries', `EXP-${id}`)
      if (!journalRes.success) throw new Error((journalRes.error as any)?.message || 'Gagal menghapus jurnal pengeluaran di Sheets.')

      setExpenses(expenses.filter(e => e.id !== id))
    } catch (err: any) {
      console.error(err)
      // Rollback
      if (step1Success && targetExpense) {
        await spreadsheetApi.post('Expenses', targetExpense)
      }
      setAlertDialog({
        isOpen: true,
        title: 'Gagal Menghapus',
        message: `Gagal menghapus pengeluaran: ${err.message || err}. Perubahan telah dibatalkan.`,
        variant: 'danger',
        showCancel: false,
        confirmLabel: 'Mengerti'
      })
    }
  }

  const formatCurrency = (amount: number) => {
    return (
      <div className="flex justify-between items-center w-full min-w-[80px]">
        <span className="text-gray-500 mr-2">Rp</span>
        <span>{new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(amount)}</span>
      </div>
    )
  }

  const filtered = expenses.filter(e => 
    e.title?.toLowerCase().includes(search.toLowerCase()) || 
    e.category?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center">
            <BadgeDollarSign className="mr-3 text-primary w-8 h-8" />
            Pengeluaran Operasional
          </h1>
          <p className="text-text-secondary mt-1">Catat dan pantau seluruh pengeluaran rutin kos.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary flex items-center whitespace-nowrap">
          <Plus className="w-5 h-5 mr-2" />
          Tambah Pengeluaran
        </button>
      </div>

      <div className="card-container">
        <div className="p-4 sm:p-6 border-b border-border flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50/50 rounded-t-[20px]">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Cari pengeluaran..." 
              className="form-input pl-10 bg-white"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto w-full rounded-b-[20px] border-t border-border scrollbar-thin scrollbar-thumb-gray-200">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50/80 text-gray-700 text-xs uppercase font-semibold border-b border-border">
              <tr>
                <th className="px-6 py-4">Tanggal</th>
                <th className="px-6 py-4">Judul Pengeluaran</th>
                <th className="px-6 py-4">Kategori</th>
                <th className="px-6 py-4 hidden md:table-cell">Catatan</th>
                <th className="px-6 py-4 text-right">Nominal</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <TableLoader colSpan={6} text="Memuat data pengeluaran..." />
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">Tidak ada pengeluaran ditemukan.</td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-primary-soft/30 transition-colors">
                    <td className="px-6 py-4">{item.date}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{item.title}</td>
                    <td className="px-6 py-4">
                      <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-md text-xs font-medium">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">{item.note || '-'}</td>
                    <td className="px-6 py-4 font-semibold text-danger text-center">
                      - {formatCurrency(item.amount)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button onClick={() => handleDeleteClick(item.id)} className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded">
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

      {isModalOpen && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200"
          onMouseDown={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b border-border">
              <h2 className="text-xl font-bold text-gray-900">Tambah Pengeluaran</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Judul Pengeluaran</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="Misal: Beli Lampu Taman"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                <Select
                  className="w-full text-sm"
                  value={formData.category}
                  onChange={(val) => setFormData({...formData, category: val})}
                  options={[
                    { label: 'Air & Galon', value: 'Air & Galon' },
                    { label: 'Listrik', value: 'Listrik' },
                    { label: 'Kebersihan', value: 'Kebersihan' },
                    { label: 'Perbaikan', value: 'Perbaikan' },
                    { label: 'Lainnya', value: 'Lainnya' }
                  ]}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nominal (Rp)</label>
                  <input
                    type="number"
                    required
                    className="form-input"
                    placeholder="0"
                    value={formData.amount}
                    onChange={e => setFormData({...formData, amount: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
                  <input
                    type="date"
                    required
                    className="form-input"
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Catatan (Opsional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Keterangan tambahan..."
                  value={formData.note}
                  onChange={e => setFormData({...formData, note: e.target.value})}
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                  Batal
                </button>
                <button type="submit" disabled={isSaving} className="btn-primary flex items-center">
                  {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      <ConfirmDialog
        isOpen={alertDialog.isOpen}
        title={alertDialog.title}
        message={alertDialog.message}
        variant={alertDialog.variant}
        showCancel={alertDialog.showCancel}
        confirmLabel={alertDialog.confirmLabel}
        onClose={() => setAlertDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={alertDialog.onConfirm}
      />
    </div>
  )
}
