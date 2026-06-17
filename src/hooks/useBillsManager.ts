import { useState, useEffect } from 'react'
import { billingService } from '@/services/billingService'
import { spreadsheetApi } from '@/lib/spreadsheet'
import { checkPeriodLock, toInputDate, isDateInPeriod, type PeriodFilter } from '@/lib/accounting/period'
import { syncBillsWithAccountingEntries } from '@/lib/billingAccountingSync'
import { generateSecureId } from '@/utils/id'
import type { Bill, User, Payment } from '@/types/database'

interface AlertDialogState {
  isOpen: boolean
  title: string
  message: string
  variant: 'danger' | 'info' | 'success'
  showCancel?: boolean
  confirmLabel?: string
  onConfirm?: () => void
}

export function useBillsManager(period: PeriodFilter = { preset: 'all' }) {
  const [bills, setBills] = useState<Bill[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [templates, setTemplates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isLoadingForm, setIsLoadingForm] = useState(false)
  const [search, setSearch] = useState('')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [editingBillId, setEditingBillId] = useState<number | string | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedBillIds, setSelectedBillIds] = useState<(string | number)[]>([])
  const [isBulkActioning, setIsBulkActioning] = useState(false)
  const [billingDueDay, setBillingDueDay] = useState(12)

  const [newBill, setNewBill] = useState({
    resident_name: '',
    title: '',
    due_date: '',
    amount: 0
  })

  const [alertDialog, setAlertDialog] = useState<AlertDialogState>({
    isOpen: false,
    title: '',
    message: '',
    variant: 'info',
    showCancel: false,
    confirmLabel: 'Mengerti'
  })

  useEffect(() => {
    fetchBills()
  }, [])

  useEffect(() => {
    if (isAddModalOpen && templates.length === 0) {
      fetchFormData()
    }
  }, [isAddModalOpen])

  const clampDueDay = (day: number, baseDate = new Date()) => {
    const lastDay = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0).getDate()
    return Math.min(Math.max(day || 1, 1), lastDay)
  }

  const buildDefaultDueDate = (day = billingDueDay, baseDate = new Date()) => {
    return toInputDate(new Date(baseDate.getFullYear(), baseDate.getMonth(), clampDueDay(day, baseDate)))
  }

  const fetchBills = async () => {
    setLoading(true)
    try {
      const [billsRes, usersRes, settingsRes, journalRes] = await Promise.all([
        billingService.getBills(),
        spreadsheetApi.get('Users'),
        spreadsheetApi.get('Settings'),
        spreadsheetApi.get('JournalEntries')
      ])

      const userRows = (usersRes.data && Array.isArray(usersRes.data) ? usersRes.data : []) as User[]
      setUsers(userRows)

      if (billsRes.data && Array.isArray(billsRes.data)) {
        const { bills: syncedBills, syncedCount } = await syncBillsWithAccountingEntries({
          bills: billsRes.data,
          journalEntries: journalRes.data && Array.isArray(journalRes.data) ? journalRes.data : [],
          users: userRows,
          persist: true,
        })
        setBills(syncedBills as Bill[])
        if (syncedCount > 0) {
          showToast(`${syncedCount} status tagihan tersinkron dari jurnal akuntansi.`)
        }
      } else {
        setBills([])
      }

      if (settingsRes.data && Array.isArray(settingsRes.data) && settingsRes.data[0]) {
        const configuredDay = Number(settingsRes.data[0].defaultBillingDueDay || settingsRes.data[0].billingDueDay)
        if (Number.isFinite(configuredDay) && configuredDay >= 1) {
          const normalizedDay = Math.min(Math.max(configuredDay, 1), 31)
          setBillingDueDay(normalizedDay)
          setNewBill(prev => prev.due_date ? prev : { ...prev, due_date: buildDefaultDueDate(normalizedDay) })
        }
      } else {
        setNewBill(prev => prev.due_date ? prev : { ...prev, due_date: buildDefaultDueDate(12) })
      }
    } catch (e) {
      console.error("Gagal mengambil data tagihan:", e)
    } finally {
      setLoading(false)
    }
  }

  const fetchFormData = async () => {
    setIsLoadingForm(true)
    try {
      const templatesRes = await spreadsheetApi.get('Contributions')
      if (templatesRes.data && Array.isArray(templatesRes.data)) {
        setTemplates(templatesRes.data.filter((t: any) => t.status === 'active'))
      }
    } catch (err) {
      console.error("Gagal memuat template iuran:", err)
    } finally {
      setIsLoadingForm(false)
    }
  }

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 3000)
  }

  const openAddModal = () => {
    setNewBill({
      resident_name: '',
      title: '',
      due_date: buildDefaultDueDate(billingDueDay),
      amount: 0
    })
    setEditingBillId(null)
    setIsAddModalOpen(true)
  }

  const closeAddModal = () => {
    setIsAddModalOpen(false)
    setEditingBillId(null)
  }

  const handleSelectTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId)
    if (template) {
      setNewBill(prev => ({
        ...prev,
        title: template.title,
        amount: Number(template.amount) || 0
      }))
    }
  }

  const handleDelete = (id: number | string) => {
    setAlertDialog({
      isOpen: true,
      title: 'Hapus Tagihan',
      message: 'Apakah Anda yakin ingin menghapus tagihan ini? Tindakan ini tidak dapat dibatalkan.',
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
    const originalBills = [...bills]
    const originalSelectedIds = [...selectedBillIds]

    setBills(bills.filter(b => b.id !== id))
    setSelectedBillIds(selectedBillIds.filter(selectedId => selectedId !== id))

    const targetBill = originalBills.find(b => b.id === id)
    if (!targetBill) return

    let journalDate = new Date().toISOString().split('T')[0]
    try {
      const { data: journalEntries } = await spreadsheetApi.get('JournalEntries')
      const matchedJournal = Array.isArray(journalEntries) && journalEntries.find(j => String(j.id) === `BIL-${id}`)
      if (matchedJournal) {
        journalDate = matchedJournal.date
      }
    } catch (e) {
      console.warn("Gagal mengambil data jurnal untuk check lock:", e)
    }

    const isLocked = await checkPeriodLock(journalDate)
    if (isLocked) {
      setBills(originalBills)
      setSelectedBillIds(originalSelectedIds)
      setAlertDialog({
        isOpen: true,
        title: 'Periode Terkunci',
        message: 'Gagal menghapus tagihan: Transaksi ini berada di periode yang sudah ditutup (Locked).',
        variant: 'danger',
        showCancel: false,
        confirmLabel: 'Mengerti'
      })
      return
    }

    let step1Success = false
    try {
      const res1 = await billingService.deleteBill(String(id))
      if (!res1.success) throw new Error(res1.error?.message || 'Gagal menghapus tagihan di Sheets.')
      step1Success = true

      const { data: journalEntries } = await spreadsheetApi.get('JournalEntries')
      const hasJournal = Array.isArray(journalEntries) && journalEntries.some(j => String(j.id) === `BIL-${id}`)
      if (hasJournal) {
        const res2 = await spreadsheetApi.del('JournalEntries', `BIL-${id}`)
        if (!res2.success) throw new Error((res2.error as any)?.message || 'Gagal menghapus jurnal piutang di Sheets.')
      }

      showToast('Tagihan dan jurnal piutang berhasil dihapus.')
    } catch (err: any) {
      console.error(err)
      setBills(originalBills)
      setSelectedBillIds(originalSelectedIds)

      if (step1Success && targetBill) {
        await billingService.createBill(targetBill)
      }

      setAlertDialog({
        isOpen: true,
        title: 'Gagal Menghapus',
        message: `Gagal menghapus tagihan: ${err.message || err}. Perubahan telah dibatalkan.`,
        variant: 'danger',
        showCancel: false,
        confirmLabel: 'Mengerti'
      })
    }
  }

  const handleBulkDelete = () => {
    setAlertDialog({
      isOpen: true,
      title: 'Hapus Massal Tagihan',
      message: `Apakah Anda yakin ingin menghapus ${selectedBillIds.length} tagihan terpilih secara permanen?`,
      variant: 'danger',
      showCancel: true,
      confirmLabel: 'Ya, Hapus Semua',
      onConfirm: () => {
        setAlertDialog(prev => ({ ...prev, isOpen: false }))
        executeBulkDelete()
      }
    })
  }

  const executeBulkDelete = async () => {
    setIsBulkActioning(true)
    const originalBills = [...bills]
    const originalSelectedIds = [...selectedBillIds]

    setBills(bills.filter(b => !selectedBillIds.includes(b.id)))

    const billsToDelete = originalBills.filter(b => originalSelectedIds.includes(b.id))

    let journalEntries: any[] = []
    try {
      const { data } = await spreadsheetApi.get('JournalEntries')
      if (Array.isArray(data)) {
        journalEntries = data
      }
    } catch (e) {
      console.warn("Gagal mengambil daftar jurnal:", e)
    }

    for (const id of originalSelectedIds) {
      const matchedJournal = journalEntries.find(j => String(j.id) === `BIL-${id}`)
      const journalDate = matchedJournal ? matchedJournal.date : new Date().toISOString().split('T')[0]
      const isLocked = await checkPeriodLock(journalDate)
      if (isLocked) {
        setBills(originalBills)
        setAlertDialog({
          isOpen: true,
          title: 'Periode Terkunci',
          message: 'Gagal menghapus tagihan secara massal: Terdapat transaksi yang berada di periode yang sudah ditutup (Locked).',
          variant: 'danger',
          showCancel: false,
          confirmLabel: 'Mengerti'
        })
        setIsBulkActioning(false)
        return
      }
    }

    const deletedBills: Bill[] = []
    const deletedJournals: { id: string; originalData: any }[] = []
    let transactionSuccess = true
    let errorMessage = ''

    try {
      for (const bill of billsToDelete) {
        const resBill = await billingService.deleteBill(bill.id)
        if (!resBill.success) {
          throw new Error(resBill.error?.message || `Gagal menghapus tagihan ${bill.id}`)
        }
        deletedBills.push(bill)

        const hasJournal = journalEntries.some(j => String(j.id) === `BIL-${bill.id}`)
        if (hasJournal) {
          const originalJournal = journalEntries.find(j => String(j.id) === `BIL-${bill.id}`)
          const resJournal = await spreadsheetApi.del('JournalEntries', `BIL-${bill.id}`)
          if (!resJournal.success) {
            throw new Error((resJournal.error as any)?.message || `Gagal menghapus jurnal piutang untuk tagihan ${bill.id}`)
          }
          deletedJournals.push({ id: `BIL-${bill.id}`, originalData: originalJournal })
        }
      }
    } catch (err: any) {
      transactionSuccess = false
      errorMessage = err.message || String(err)

      // Rollback deleted records
      for (const item of deletedJournals) {
        await spreadsheetApi.post('JournalEntries', item.originalData)
      }
      for (const deletedBill of deletedBills) {
        await billingService.createBill(deletedBill)
      }
    }

    setIsBulkActioning(false)

    if (transactionSuccess) {
      setSelectedBillIds([])
      setIsEditMode(false)
      showToast(`${deletedBills.length} tagihan massal berhasil dihapus.`)
    } else {
      setBills(originalBills)
      setAlertDialog({
        isOpen: true,
        title: 'Gagal Hapus Massal',
        message: `Gagal menghapus tagihan secara massal: ${errorMessage}. Seluruh perubahan dibatalkan.`,
        variant: 'danger',
        showCancel: false,
        confirmLabel: 'Mengerti'
      })
    }
  }

  const handleBulkLunas = () => {
    setAlertDialog({
      isOpen: true,
      title: 'Tandai Lunas Massal',
      message: `Apakah Anda yakin ingin menandai ${selectedBillIds.length} tagihan terpilih sebagai Lunas?`,
      variant: 'info',
      showCancel: true,
      confirmLabel: 'Ya, Tandai Lunas',
      onConfirm: () => {
        setAlertDialog(prev => ({ ...prev, isOpen: false }))
        executeBulkLunas()
      }
    })
  }

  const executeBulkLunas = async () => {
    setIsBulkActioning(true)
    const originalBills = [...bills]
    const originalSelectedIds = [...selectedBillIds]

    const updatedLocalBills = bills.map(b => 
      originalSelectedIds.includes(b.id) ? { ...b, status: 'paid' } : b
    )
    setBills(updatedLocalBills)

    const isLocked = await checkPeriodLock(new Date().toISOString().split('T')[0])
    if (isLocked) {
      setBills(originalBills)
      setAlertDialog({
        isOpen: true,
        title: 'Periode Terkunci',
        message: 'Gagal memproses pelunasan massal: Periode akuntansi saat ini sudah ditutup (Locked).',
        variant: 'danger',
        showCancel: false,
        confirmLabel: 'Mengerti'
      })
      setIsBulkActioning(false)
      return
    }

    const billsToPay = originalBills.filter(b => originalSelectedIds.includes(b.id) && b.status !== 'paid')
    const paidBills: Bill[] = []
    const createdPayments: string[] = []
    const createdJournals: string[] = []
    let transactionSuccess = true
    let errorMessage = ''

    try {
      for (const bill of billsToPay) {
        const updatedBill = { ...bill, status: 'paid' }
        const resBill = await billingService.updateBill(updatedBill)
        if (!resBill.success) throw new Error(resBill.error?.message || `Gagal memperbarui status tagihan ${bill.id}`)
        paidBills.push(bill)

        const paymentId = generateSecureId('PAY')
        const newPayment = {
          id: paymentId,
          resident_name: bill.resident_name,
          resident_email: bill.resident_email,
          room_number: bill.room_number,
          amount: bill.amount,
          date: new Date().toISOString().split('T')[0],
          date_submitted: new Date().toISOString(),
          status: 'verified',
          billId: String(bill.id)
        }

        const resPay = await billingService.createPayment(newPayment)
        if (!resPay.success) throw new Error(resPay.error?.message || `Gagal membuat pembayaran lunas untuk ${bill.resident_name}`)
        createdPayments.push(paymentId)

        const journalId = generateSecureId('JE')
        const journalPayload = {
          id: journalId,
          date: new Date().toISOString().split('T')[0],
          description: `Penerimaan Kas Sewa Kamar (Lunas Massal) - ${bill.resident_name}`,
          debits: JSON.stringify([{ accountNumber: '1102', amount: Number(bill.amount) }]),
          credits: JSON.stringify([{ accountNumber: '1104', amount: Number(bill.amount) }]),
          source: 'payment_verification',
          source_id: paymentId,
          created_at: new Date().toISOString()
        }

        const resJournal = await spreadsheetApi.post('JournalEntries', journalPayload)
        if (!resJournal.success) throw new Error((resJournal.error as any)?.message || `Gagal memposting kas masuk untuk ${bill.resident_name}`)
        createdJournals.push(journalId)
      }
    } catch (err: any) {
      transactionSuccess = false
      errorMessage = err.message || String(err)

      // Rollback
      for (const journalId of createdJournals) {
        await spreadsheetApi.del('JournalEntries', journalId)
      }
      for (const payId of createdPayments) {
        await billingService.deletePayment(payId)
      }
      for (const paidBill of paidBills) {
        await billingService.updateBill(paidBill)
      }
    }

    setIsBulkActioning(false)

    if (transactionSuccess) {
      setSelectedBillIds([])
      setIsEditMode(false)
      showToast(`${paidBills.length} tagihan berhasil dilunasi dan kas masuk dicatat!`)
    } else {
      setBills(originalBills)
      setAlertDialog({
        isOpen: true,
        title: 'Gagal Pelunasan Massal',
        message: `Gagal melunasi tagihan secara massal: ${errorMessage}. Seluruh perubahan dibatalkan.`,
        variant: 'danger',
        showCancel: false,
        confirmLabel: 'Mengerti'
      })
    }
  }

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    if (editingBillId) {
      const originalBill = bills.find(b => b.id === editingBillId)
      if (!originalBill) {
        setIsSubmitting(false)
        return
      }

      const isLocked = await checkPeriodLock(originalBill.due_date)
      if (isLocked) {
        setAlertDialog({
          isOpen: true,
          title: 'Periode Terkunci',
          message: 'Gagal memperbarui tagihan: Transaksi ini berada di periode yang sudah ditutup (Locked).',
          variant: 'danger',
          showCancel: false,
          confirmLabel: 'Mengerti'
        })
        setIsSubmitting(false)
        return
      }

      const isNewDateLocked = await checkPeriodLock(newBill.due_date)
      if (isNewDateLocked) {
        setAlertDialog({
          isOpen: true,
          title: 'Periode Terkunci',
          message: 'Gagal memperbarui tagihan: Tanggal baru berada di periode yang sudah ditutup (Locked).',
          variant: 'danger',
          showCancel: false,
          confirmLabel: 'Mengerti'
        })
        setIsSubmitting(false)
        return
      }

      const selectedUser = users.find(u => u.full_name === newBill.resident_name)
      const updatedBill: Bill = {
        ...originalBill,
        resident_name: newBill.resident_name,
        room_number: selectedUser ? (selectedUser.room_number || 'N/A') : originalBill.room_number,
        contributions: JSON.stringify({ title: newBill.title, contribution_types: { name: 'Kustom' } }),
        due_date: newBill.due_date,
        amount: Number(newBill.amount)
      }

      const originalBills = [...bills]
      setBills(bills.map(b => b.id === editingBillId ? updatedBill : b))

      try {
        const res = await billingService.updateBill(updatedBill)
        if (!res.success) throw new Error(res.error?.message || 'Gagal menyimpan perubahan tagihan.')

        const { data: journalEntries } = await spreadsheetApi.get('JournalEntries')
        const matchedJournal = Array.isArray(journalEntries) && journalEntries.find(j => String(j.id) === `BIL-${editingBillId}`)
        if (matchedJournal) {
          const updatedJournal = {
            ...matchedJournal,
            debits: JSON.stringify([{ accountNumber: '1104', amount: Number(updatedBill.amount) }]),
            credits: JSON.stringify([{ accountNumber: '4101', amount: Number(updatedBill.amount) }])
          }
          const resJ = await spreadsheetApi.put('JournalEntries', updatedJournal)
          if (!resJ.success) throw new Error((resJ.error as any)?.message || 'Gagal memperbarui jurnal piutang.')
        }

        setIsAddModalOpen(false)
        setEditingBillId(null)
        showToast('Tagihan dan jurnal piutang berhasil diperbarui!')
      } catch (err: any) {
        console.error(err)
        setBills(originalBills)
        setAlertDialog({
          isOpen: true,
          title: 'Gagal Memperbarui',
          message: `Gagal memperbarui tagihan: ${err.message || err}. Perubahan telah dibatalkan.`,
          variant: 'danger',
          showCancel: false,
          confirmLabel: 'Mengerti'
        })
      } finally {
        setIsSubmitting(false)
      }
      return
    }

    let billsToAdd: Bill[] = []

    if (newBill.resident_name === 'ALL') {
      const activeUsers = users.filter(u => (!u.status || u.status === 'Aktif') && String(u.role).includes('user'))
      billsToAdd = activeUsers.map((user, idx) => ({
        id: generateSecureId('BIL'),
        resident_name: user.full_name,
        resident_email: user.email,
        room_number: user.room_number || 'N/A',
        contributions: JSON.stringify({ title: newBill.title, contribution_types: { name: 'Kustom' } }),
        due_date: newBill.due_date,
        amount: Number(newBill.amount),
        status: 'unpaid'
      }))
    } else {
      const selectedUser = users.find(u => u.id?.toString() === newBill.resident_name || u.full_name === newBill.resident_name)
      const targetId = generateSecureId('BIL')
      billsToAdd = [{
        id: targetId,
        resident_name: selectedUser ? selectedUser.full_name : newBill.resident_name,
        resident_email: selectedUser ? selectedUser.email : '',
        room_number: selectedUser ? (selectedUser.room_number || 'N/A') : 'N/A',
        contributions: JSON.stringify({ title: newBill.title, contribution_types: { name: 'Kustom' } }),
        due_date: newBill.due_date,
        amount: Number(newBill.amount),
        status: 'unpaid'
      }]
    }

    const isLocked = await checkPeriodLock(new Date().toISOString().split('T')[0])
    if (isLocked) {
      setAlertDialog({
        isOpen: true,
        title: 'Periode Terkunci',
        message: 'Gagal membuat tagihan: Periode akuntansi bulan ini sudah ditutup (Locked).',
        variant: 'danger',
        showCancel: false,
        confirmLabel: 'Mengerti'
      })
      setIsSubmitting(false)
      return
    }

    const isDueDateLocked = await checkPeriodLock(newBill.due_date)
    if (isDueDateLocked) {
      setAlertDialog({
        isOpen: true,
        title: 'Periode Terkunci',
        message: 'Gagal membuat tagihan: Tanggal jatuh tempo berada di periode yang sudah ditutup (Locked).',
        variant: 'danger',
        showCancel: false,
        confirmLabel: 'Mengerti'
      })
      setIsSubmitting(false)
      return
    }

    const createdBills: Bill[] = []
    const createdJournals: string[] = []
    let transactionSuccess = true
    let errorMessage = ''

    try {
      for (const bill of billsToAdd) {
        const resBill = await billingService.createBill(bill)
        if (!resBill.success) {
          throw new Error(resBill.error?.message || `Gagal menyimpan tagihan untuk ${bill.resident_name}`)
        }
        createdBills.push(bill)

        const journalPayload = {
          id: `BIL-${bill.id}`,
          date: new Date().toISOString().split('T')[0],
          description: `Pencatatan Piutang Sewa - ${bill.resident_name} (${newBill.title})`,
          debits: JSON.stringify([{ accountNumber: '1104', amount: Number(bill.amount) }]),
          credits: JSON.stringify([{ accountNumber: '4101', amount: Number(bill.amount) }]),
          source: 'billing_invoice',
          source_id: String(bill.id),
          created_at: new Date().toISOString()
        }

        const resJournal = await spreadsheetApi.post('JournalEntries', journalPayload)
        if (!resJournal.success) {
          throw new Error((resJournal.error as any)?.message || `Gagal memposting jurnal piutang untuk ${bill.resident_name}`)
        }
        createdJournals.push(journalPayload.id)
      }
    } catch (err: any) {
      transactionSuccess = false
      errorMessage = err.message || String(err)

      for (const journalId of createdJournals) {
        await spreadsheetApi.del('JournalEntries', journalId)
      }
      for (const createdBill of createdBills) {
        await billingService.deleteBill(createdBill.id)
      }
    }

    setIsSubmitting(false)
    if (transactionSuccess) {
      setBills(prev => [...billsToAdd, ...prev])
      setIsAddModalOpen(false)
      if (billsToAdd.length > 1) {
        showToast(`${billsToAdd.length} tagihan massal dan jurnal piutang berhasil dibuat!`)
      } else {
        showToast('Tagihan dan jurnal piutang berhasil dibuat!')
      }
      setNewBill({ resident_name: '', title: '', due_date: buildDefaultDueDate(), amount: 0 })
    } else {
      setAlertDialog({
        isOpen: true,
        title: 'Gagal Membuat Tagihan',
        message: `Gagal membuat tagihan: ${errorMessage}. Seluruh perubahan telah dibatalkan.`,
        variant: 'danger',
        showCancel: false,
        confirmLabel: 'Mengerti'
      })
    }
  }

  const handleEditClick = (bill: Bill) => {
    let titleVal = ''
    try {
      const parsed = JSON.parse(bill.contributions || '{}')
      titleVal = parsed.title || ''
    } catch {
      titleVal = bill.title || ''
    }

    setEditingBillId(bill.id)
    setNewBill({
      resident_name: bill.resident_name,
      title: titleVal,
      due_date: toInputDate(new Date(bill.due_date)),
      amount: bill.amount
    })
    setIsAddModalOpen(true)
  }

  // Filter bills based on search query and period filter
  const filteredBills = bills.filter(bill => {
    const query = search.toLowerCase()
    
    // Check search query
    let matchesSearch = false
    try {
      const contributionsData = JSON.parse(bill.contributions || '{}')
      matchesSearch = (bill.resident_name || '').toLowerCase().includes(query) ||
                      (contributionsData.title || '').toLowerCase().includes(query)
    } catch {
      matchesSearch = (bill.resident_name || '').toLowerCase().includes(query) ||
                      (bill.title || '').toLowerCase().includes(query)
    }

    // Check period lock & dates
    const matchesPeriod = isDateInPeriod(bill.due_date, period)
    
    return matchesSearch && matchesPeriod
  })

  return {
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
    toastMessage,
    setToastMessage,
    newBill,
    setNewBill,
    billingDueDay,
    setBillingDueDay,
    editingBillId,
    setEditingBillId,
    isEditMode,
    setIsEditMode,
    selectedBillIds,
    setSelectedBillIds,
    isBulkActioning,
    alertDialog,
    setAlertDialog,
    fetchBills,
    openAddModal,
    closeAddModal,
    handleSelectTemplate,
    handleDelete,
    handleBulkDelete,
    handleBulkLunas,
    handleCreateInvoice,
    handleEditClick,
    buildDefaultDueDate
  }
}
