import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { spreadsheetApi } from '@/lib/spreadsheet'
import { CheckCircle2, Clock, XCircle, FileText, Search, Bell, Plus, X, Save, Check, Pencil, Trash2 } from 'lucide-react'
import { TableLoader } from '@/components/ui/TableLoader'
import Select from '@/components/ui/Select'

export default function BillsPayments() {
  const [bills, setBills] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [templates, setTemplates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isLoadingForm, setIsLoadingForm] = useState(false)
  const [search, setSearch] = useState('')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedBill, setSelectedBill] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [newBill, setNewBill] = useState({ resident_name: '', title: '', due_date: '', amount: 0 })
  const [editingBillId, setEditingBillId] = useState<number | string | null>(null)
  const [selectedBillIds, setSelectedBillIds] = useState<(string | number)[]>([])
  const [isBulkActioning, setIsBulkActioning] = useState(false)

  useEffect(() => {
    fetchBills()
  }, [])

  const fetchBills = async () => {
    setLoading(true)
    const [billsRes, usersRes] = await Promise.all([
      spreadsheetApi.get('Bills'),
      spreadsheetApi.get('Users')
    ])
    
    if (billsRes.data && Array.isArray(billsRes.data)) {
      setBills(billsRes.data)
    } else {
      setBills([])
    }

    if (usersRes.data && Array.isArray(usersRes.data)) {
      setUsers(usersRes.data)
    }

    setLoading(false)
  }

  useEffect(() => {
    if (isAddModalOpen && templates.length === 0) {
      fetchFormData()
    }
  }, [isAddModalOpen])

  const fetchFormData = async () => {
    setIsLoadingForm(true)
    try {
      const templatesRes = await spreadsheetApi.get('Contributions')
      if (templatesRes.data && Array.isArray(templatesRes.data)) {
        setTemplates(templatesRes.data.filter((t: any) => t.status === 'active'))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoadingForm(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return (
      <div className="flex justify-between items-center w-full min-w-[100px]">
        <span className="text-gray-500 mr-2">Rp</span>
        <span>{new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(amount)}</span>
      </div>
    )
  }

  const handleDelete = async (id: number | string) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus tagihan ini? Tindakan ini tidak dapat dibatalkan.')) return
    
    const { success } = await spreadsheetApi.del('Bills', id)
    if (success) {
      setBills(bills.filter(b => b.id !== id))
      setSelectedBillIds(selectedBillIds.filter(selectedId => selectedId !== id))
      setToastMessage('Tagihan berhasil dihapus.')
      setTimeout(() => setToastMessage(''), 3000)
    } else {
      setToastMessage('Gagal menghapus tagihan. Terjadi kesalahan koneksi.')
      setTimeout(() => setToastMessage(''), 3000)
    }
  }

  const handleBulkDelete = async () => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus ${selectedBillIds.length} tagihan terpilih?`)) return
    setIsBulkActioning(true)
    let successCount = 0
    for (const id of selectedBillIds) {
      const { success } = await spreadsheetApi.del('Bills', id)
      if (success) successCount++
    }
    if (successCount > 0) {
      setBills(bills.filter(b => !selectedBillIds.includes(b.id)))
      setToastMessage(`${successCount} tagihan berhasil dihapus.`)
      setSelectedBillIds([])
    } else {
      setToastMessage('Gagal menghapus tagihan.')
    }
    setTimeout(() => setToastMessage(''), 3000)
    setIsBulkActioning(false)
  }

  const handleBulkPaid = async () => {
    if (!window.confirm(`Tandai ${selectedBillIds.length} tagihan terpilih sebagai lunas?`)) return
    setIsBulkActioning(true)
    let successCount = 0
    for (const id of selectedBillIds) {
      const { success } = await spreadsheetApi.put('Bills', { id, status: 'paid' })
      if (success) successCount++
    }
    if (successCount > 0) {
      setBills(bills.map(b => selectedBillIds.includes(b.id) ? { ...b, status: 'paid' } : b))
      setToastMessage(`${successCount} tagihan ditandai lunas.`)
      setSelectedBillIds([])
    } else {
      setToastMessage('Gagal memperbarui status.')
    }
    setTimeout(() => setToastMessage(''), 3000)
    setIsBulkActioning(false)
  }

  const handleEdit = (bill: any) => {
    setEditingBillId(bill.id)
    let formattedDate = ''
    try {
      if (bill.due_date) formattedDate = new Date(bill.due_date).toISOString().split('T')[0]
    } catch(e) {}
    
    setNewBill({
      resident_name: bill.resident_name,
      title: getContributionData(bill.contributions).title || '',
      due_date: formattedDate,
      amount: bill.amount
    })
    setIsAddModalOpen(true)
  }

  const closeFormModal = () => {
    setIsAddModalOpen(false)
    setEditingBillId(null)
    setNewBill({ resident_name: '', title: '', due_date: '', amount: 0 })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200"><CheckCircle2 className="w-3.5 h-3.5" /> Lunas</span>
      case 'unpaid':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200"><XCircle className="w-3.5 h-3.5" /> Belum Bayar</span>
      case 'pending':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200"><Clock className="w-3.5 h-3.5" /> Menunggu Konfirmasi</span>
      default:
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200"><Clock className="w-3.5 h-3.5" /> {status}</span>
    }
  }

  const getContributionData = (contrib: any) => {
    if (typeof contrib === 'string') {
      try {
        return JSON.parse(contrib)
      } catch(e) {
        const titleMatch = contrib.match(/title=([^,}]+)/)
        const nameMatch = contrib.match(/name=([^,}]+)/)
        if (titleMatch || nameMatch) {
          return {
            title: titleMatch ? titleMatch[1].trim() : '',
            contribution_types: { name: nameMatch ? nameMatch[1].trim() : '' }
          }
        }
        return { title: contrib, contribution_types: { name: 'Kustom' } }
      }
    }
    return contrib || {}
  }

  const filteredBills = bills.filter(b => 
    b.resident_name?.toLowerCase().includes(search.toLowerCase()) ||
    getContributionData(b.contributions).title?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center">
            <FileText className="mr-3 text-primary w-8 h-8" />
            Tagihan & Pembayaran
          </h1>
          <p className="text-text-secondary mt-1">Pantau seluruh status tagihan penghuni dan riwayat pembayarannya.</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="btn-primary flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" /> Buat Tagihan Baru
        </button>
      </div>

      <div className="card-container">
        <div className="p-4 sm:p-6 border-b border-border flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50/50 rounded-t-[20px]">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Cari penghuni atau tagihan..." 
              className="form-input pl-10 bg-white"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {selectedBillIds.length > 0 && (
            <div className="flex gap-2 w-full sm:w-auto animate-in fade-in slide-in-from-right-4 duration-300">
              <button 
                onClick={handleBulkDelete}
                disabled={isBulkActioning}
                className="btn-secondary flex items-center justify-center whitespace-nowrap h-[42px] text-sm text-red-600 hover:bg-red-50 hover:border-red-200 border-gray-200 px-4 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4 mr-2 flex-shrink-0" />
                <span>Hapus Terpilih ({selectedBillIds.length})</span>
              </button>
              <button 
                onClick={handleBulkPaid}
                disabled={isBulkActioning}
                className="btn-primary flex items-center justify-center whitespace-nowrap h-[42px] text-sm px-4 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4 mr-2 flex-shrink-0" />
                <span>Tandai Lunas ({selectedBillIds.length})</span>
              </button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#F3F4F6] border-b border-border text-gray-600">
              <tr>
                <th className="px-6 py-3 font-semibold whitespace-nowrap text-center">
                  <input 
                    type="checkbox" 
                    onChange={(e) => e.target.checked ? setSelectedBillIds(filteredBills.map(b => b.id)) : setSelectedBillIds([])}
                    checked={filteredBills.length > 0 && selectedBillIds.length === filteredBills.length}
                    className="form-checkbox h-4 w-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 transition-colors cursor-pointer"
                  />
                </th>
                <th className="px-6 py-3 font-semibold whitespace-nowrap text-center">Penghuni</th>
                <th className="px-6 py-3 font-semibold whitespace-nowrap text-center">Keterangan</th>
                <th className="px-6 py-3 font-semibold whitespace-nowrap text-center">Jatuh Tempo</th>
                <th className="px-6 py-3 font-semibold whitespace-nowrap text-center">Nominal</th>
                <th className="px-6 py-3 font-semibold whitespace-nowrap text-center">Status</th>
                <th className="px-6 py-3 font-semibold whitespace-nowrap text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-gray-700 bg-white">
              {loading ? (
                <TableLoader colSpan={7} text="Memuat data tagihan..." />
              ) : filteredBills.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-text-muted">
                    Tidak ada tagihan yang ditemukan.
                  </td>
                </tr>
              ) : (
                filteredBills.map((bill) => (
                  <tr key={bill.id} className="hover:bg-[#ECFDF5] transition-colors">
                    <td className="px-6 py-4 text-center">
                      <input 
                        type="checkbox" 
                        checked={selectedBillIds.includes(bill.id)}
                        onChange={(e) => e.target.checked ? setSelectedBillIds([...selectedBillIds, bill.id]) : setSelectedBillIds(selectedBillIds.filter(id => id !== bill.id))}
                        className="form-checkbox h-4 w-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 transition-colors cursor-pointer"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">
                        {users.find(u => u.full_name === bill.resident_name)?.nickname || bill.resident_name?.split(' ')[0]}
                      </div>
                      <div className="text-xs text-text-secondary mt-0.5">Kamar {bill.room_number}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{getContributionData(bill.contributions).title}</div>
                      <div className="text-xs text-text-secondary mt-0.5">{getContributionData(bill.contributions).contribution_types?.name}</div>
                    </td>
                    <td className="px-6 py-4 text-center text-text-secondary">{new Date(bill.due_date).toLocaleDateString('id-ID')}</td>
                    <td className="px-6 py-4 font-semibold">{formatCurrency(bill.amount)}</td>
                    <td className="px-6 py-4 text-center">{getStatusBadge(bill.status)}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-1.5">
                        {bill.status === 'unpaid' && (
                          <button 
                            onClick={() => {
                              setToastMessage(`Berhasil mengirim pengingat ke ${bill.resident_name}`)
                              setTimeout(() => setToastMessage(''), 3000)
                            }}
                            title="Ingatkan"
                            className="p-1.5 text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-colors border border-transparent hover:border-orange-200"
                          >
                            <Bell className="w-4 h-4" />
                          </button>
                        )}
                        <button 
                          onClick={() => { setSelectedBill(bill); setIsDetailModalOpen(true); }}
                          title="Detail"
                          className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-200"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleEdit(bill)}
                          title="Edit"
                          className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors border border-transparent hover:border-emerald-200"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(bill.id)}
                          title="Hapus"
                          className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200"
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

      {/* Toast Notification */}
      {toastMessage && createPortal(
        <div className="fixed top-4 right-4 z-[200] animate-in slide-in-from-top-2 fade-in duration-300">
          <div className="bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-lg flex items-center font-medium">
            <CheckCircle2 className="w-5 h-5 mr-3" />
            {toastMessage}
          </div>
        </div>,
        document.body
      )}

      {/* Add Bill Modal */}
      {isAddModalOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900">{editingBillId ? 'Edit Tagihan' : 'Buat Tagihan Baru'}</h2>
              <button onClick={closeFormModal} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault()
              setIsSubmitting(true)

              if (editingBillId) {
                const selectedUser = users.find(u => u.id.toString() === newBill.resident_name || u.full_name === newBill.resident_name)
                const updatedBill = {
                  ...bills.find(b => b.id === editingBillId),
                  resident_name: selectedUser ? selectedUser.full_name : newBill.resident_name,
                  room_number: selectedUser ? (selectedUser.room_number || 'N/A') : 'N/A',
                  contributions: JSON.stringify({ title: newBill.title, contribution_types: { name: 'Kustom' } }),
                  due_date: newBill.due_date,
                  amount: newBill.amount,
                }
                
                const { success } = await spreadsheetApi.put('Bills', updatedBill)
                if (success) {
                  setBills(bills.map(b => b.id === editingBillId ? updatedBill : b))
                  setToastMessage('Tagihan berhasil diperbarui!')
                } else {
                  setToastMessage('Disimpan lokal (Gagal terhubung ke Sheets)')
                }
                setTimeout(() => setToastMessage(''), 3000)
                setIsSubmitting(false)
                closeFormModal()
                return
              }

              let billsToAdd: any[] = []
              
              if (newBill.resident_name === 'ALL') {
                const activeUsers = users.filter(u => (!u.status || u.status === 'Aktif') && String(u.role).includes('user'))
                billsToAdd = activeUsers.map((user, idx) => ({
                  id: Date.now() + idx,
                  resident_name: user.full_name,
                  room_number: user.room_number || 'N/A',
                  contributions: JSON.stringify({ title: newBill.title, contribution_types: { name: 'Kustom' } }),
                  due_date: newBill.due_date,
                  amount: newBill.amount,
                  status: 'unpaid'
                }))
              } else {
                const selectedUser = users.find(u => u.id.toString() === newBill.resident_name || u.full_name === newBill.resident_name)
                billsToAdd = [{
                  id: Date.now(),
                  resident_name: selectedUser ? selectedUser.full_name : newBill.resident_name,
                  room_number: selectedUser ? (selectedUser.room_number || 'N/A') : 'N/A',
                  contributions: JSON.stringify({ title: newBill.title, contribution_types: { name: 'Kustom' } }),
                  due_date: newBill.due_date,
                  amount: newBill.amount,
                  status: 'unpaid'
                }]
              }
              
              let successCount = 0
              for (const bill of billsToAdd) {
                const { success } = await spreadsheetApi.post('Bills', bill)
                if (success) successCount++
              }
              
              setBills([...billsToAdd, ...bills])
              setIsSubmitting(false)
              setIsAddModalOpen(false)
              
              if (billsToAdd.length > 1) {
                setToastMessage(successCount > 0 ? `${successCount} tagihan massal berhasil dibuat!` : 'Disimpan lokal (Gagal terhubung ke Sheets)')
              } else {
                setToastMessage(successCount > 0 ? 'Tagihan berhasil dibuat!' : 'Disimpan lokal (Gagal terhubung ke Sheets)')
              }
              setTimeout(() => setToastMessage(''), 3000)
              
              setNewBill({ resident_name: '', title: '', due_date: '', amount: 0 })
            }} className="p-6 space-y-4">
              {isLoadingForm ? (
                <div className="py-8 text-center text-gray-500 text-sm animate-pulse">Memuat form data...</div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Penghuni</label>
                    <Select 
                      options={editingBillId ? [
                        ...users.filter(u => (!u.status || u.status === 'Aktif') && String(u.role).includes('user')).map(u => ({ label: `${u.full_name} (Kamar ${u.room_number || '-'})`, value: u.full_name }))
                      ] : [
                        { label: '--- Semua Penghuni ---', value: 'ALL' },
                        ...users.filter(u => (!u.status || u.status === 'Aktif') && String(u.role).includes('user')).map(u => ({ label: `${u.full_name} (Kamar ${u.room_number || '-'})`, value: u.full_name }))
                      ]}
                      value={newBill.resident_name}
                      onChange={val => setNewBill({...newBill, resident_name: val})}
                      placeholder="Pilih penghuni..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Keterangan / Judul Tagihan</label>
                    <Select 
                      options={templates.map(t => ({ label: t.title, value: t.title }))}
                      value={newBill.title}
                      onChange={val => {
                        const template = templates.find(t => t.title === val)
                        let formattedDueDate = newBill.due_date
                        if (template && template.due_date) {
                          const today = new Date()
                          const pt = template.contribution_types?.period_type || 'Bulanan'
                          
                          if (pt === 'Bulanan') {
                            const day = parseInt(template.due_date)
                            if (!isNaN(day)) {
                              let nextDate = new Date(today.getFullYear(), today.getMonth(), day)
                              if (nextDate < today) {
                                nextDate = new Date(today.getFullYear(), today.getMonth() + 1, day)
                              }
                              formattedDueDate = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(nextDate.getDate()).padStart(2, '0')}`
                            }
                          } else if (pt === 'Tahunan') {
                            const parts = template.due_date.split('-')
                            if (parts.length === 2) {
                              const month = parseInt(parts[0])
                              const day = parseInt(parts[1])
                              let nextDate = new Date(today.getFullYear(), month - 1, day)
                              if (nextDate < today) {
                                nextDate = new Date(today.getFullYear() + 1, month - 1, day)
                              }
                              formattedDueDate = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(nextDate.getDate()).padStart(2, '0')}`
                            }
                          } else if (pt === 'Mingguan') {
                            const days = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu']
                            const targetDay = days.indexOf(template.due_date)
                            if (targetDay !== -1) {
                              let nextDate = new Date(today)
                              const diff = (targetDay + 7 - today.getDay()) % 7
                              nextDate.setDate(today.getDate() + (diff === 0 ? 7 : diff))
                              formattedDueDate = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-${String(nextDate.getDate()).padStart(2, '0')}`
                            }
                          } else {
                            try {
                              const d = new Date(template.due_date)
                              if (!isNaN(d.getTime())) {
                                formattedDueDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
                              }
                            } catch (e) {}
                          }
                        }
                        setNewBill({...newBill, title: val, amount: template ? Number(template.amount) || 0 : 0, due_date: formattedDueDate})
                      }}
                      placeholder="Pilih template iuran..."
                    />
                    {newBill.title && !templates.find(t => t.title === newBill.title) && (
                      <input 
                        type="text" 
                        className="form-input mt-2" 
                        value={newBill.title} 
                        onChange={e => setNewBill({...newBill, title: e.target.value})} 
                        placeholder="Atau ketik keterangan kustom..." 
                      />
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Nominal (Rp)</label>
                      <input required type="number" className="form-input bg-gray-50" value={newBill.amount || ''} onChange={e => setNewBill({...newBill, amount: Number(e.target.value)})} placeholder="50000" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Jatuh Tempo</label>
                      <input required type="date" className="form-input" value={newBill.due_date} onChange={e => setNewBill({...newBill, due_date: e.target.value})} />
                    </div>
                  </div>
                </>
              )}
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={closeFormModal} className="btn-secondary flex-1">Batal</button>
                <button type="submit" disabled={isSubmitting || isLoadingForm || !newBill.resident_name || !newBill.title} className="btn-primary flex-1 flex justify-center items-center">
                  {isSubmitting ? 'Memproses...' : <><Save className="w-5 h-5 mr-2" /> Simpan</>}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Detail Modal */}
      {isDetailModalOpen && selectedBill && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900">Rincian Tagihan</h2>
              <button onClick={() => setIsDetailModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Penghuni</span>
                  <span className="font-semibold text-gray-900">{selectedBill.resident_name} (Kamar {selectedBill.room_number})</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Tagihan</span>
                  <span className="font-medium text-gray-900">{selectedBill.contributions?.title}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Jatuh Tempo</span>
                  <span className="font-medium text-gray-900">{new Date(selectedBill.due_date).toLocaleDateString('id-ID')}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                  <span className="text-sm text-gray-500">Nominal</span>
                  <span className="text-lg font-bold text-primary">{formatCurrency(selectedBill.amount)}</span>
                </div>
              </div>
              <div className="flex justify-between items-center bg-white border border-gray-200 p-4 rounded-xl">
                <span className="text-sm font-medium text-gray-700">Status Pembayaran</span>
                {getStatusBadge(selectedBill.status)}
              </div>
              {selectedBill.status === 'unpaid' && (
                <button 
                  onClick={async () => {
                    const { success } = await spreadsheetApi.put('Bills', { id: selectedBill.id, status: 'paid' })
                    setBills(bills.map(b => b.id === selectedBill.id ? {...b, status: 'paid'} : b))
                    setIsDetailModalOpen(false)
                    setToastMessage(success ? 'Tagihan berhasil ditandai Lunas!' : 'Disimpan lokal (Gagal terhubung ke Sheets)')
                    setTimeout(() => setToastMessage(''), 3000)
                  }}
                  className="w-full btn-primary flex items-center justify-center bg-emerald-600 hover:bg-emerald-700"
                >
                  <Check className="w-5 h-5 mr-2" /> Tandai Lunas (Manual)
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
