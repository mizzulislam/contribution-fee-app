import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle2, Clock, XCircle, FileText, Search, Bell, Plus, X, Save, Check, Pencil, Trash2, Edit, Loader2 } from 'lucide-react'
import { TableLoader } from '@/components/ui/TableLoader'
import Select from '@/components/ui/Select'
import { type PeriodFilter } from '@/features/accounting/calculations/period'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { useBillsManager } from '@/features/billing/hooks/useBillsManager'
import { spreadsheetApi } from '@/services/sheets-client'
import { defaultEngine } from '@/features/accounting'

interface BillsPaymentsProps {
  period?: PeriodFilter
}

const defaultPeriod: PeriodFilter = { preset: 'all' }

export default function BillsPayments({ period = defaultPeriod }: BillsPaymentsProps) {
  const [sendingStatus, setSendingStatus] = useState<Record<string, boolean>>({})
  const [whatsappSettings, setWhatsappSettings] = useState({
    provider: 'manual',
    token: '',
    sender: ''
  })

  useEffect(() => {
    async function loadWhatsappSettings() {
      try {
        const { data } = await spreadsheetApi.get('NotificationSettings')
        if (data && data.length > 0) {
          const remoteSettings = data[0]
          setWhatsappSettings({
            provider: remoteSettings.whatsappProvider || 'manual',
            token: remoteSettings.whatsappToken || '',
            sender: remoteSettings.whatsappSender || ''
          })
        }
      } catch (err) {
        console.error('Failed to load WhatsApp settings:', err)
      }
    }
    loadWhatsappSettings()
  }, [])

  const {
    bills,
    setBills,
    filteredBills,
    users,
    templates,
    loading,
    isLoadingForm,
    search,
    setSearch,
    isAddModalOpen,
    setIsAddModalOpen,
    isDetailModalOpen,
    setIsDetailModalOpen,
    selectedBill,
    setSelectedBill,
    isSubmitting,
    isFormSuccessOpen,
    toastMessage,
    setToastMessage,
    newBill,
    setNewBill,
    editingBillId,
    isEditMode,
    setIsEditMode,
    selectedBillIds,
    setSelectedBillIds,
    isBulkActioning,
    alertDialog,
    setAlertDialog,
    openAddModal,
    closeAddModal: closeFormModal,
    handleSelectTemplate,
    handleDelete,
    handleBulkDelete,
    handleBulkLunas: handleBulkPaid,
    handleCreateInvoice,
    handleEditClick: handleEdit,
    buildDefaultDueDate,
    handleDebtCompensation,
    handleMarkAsPaid
  } = useBillsManager(period)

  const getDebtInfo = () => {
    if (!selectedBill) return { hasDebt: false, account: null, balance: 0 }
    const user = users.find(u => u.full_name === selectedBill.resident_name)
    const searchTerms = [
      user?.nickname,
      user?.full_name?.split(' ')[0],
      selectedBill.resident_name.split(' ')[0]
    ].filter(Boolean)

    const accounts = defaultEngine.coa.getAllAccounts()
    const debtAccount = accounts.find(acc => {
      const isLiability = acc.accountType === 'Liabilities'
      const nameLower = acc.accountName.toLowerCase()
      return isLiability && searchTerms.some(term => nameLower.includes(term!.toLowerCase()))
    })

    if (!debtAccount) return { hasDebt: false, account: null, balance: 0 }

    const balance = defaultEngine.ledger.getLedger(debtAccount.accountNumber)?.currentBalance || 0
    return {
      hasDebt: balance > 0,
      account: debtAccount,
      balance
    }
  }

  const debtInfo = getDebtInfo()

  const formatCurrency = (amount: number) => {
    return (
      <div className="flex justify-between items-center w-full min-w-[100px]">
        <span className="text-gray-500 mr-2">Rp</span>
        <span>{new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(amount)}</span>
      </div>
    )
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight flex items-center">
            <FileText className="mr-2 sm:mr-3 text-primary w-6 h-6 sm:w-8 sm:h-8" />
            Tagihan & Pembayaran
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">Pantau seluruh status tagihan penghuni dan riwayat pembayarannya.</p>
        </div>
        <button 
          onClick={() => {
            setNewBill(prev => ({ ...prev, due_date: prev.due_date || buildDefaultDueDate() }))
            setIsAddModalOpen(true)
          }}
          className="btn-primary flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" /> Buat Tagihan Baru
        </button>
      </div>

      <div className="card-container">
        <div className="py-4 pr-4 pl-0 sm:py-6 sm:pr-6 sm:pl-0 border-b border-border flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50/50 rounded-t-[20px]">
          <div className="relative w-full sm:max-w-lg">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Cari penghuni atau tagihan..." 
              className="form-input pl-10 bg-white"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {!isEditMode ? (
            <button
              type="button"
              onClick={() => setIsEditMode(true)}
              className="btn-secondary flex h-[42px] w-full items-center justify-end sm:justify-center whitespace-nowrap px-4 text-sm text-blue-700 hover:bg-blue-50 hover:border-blue-200 focus:border-gray-200 focus:outline-none focus:ring-0 focus-visible:border-gray-200 focus-visible:outline-none focus-visible:ring-0 sm:w-auto"
            >
              <Edit className="w-4 h-4 mr-2 flex-shrink-0" />
              Edit
            </button>
          ) : (
            <div className="flex gap-2 w-full sm:w-auto animate-in fade-in slide-in-from-right-4 duration-300">
              <button
                type="button"
                onClick={() => {
                  setIsEditMode(false)
                  setSelectedBillIds([])
                }}
                disabled={isBulkActioning}
                className="btn-secondary flex items-center justify-end sm:justify-center whitespace-nowrap h-[42px] text-sm px-4 disabled:opacity-50 focus:border-gray-200 focus:outline-none focus:ring-0 focus-visible:border-gray-200 focus-visible:outline-none focus-visible:ring-0 w-full sm:w-auto flex-1 sm:flex-initial"
              >
                Batal
              </button>
              <button 
                onClick={handleBulkDelete}
                disabled={isBulkActioning || selectedBillIds.length === 0}
                className="btn-secondary flex items-center justify-end sm:justify-center whitespace-nowrap h-[42px] text-sm text-red-600 hover:bg-red-50 hover:border-red-200 border-gray-200 px-4 disabled:opacity-50 focus:border-gray-200 focus:outline-none focus:ring-0 focus-visible:border-gray-200 focus-visible:outline-none focus-visible:ring-0 w-full sm:w-auto flex-1 sm:flex-initial"
              >
                <Trash2 className="w-4 h-4 mr-2 flex-shrink-0" />
                <span>Hapus Pilihan ({selectedBillIds.length})</span>
              </button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto w-full rounded-xl border border-gray-100 shadow-sm scrollbar-thin scrollbar-thumb-gray-200">
          <table className="min-w-[750px] w-full text-left text-sm">
            <thead className="bg-[#F3F4F6] border-b border-border text-gray-600">
              <tr>
                {isEditMode && (
                  <th className="px-6 py-3 font-semibold whitespace-nowrap text-center">
                    <input 
                      type="checkbox" 
                      onChange={(e) => e.target.checked ? setSelectedBillIds(filteredBills.map(b => b.id)) : setSelectedBillIds([])}
                      checked={filteredBills.length > 0 && filteredBills.every(b => selectedBillIds.includes(b.id))}
                      className="form-checkbox h-4 w-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 transition-colors cursor-pointer"
                    />
                  </th>
                )}
                <th className="px-6 py-3 font-semibold whitespace-nowrap text-center">Penghuni</th>
                <th className="px-6 py-3 font-semibold whitespace-nowrap text-center">Keterangan</th>
                <th className="px-6 py-3 font-semibold whitespace-nowrap text-center hidden md:table-cell">Jatuh Tempo</th>
                <th className="px-6 py-3 font-semibold whitespace-nowrap text-center">Nominal</th>
                <th className="px-6 py-3 font-semibold whitespace-nowrap text-center">Status</th>
                <th className="px-6 py-3 font-semibold whitespace-nowrap text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-gray-700 bg-white">
              {loading ? (
                <TableLoader colSpan={isEditMode ? 7 : 6} text="Memuat data tagihan..." />
              ) : filteredBills.length === 0 ? (
                <tr>
                  <td colSpan={isEditMode ? 7 : 6} className="px-6 py-12 text-center text-text-muted">
                    Tidak ada tagihan yang ditemukan.
                  </td>
                </tr>
              ) : (
                filteredBills.map((bill) => (
                  <tr key={bill.id} className="hover:bg-[#ECFDF5] transition-colors">
                    {isEditMode && (
                      <td className="px-6 py-4 text-center">
                        <input 
                          type="checkbox" 
                          checked={selectedBillIds.includes(bill.id)}
                          onChange={(e) => e.target.checked ? setSelectedBillIds([...selectedBillIds, bill.id]) : setSelectedBillIds(selectedBillIds.filter(id => id !== bill.id))}
                          className="form-checkbox h-4 w-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 transition-colors cursor-pointer"
                        />
                      </td>
                    )}
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
                    <td className="px-6 py-4 text-center text-text-secondary hidden md:table-cell">{new Date(bill.due_date).toLocaleDateString('id-ID')}</td>
                    <td className="px-6 py-4 font-semibold">{formatCurrency(bill.amount)}</td>
                    <td className="px-6 py-4 text-center">{getStatusBadge(bill.status)}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-1.5">
                        {bill.status === 'unpaid' && (
                          <button 
                            onClick={async () => {
                              const resident = users.find(u => u.full_name === bill.resident_name || u.nickname === bill.resident_name)
                              const phone = resident?.phone_number ? String(resident.phone_number).replace(/[^0-9]/g, '') : ''
                              let formattedPhone = phone
                              if (phone.startsWith('0')) {
                                formattedPhone = '62' + phone.slice(1)
                              }
                              
                              if (!formattedPhone) {
                                setToastMessage(`Nomor telepon ${bill.resident_name} tidak ditemukan`)
                                  setTimeout(() => setToastMessage(''), 3000)
                                return
                              }

                              const nickname = resident?.nickname || bill.resident_name.split(' ')[0]
                              const amountStr = new Intl.NumberFormat('id-ID').format(bill.amount)
                              const dueDateStr = new Date(bill.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                              const titleStr = getContributionData(bill.contributions).title || 'Iuran'
                              
                              const msg = `Halo bang ${nickname}! 👋\n\nSekadar ngingetin nih, tagihan ${titleStr} sebesar *Rp ${amountStr}* udah mau jatuh tempo pada ${dueDateStr}.\n\nBoleh minta tolong diselesaikan pembayarannya dan upload buktinya lewat Portal Penghuni ya bang. Kalo ada kendala, kabarin aja!\n\nMakasih banyak kerjasamanya, sehat selalu! 🙏\n— Bendahara Soematra Kost`
                              
                              if (whatsappSettings.provider === 'fonnte' && whatsappSettings.token) {
                                setSendingStatus(prev => ({ ...prev, [bill.id]: true }))
                                try {
                                  const response = await (spreadsheetApi as any).sendCustomAction('send_whatsapp', {
                                    target: formattedPhone,
                                    message: msg
                                  })
                                  if (response.success) {
                                    setToastMessage(`Pesan otomatis berhasil dikirim ke ${nickname}!`)
                                  } else {
                                    throw new Error(response.error?.message || 'Gagal mengirim pesan')
                                  }
                                } catch (err: any) {
                                  console.error(err)
                                  setToastMessage(`Gagal mengirim: ${err.message || 'Error tidak diketahui'}`)
                                } finally {
                                  setSendingStatus(prev => ({ ...prev, [bill.id]: false }))
                                  setTimeout(() => setToastMessage(''), 4000)
                                }
                              } else {
                                window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(msg)}`, '_blank')
                              }
                            }}
                            disabled={sendingStatus[bill.id]}
                            title={sendingStatus[bill.id] ? "Mengirim..." : "Ingatkan"}
                            className="p-1.5 text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-colors border border-transparent hover:border-orange-200 disabled:opacity-50"
                          >
                            {sendingStatus[bill.id] ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Bell className="w-4 h-4" />
                            )}
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
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm"
          onMouseDown={closeFormModal}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900">{editingBillId ? 'Edit Tagihan' : 'Buat Tagihan Baru'}</h2>
              <button onClick={closeFormModal} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            {isFormSuccessOpen ? (
              <div className="p-8 flex flex-col items-center justify-center text-center animate-in fade-in duration-300 min-h-[350px]">
                <div className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm animate-bounce">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {editingBillId ? 'Tagihan Berhasil Diperbarui!' : 'Tagihan Berhasil Dibuat!'}
                </h3>
                <p className="text-gray-500 max-w-sm mb-6 leading-relaxed text-xs">
                  Tagihan untuk <span className="font-semibold text-gray-800">"{newBill.resident_name === 'ALL' ? 'Semua Penghuni Warga' : newBill.resident_name}"</span> telah berhasil dicatat ke sistem billing dan piutang.
                </p>
                <div className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 mb-6 text-left space-y-2 text-xs shadow-sm">
                  <div className="flex justify-between items-center pb-2 border-b border-gray-200/60">
                    <span className="text-gray-500 font-medium">Judul Tagihan</span>
                    <span className="font-semibold text-gray-800">{newBill.title}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-gray-200/60">
                    <span className="text-gray-500 font-medium">Nominal</span>
                    <span className="font-bold text-emerald-600 text-sm">
                      Rp {new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(newBill.amount)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-medium">Jatuh Tempo</span>
                    <span className="font-medium text-gray-800">
                      {newBill.due_date ? new Date(newBill.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeFormModal}
                  className="btn-primary w-full py-2.5 font-semibold text-sm shadow-md shadow-emerald-500/15 bg-emerald-600 hover:bg-emerald-700 hover:border-emerald-700 focus:outline-none"
                >
                  Selesai
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateInvoice} className="p-6 space-y-4">
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
                          let formattedDueDate = newBill.due_date || buildDefaultDueDate()
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
                                const nextDate = new Date(today)
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
                    {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
                    Simpan
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* Detail Modal */}
      {isDetailModalOpen && selectedBill && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm"
          onMouseDown={() => setIsDetailModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            onMouseDown={(event) => event.stopPropagation()}
          >
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
                  <span className="font-medium text-gray-900">{getContributionData(selectedBill.contributions).title}</span>
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
              {debtInfo.hasDebt && (
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-sm flex items-start gap-3">
                  <Clock className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-blue-900">Kompensasi Utang Tersedia</p>
                    <p className="text-blue-700 mt-0.5 text-xs leading-relaxed">
                      Bendahara memiliki utang sebesar <span className="font-bold text-blue-900">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(debtInfo.balance)}</span> ke {selectedBill.resident_name}.
                    </p>
                  </div>
                </div>
              )}
              <div className="flex justify-between items-center bg-white border border-gray-200 p-4 rounded-xl">
                <span className="text-sm font-medium text-gray-700">Status Pembayaran</span>
                {getStatusBadge(selectedBill.status)}
              </div>
              {selectedBill.status === 'unpaid' && (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  {debtInfo.hasDebt && (
                    <button 
                      type="button"
                      disabled={isSubmitting}
                      onClick={async () => {
                        if (debtInfo.account) {
                          await handleDebtCompensation(selectedBill, debtInfo.account.accountNumber)
                          setIsDetailModalOpen(false)
                        }
                      }}
                      className="btn-primary flex items-center justify-center bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-sm py-2.5 px-4 font-semibold rounded-xl transition-all"
                    >
                      {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                      Potong Utang
                    </button>
                  )}
                  <button 
                    disabled={isSubmitting}
                    onClick={async () => {
                      await handleMarkAsPaid(selectedBill)
                      setIsDetailModalOpen(false)
                    }}
                    className={`btn-primary flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-sm py-2.5 px-4 font-semibold rounded-xl transition-all ${!debtInfo.hasDebt ? 'col-span-2' : ''}`}
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                    {debtInfo.hasDebt ? 'Lunas Manual' : 'Tandai Lunas'}
                  </button>
                </div>
              )}
            </div>
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
        isLoading={isSubmitting || isBulkActioning}
        onClose={() => setAlertDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={alertDialog.onConfirm}
      />
    </div>
  )
}
