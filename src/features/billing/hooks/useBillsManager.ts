import { useState, useEffect } from 'react'
import { billingService } from '@/features/billing/services/billing.service'
import { spreadsheetApi } from '@/services/sheets-client'
import { checkPeriodLock, toInputDate, isDateInPeriod, type PeriodFilter } from '@/features/accounting/calculations/period'
import { generateSecureId } from '@/utils/id'
import type { Bill, User, Payment } from '@/types/database'
import { defaultEngine, syncAccountingWithSheet } from '@/features/accounting'
import { syncBillsWithAccountingEntries } from '@/features/accounting/services/billingAccountingSync'

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
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [isLoadingForm, setIsLoadingForm] = useState(false)
  const [search, setSearch] = useState('')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isFormSuccessOpen, setIsFormSuccessOpen] = useState(false)
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
      const [billsRes, usersRes, settingsRes, journalRes, paymentsRes] = await Promise.all([
        billingService.getBills(),
        spreadsheetApi.get('Users'),
        spreadsheetApi.get('Settings'),
        spreadsheetApi.get('JournalEntries'),
        billingService.getPayments()
      ])

      const userRows = (usersRes.data && Array.isArray(usersRes.data) ? usersRes.data : []) as User[]
      setUsers(userRows)

      const paymentRows = (paymentsRes.data && Array.isArray(paymentsRes.data) ? paymentsRes.data : []) as Payment[]
      setPayments(paymentRows)

      if (billsRes.data && Array.isArray(billsRes.data)) {
        const { bills: syncedBills, syncedCount } = await syncBillsWithAccountingEntries({
          bills: billsRes.data,
          journalEntries: journalRes.data && Array.isArray(journalRes.data) ? journalRes.data : [],
          users: userRows,
          persist: false,
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
    setIsFormSuccessOpen(false)
    setIsAddModalOpen(true)
  }

  const closeAddModal = () => {
    setIsAddModalOpen(false)
    setEditingBillId(null)
    setIsFormSuccessOpen(false)
    setNewBill({ resident_name: '', title: '', due_date: buildDefaultDueDate(billingDueDay), amount: 0 })
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
        executeDelete(id)
      }
    })
  }

  const executeDelete = async (id: number | string) => {
    setIsSubmitting(true)
    const originalBills = [...bills]
    const originalSelectedIds = [...selectedBillIds]

    setBills(bills.filter(b => b.id !== id))
    setSelectedBillIds(selectedBillIds.filter(selectedId => selectedId !== id))

    const targetBill = originalBills.find(b => b.id === id)
    if (!targetBill) {
      setIsSubmitting(false)
      return
    }

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
      setIsSubmitting(false)
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
      setAlertDialog(prev => ({ ...prev, isOpen: false }))
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
    } finally {
      setIsSubmitting(false)
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
      setAlertDialog(prev => ({ ...prev, isOpen: false }))
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

        // Marking bills paid from the billing module should not generate accounting journal entries here.
        // Cash receipt recording belongs in the accounting module.
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
      setAlertDialog(prev => ({ ...prev, isOpen: false }))
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

  // Helper: parse contributions payload and pick a revenue account
  const parseContribution = (contrib: any) => {
    if (!contrib) return { title: '', contribution_types: { name: '' } }
    if (typeof contrib === 'string') {
      try {
        return JSON.parse(contrib)
      } catch {
        const titleMatch = contrib.match(/title=([^,}]+)/)
        const nameMatch = contrib.match(/name=([^,}]+)/)
        return {
          title: titleMatch ? titleMatch[1].trim() : contrib,
          contribution_types: { name: nameMatch ? nameMatch[1].trim() : '' }
        }
      }
    }
    return contrib || { title: '', contribution_types: { name: '' } }
  }

  const pickRevenueAccount = (contrib: any) => {
    const parsed = parseContribution(contrib)
    const label = (parsed.contribution_types?.name || parsed.title || '').toString().toLowerCase()
    if (label.includes('sewa')) return '4101'
    if (label.includes('denda')) return '4102'
    return '4103'
  }

  const makeJournalDescription = (contrib: any, residentName: string) => {
    const parsed = parseContribution(contrib)
    const kind = parsed.contribution_types?.name || parsed.title || 'Tagihan'
    return `Pencatatan Piutang - ${kind} - ${residentName}`
  }

  const findReceivableAccount = (residentName: string) => {
    const residentNameTokens = residentName
      .split(/\s+/)
      .map(token => token.trim())
      .filter(Boolean)
      .map(token => token.toLowerCase())

    const accounts = defaultEngine.coa.getAllAccounts()
    const exactMatch = accounts.find(acc => {
      if (acc.accountType !== 'Assets') return false
      const nameLower = acc.accountName.toLowerCase()
      return residentNameTokens.every(term => nameLower.includes(term))
    })

    if (exactMatch) return exactMatch

    return accounts.find(acc => {
      if (acc.accountType !== 'Assets') return false
      const nameLower = acc.accountName.toLowerCase()
      return residentNameTokens.some(term => nameLower.includes(term))
    }) || null
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
      const selectedTemplate = templates.find(t => t.title === newBill.title)
      const contributionPayload = {
        title: newBill.title,
        contribution_types: {
          name: selectedTemplate?.contribution_types?.name || selectedTemplate?.category || 'Kustom',
          period_type: selectedTemplate?.contribution_types?.period_type || 'Bulanan'
        }
      }
      const updatedBill: Bill = {
        ...originalBill,
        resident_name: newBill.resident_name,
        room_number: selectedUser ? (selectedUser.room_number || 'N/A') : originalBill.room_number,
        title: contributionPayload.title,
        contributions: JSON.stringify(contributionPayload),
        category: selectedTemplate?.contribution_types?.name || selectedTemplate?.category || originalBill.category,
        due_date: newBill.due_date,
        amount: Number(newBill.amount)
      }

      const originalBills = [...bills]
      setBills(bills.map(b => b.id === editingBillId ? updatedBill : b))

      try {
        const res = await billingService.updateBill(updatedBill)
        if (!res.success) throw new Error(res.error?.message || 'Gagal menyimpan perubahan tagihan.')

        // Billing updates no longer synchronize invoice journals to accounting. Accounting entries are now managed from the accounting module only.
        setIsFormSuccessOpen(true)
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

    const selectedTemplate = templates.find(t => t.title === newBill.title)
    const contributionPayload = {
      title: newBill.title,
      contribution_types: {
        name: selectedTemplate?.contribution_types?.name || selectedTemplate?.category || 'Kustom',
        period_type: selectedTemplate?.contribution_types?.period_type || 'Bulanan'
      }
    }

    if (newBill.resident_name === 'ALL') {
      const activeUsers = users.filter(u => (!u.status || u.status === 'Aktif') && String(u.role).includes('user'))
      billsToAdd = activeUsers.map((user, idx) => ({
        id: generateSecureId('BIL'),
        resident_name: user.full_name,
        resident_email: user.email,
        room_number: user.room_number || 'N/A',
        title: contributionPayload.title,
        contributions: JSON.stringify(contributionPayload),
        category: contributionPayload.contribution_types.name,
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
        title: contributionPayload.title,
        contributions: JSON.stringify(contributionPayload),
        category: contributionPayload.contribution_types.name,
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

        // New billing invoices are no longer recorded directly into accounting journal entries from the billing module.
        // Accounting recording should be performed from the accounting module when needed.
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
      setIsFormSuccessOpen(true)
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

  const handleDebtCompensation = async (bill: Bill, debtAccountNumber: string) => {
    setIsSubmitting(true)
    const originalBills = [...bills]

    const currentBalance = defaultEngine.ledger.getLedger(debtAccountNumber)?.currentBalance || 0
    if (currentBalance <= 0) {
      setAlertDialog({
        isOpen: true,
        title: 'Saldo Kompensasi Kosong',
        message: 'Saldo piutang/titipan penghuni ini bernilai 0 atau tidak ditemukan, sehingga tidak bisa memotong hutang.',
        variant: 'danger',
        showCancel: false,
        confirmLabel: 'Mengerti'
      })
      setIsSubmitting(false)
      return
    }

    const compensationAmount = Math.min(currentBalance, Number(bill.amount))
    const nextStatus = compensationAmount >= Number(bill.amount) ? 'paid' : 'partially_paid'

    // Local update
    setBills(bills.map(b => b.id === bill.id ? { ...b, status: nextStatus } : b))

    const isLocked = await checkPeriodLock(new Date().toISOString().split('T')[0])
    if (isLocked) {
      setBills(originalBills)
      setAlertDialog({
        isOpen: true,
        title: 'Periode Terkunci',
        message: 'Gagal memproses kompensasi utang: Periode akuntansi saat ini sudah ditutup (Locked).',
        variant: 'danger',
        showCancel: false,
        confirmLabel: 'Mengerti'
      })
      setIsSubmitting(false)
      return
    }

    let step1Success = false
    const paymentId = generateSecureId('PAY')
    const journalId = generateSecureId('JE')

    try {
      // 1. Update bill status in sheet
      const resBill = await billingService.updateBill({ ...bill, status: nextStatus })
      if (!resBill.success) throw new Error(resBill.error?.message || 'Gagal memperbarui status tagihan.')
      step1Success = true

      // 2. Create Payment record in sheet
      const newPayment = {
        id: paymentId,
        resident_name: bill.resident_name,
        resident_email: bill.resident_email,
        room_number: bill.room_number,
        amount: compensationAmount,
        date: new Date().toISOString().split('T')[0],
        date_submitted: new Date().toISOString(),
        status: 'verified',
        billId: String(bill.id)
      }
      const resPay = await billingService.createPayment(newPayment)
      if (!resPay.success) throw new Error(resPay.error?.message || 'Gagal membuat riwayat pembayaran.')

      // 3. Create Journal Entry in sheet
      let titleVal = 'Iuran'
      try {
        const parsed = JSON.parse(bill.contributions || '{}')
        titleVal = parsed.title || 'Iuran'
      } catch {
        titleVal = bill.title || 'Iuran'
      }

      const journalPayload = {
        id: journalId,
        date: new Date().toISOString().split('T')[0],
        description: nextStatus === 'paid'
          ? `Kompensasi Utang-Piutang: Pelunasan ${titleVal} - ${bill.resident_name} via potongan Utang Bendahara`
          : `Kompensasi Utang-Piutang: Pelunasan sebagian ${titleVal} - ${bill.resident_name} via potongan Utang Bendahara`,
        debits: JSON.stringify([{ accountNumber: debtAccountNumber, amount: Number(compensationAmount) }]),
        credits: JSON.stringify([{
          accountNumber: findReceivableAccount(bill.resident_name)?.accountNumber || '1104',
          amount: Number(compensationAmount)
        }]),
        source: 'debt_compensation',
        source_id: paymentId,
        created_at: new Date().toISOString()
      }

      const resJournal = await spreadsheetApi.post('JournalEntries', journalPayload)
      if (!resJournal.success) throw new Error((resJournal.error as any)?.message || 'Gagal mencatat jurnal kompensasi utang.')

      try {
        await syncAccountingWithSheet()
        await fetchBills()
        showToast(nextStatus === 'paid' 
          ? 'Kompensasi utang berhasil dilakukan dan tagihan lunas!' 
          : `Kompensasi sebagian sebesar Rp ${new Intl.NumberFormat('id-ID').format(compensationAmount)} berhasil dilakukan, tagihan menjadi Belum Lunas!`
        )
      } catch (syncErr) {
        console.warn('Sync/Fetch after compensation failed, but writes were committed:', syncErr)
        showToast('Kompensasi utang berhasil dicatat! (Gagal memuat ulang data otomatis, silakan segarkan halaman manual)')
      }
    } catch (err: any) {
      console.error(err)
      setBills(originalBills)
      
      // Rollback if needed
      if (step1Success) {
        await billingService.updateBill(bill)
        await billingService.deletePayment(paymentId)
      }

      setAlertDialog({
        isOpen: true,
        title: 'Gagal Memproses Kompensasi',
        message: `Gagal memproses kompensasi utang: ${err.message || err}. Perubahan dibatalkan.`,
        variant: 'danger',
        showCancel: false,
        confirmLabel: 'Mengerti'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleMarkAsPaid = async (bill: Bill) => {
    setIsSubmitting(true)
    const originalBills = [...bills]

    setBills(bills.map(b => b.id === bill.id ? { ...b, status: 'paid' } : b))

    try {
      const isLocked = await checkPeriodLock(new Date().toISOString().split('T')[0])
      if (isLocked) {
        throw new Error('Periode akuntansi bulan ini sudah ditutup (Locked).')
      }

      const res = await spreadsheetApi.put('Bills', { id: bill.id, status: 'paid' })
      if (!res.success) throw new Error((res.error as any)?.message || 'Gagal menyimpan status lunas di Sheets.')

      setAlertDialog({
        isOpen: true,
        title: 'Pembayaran Berhasil',
        message: `Tagihan atas nama ${bill.resident_name} berhasil ditandai sebagai Lunas.`,
        variant: 'success',
        showCancel: false,
        confirmLabel: 'Selesai'
      })
    } catch (err: any) {
      console.error(err)
      setBills(originalBills)
      setAlertDialog({
        isOpen: true,
        title: 'Gagal Menandai Lunas',
        message: `Gagal menandai lunas: ${err.message || err}. Perubahan dibatalkan.`,
        variant: 'danger',
        showCancel: false,
        confirmLabel: 'Mengerti'
      })
    } finally {
      setIsSubmitting(false)
    }
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
    payments,
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
    buildDefaultDueDate,
    handleDebtCompensation,
    handleMarkAsPaid
  }
}
