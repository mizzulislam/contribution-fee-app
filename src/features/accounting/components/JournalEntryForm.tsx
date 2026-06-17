import { useState, useEffect } from 'react'
import { defaultEngine, syncAccountingWithSheet } from '@/features/accounting'
import type { Account, AccountType } from '@/features/accounting'
import { Save, AlertCircle, Plus, Trash2, CheckCircle2, AlertTriangle, Scale, Sparkles } from 'lucide-react'
import { spreadsheetApi } from '@/services/sheets-client'
import { mergeAccounts } from '@/features/accounting/data/chartOfAccounts'
import Select from '@/components/ui/Select'
import { syncBillsWithAccountingEntries } from '@/features/accounting/services/billingAccountingSync'
import { checkPeriodLock } from '@/features/accounting/calculations/period'

interface EntryLineForm {
  accountNumber: string
  amount: string
}

interface JournalEntryFormProps {
  onSuccess?: () => void
  editingEntry?: {
    id: string
    date: string
    description: string
    debits: { accountNumber: string; amount: number }[]
    credits: { accountNumber: string; amount: number }[]
    source?: string
    source_id?: string
  }
}

export default function JournalEntryForm({ onSuccess, editingEntry }: JournalEntryFormProps) {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [isSyncing, setIsSyncing] = useState(true)

  // Compound Entry State
  const [date, setDate] = useState(() => {
    return editingEntry ? editingEntry.date : new Date().toISOString().split('T')[0]
  })
  const [debits, setDebits] = useState<EntryLineForm[]>(() => {
    if (editingEntry) {
      return editingEntry.debits.map(d => ({ accountNumber: d.accountNumber, amount: String(d.amount) }))
    }
    return [{ accountNumber: '', amount: '' }]
  })
  const [credits, setCredits] = useState<EntryLineForm[]>(() => {
    if (editingEntry) {
      return editingEntry.credits.map(c => ({ accountNumber: c.accountNumber, amount: String(c.amount) }))
    }
    return [{ accountNumber: '', amount: '' }]
  })
  const [description, setDescription] = useState(() => {
    return editingEntry ? editingEntry.description : ''
  })
  const [error, setError] = useState('')
  const [isSuccessOpen, setIsSuccessOpen] = useState(false)

  async function refreshData() {
    setIsSyncing(true)
    try {
      const { data } = await spreadsheetApi.get('MasterData')
      const merged = mergeAccounts(data && Array.isArray(data) ? data : [])
      
      const typeMap: Record<string, AccountType> = {
        'Harta': 'Assets',
        'Kewajiban': 'Liabilities',
        'Modal': 'Equity',
        'Pendapatan': 'Revenues',
        'Beban': 'Expenses'
      }

      merged.forEach(acc => {
        if (acc.status === 'Aktif') {
          const mappedType = typeMap[acc.account_type] || 'Expenses'
          defaultEngine.coa.addAccount(acc.account_number, acc.account_name, mappedType)
          defaultEngine.ledger.ensureLedger(acc.account_number)
        }
      })
    } catch (err) {
      console.error("Gagal sinkronisasi data COA:", err)
    } finally {
      setIsSyncing(false)
      setAccounts(defaultEngine.coa.getAllAccounts())
    }
  }

  useEffect(() => {
    refreshData()
  }, [])

  // --- Dynamic Form Handlers ---
  const addDebitRow = () => setDebits([...debits, { accountNumber: '', amount: '' }])
  const removeDebitRow = (index: number) => setDebits(debits.filter((_, i) => i !== index))
  const updateDebit = (index: number, field: keyof EntryLineForm, value: string) => {
    const newDebits = [...debits]
    newDebits[index][field] = value
    setDebits(newDebits)
  }

  const addCreditRow = () => setCredits([...credits, { accountNumber: '', amount: '' }])
  const removeCreditRow = (index: number) => setCredits(credits.filter((_, i) => i !== index))
  const updateCredit = (index: number, field: keyof EntryLineForm, value: string) => {
    const newCredits = [...credits]
    newCredits[index][field] = value
    setCredits(newCredits)
  }

  const totalDebitAmount = debits.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0)
  const totalCreditAmount = credits.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0)
  const isBalanced = totalDebitAmount > 0 && Math.abs(totalDebitAmount - totalCreditAmount) < 0.001

  const parsedDebitsPreview = debits
    .filter(d => d.accountNumber && parseFloat(d.amount) > 0)
    .map(d => ({ accountNumber: d.accountNumber, amount: parseFloat(d.amount) }))

  const parsedCreditsPreview = credits
    .filter(c => c.accountNumber && parseFloat(c.amount) > 0)
    .map(c => ({ accountNumber: c.accountNumber, amount: parseFloat(c.amount) }))

  const getAccountByNumber = (accountNumber: string) => (
    accounts.find(account => account.accountNumber === accountNumber)
  )

  const monthEndDate = (() => {
    const currentDate = new Date(date)
    if (Number.isNaN(currentDate.getTime())) return false
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
    return currentDate.getDate() === lastDayOfMonth
  })()

  const detectAdjustingJournal = (() => {
    const normalizedDescription = description.toLowerCase()
    const lines = [...parsedDebitsPreview, ...parsedCreditsPreview]
    const relatedAccounts = lines
      .map(line => getAccountByNumber(line.accountNumber))
      .filter((account): account is Account => Boolean(account))

    const accountNames = relatedAccounts.map(account => account.accountName.toLowerCase())
    const accountTypes = relatedAccounts.map(account => account.accountType)
    const accountNumbers = relatedAccounts.map(account => account.accountNumber)

    const hasExpense = accountTypes.includes('Expenses')
    const hasRevenue = accountTypes.includes('Revenues')
    const hasAsset = accountTypes.includes('Assets')
    const hasLiability = accountTypes.includes('Liabilities')

    const keywordMatch = [
      'penyesuaian',
      'adjusting',
      'akrual',
      'accrual',
      'deferral',
      'deferal',
      'penyusutan',
      'depresiasi',
      'amortisasi',
      'beban dibayar dimuka',
      'dibayar dimuka',
      'uang muka',
      'pendapatan diterima dimuka',
      'sewa dibayar dimuka',
      'beban terutang',
      'pendapatan masih harus diterima'
    ].some(keyword => normalizedDescription.includes(keyword))

    const accountPatternMatch = accountNames.some(name => (
      name.includes('akumulasi penyusutan') ||
      name.includes('penyusutan') ||
      name.includes('amortisasi') ||
      name.includes('dibayar dimuka') ||
      name.includes('uang muka') ||
      name.includes('terutang') ||
      name.includes('diterima dimuka')
    ))

    const numberPatternMatch = accountNumbers.some(number => (
      number.startsWith('15') ||
      number === '2102' ||
      number === '4101' ||
      number === '5107'
    ))

    const typePatternMatch =
      (hasExpense && hasLiability) ||
      (hasExpense && hasAsset) ||
      (hasRevenue && hasLiability) ||
      (hasRevenue && hasAsset)

    const forcedAdjustingSource = ['manual_adjusting', 'depreciation', 'unearned_rent'].includes(editingEntry?.source || '')
    const isAdjusting = forcedAdjustingSource || keywordMatch || accountPatternMatch || numberPatternMatch || (typePatternMatch && monthEndDate)

    let reason = 'Belum memenuhi pola umum jurnal penyesuaian.'
    if (forcedAdjustingSource) {
      reason = 'Entri ini sudah berasal dari sumber jurnal penyesuaian.'
    } else if (keywordMatch) {
      reason = 'Keterangan transaksi memuat kata kunci jurnal penyesuaian.'
    } else if (accountPatternMatch || numberPatternMatch) {
      reason = 'Akun yang dipilih cocok dengan pola akun penyesuaian.'
    } else if (typePatternMatch && monthEndDate) {
      reason = 'Kombinasi tipe akun dan tanggal akhir periode cocok untuk penyesuaian.'
    }

    return { isAdjusting, reason }
  })()

  const detectClosingJournal = (() => {
    const normalizedDescription = description.toLowerCase()
    const lines = [...parsedDebitsPreview, ...parsedCreditsPreview]
    const relatedAccounts = lines
      .map(line => getAccountByNumber(line.accountNumber))
      .filter((account): account is Account => Boolean(account))

    const accountNames = relatedAccounts.map(account => account.accountName.toLowerCase())
    const accountTypes = relatedAccounts.map(account => account.accountType)
    const accountNumbers = relatedAccounts.map(account => account.accountNumber)

    const keywordMatch = [
      'jurnal penutup',
      'tutup buku',
      'closing',
      'ikhtisar laba rugi',
      'laba ditahan',
      'prive',
      'menutup akun',
      'penutupan buku'
    ].some(keyword => normalizedDescription.includes(keyword))

    const accountPatternMatch = accountNames.some(name => (
      name.includes('ikhtisar laba rugi') ||
      name.includes('laba ditahan') ||
      name.includes('prive')
    ))

    const numberPatternMatch = accountNumbers.some(number => (
      number === '3500' ||
      number === '3201' ||
      number === '3301'
    ))

    const hasRevenue = accountTypes.includes('Revenues')
    const hasExpense = accountTypes.includes('Expenses')
    const hasEquity = accountTypes.includes('Equity')
    const typePatternMatch = (hasRevenue && hasEquity) || (hasExpense && hasEquity)

    const currentDate = new Date(date)
    const endOfYearDate = !Number.isNaN(currentDate.getTime()) && currentDate.getMonth() === 11 && currentDate.getDate() === 31

    const forcedClosingSource = ['manual_closing'].includes(editingEntry?.source || '') || normalizedDescription.includes('jurnal penutup:')
    const isClosing = forcedClosingSource || keywordMatch || accountPatternMatch || numberPatternMatch || (typePatternMatch && endOfYearDate)

    let reason = 'Belum memenuhi pola umum jurnal penutup.'
    if (forcedClosingSource) {
      reason = 'Entri ini sudah berasal dari sumber jurnal penutup.'
    } else if (keywordMatch) {
      reason = 'Keterangan transaksi memuat kata kunci jurnal penutup.'
    } else if (accountPatternMatch || numberPatternMatch) {
      reason = 'Akun yang dipilih cocok dengan pola akun penutup.'
    } else if (typePatternMatch && endOfYearDate) {
      reason = 'Kombinasi akun nominal dan ekuitas pada akhir tahun cocok untuk penutupan buku.'
    }

    return { isClosing, reason }
  })()

  const journalClassification = (() => {
    if (detectClosingJournal.isClosing) {
      return {
        label: 'Terdeteksi sebagai jurnal penutup',
        reason: detectClosingJournal.reason,
        source: 'manual_closing',
        tone: 'red' as const,
      }
    }

    if (detectAdjustingJournal.isAdjusting) {
      return {
        label: 'Terdeteksi sebagai jurnal penyesuaian',
        reason: detectAdjustingJournal.reason,
        source: 'manual_adjusting',
        tone: 'emerald' as const,
      }
    }

    return {
      label: 'Terdeteksi sebagai jurnal umum',
      reason: 'Transaksi ini belum memenuhi pola jurnal penyesuaian atau jurnal penutup.',
      source: 'manual_journal',
      tone: 'slate' as const,
    }
  })()

  const handleRecord = async () => {
    setError('')
    try {
      const isLocked = await checkPeriodLock(date)
      if (isLocked) {
        throw new Error('Gagal merekam transaksi: Periode akuntansi pada tanggal tersebut sudah ditutup (Locked).')
      }

      if (!description.trim()) {
        throw new Error('Keterangan transaksi wajib diisi.')
      }

      const parsedDebits = parsedDebitsPreview
      const parsedCredits = parsedCreditsPreview

      if (parsedDebits.length === 0 || parsedCredits.length === 0) {
        throw new Error('Minimal harus ada satu akun Debit dan satu akun Kredit yang terisi dengan nominal valid.')
      }

      const sumD = parsedDebits.reduce((sum, d) => sum + d.amount, 0)
      const sumC = parsedCredits.reduce((sum, c) => sum + c.amount, 0)
      if (Math.abs(sumD - sumC) >= 0.001) {
        throw new Error(`Total Debit tidak sama dengan Total Kredit. Neraca harus seimbang!`)
      }

      setIsSyncing(true)

      let entryData: any = {
        id: editingEntry ? editingEntry.id : `JE-${Date.now().toString().slice(-5)}`,
        date: date,
        description: description,
        debits: JSON.stringify(parsedDebits),
        credits: JSON.stringify(parsedCredits),
        source: editingEntry?.source || journalClassification.source,
        source_id: editingEntry?.source_id,
      }

      if (editingEntry) {
        // Fetch existing entry from sheet to merge other fields
        const { data: sheetsData } = await spreadsheetApi.get('JournalEntries')
        if (Array.isArray(sheetsData)) {
          const original = sheetsData.find(e => String(e.id) === String(editingEntry.id))
          if (original) {
            entryData = {
              ...original,
              ...entryData,
              updated_at: new Date().toISOString()
            }
          }
        }
        await spreadsheetApi.put('JournalEntries', entryData)
      } else {
        entryData.created_at = new Date().toISOString()
        await spreadsheetApi.post('JournalEntries', entryData)
      }

      const [billsRes, usersRes] = await Promise.all([
        spreadsheetApi.get('Bills'),
        spreadsheetApi.get('Users'),
      ])

      if (Array.isArray(billsRes.data)) {
        await syncBillsWithAccountingEntries({
          bills: billsRes.data,
          journalEntries: [entryData],
          users: Array.isArray(usersRes.data) ? usersRes.data : [],
          persist: true,
        })
      }

      // Re-synchronize local defaultEngine singleton so it is 100% updated with the spreadsheet
      await syncAccountingWithSheet()

      setIsSuccessOpen(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal merekam transaksi')
    } finally {
      setIsSyncing(false)
    }
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'decimal', maximumFractionDigits: 0 }).format(val)
  }

  const accountOptions = accounts.map(acc => ({
    label: `${acc.accountNumber} - ${acc.accountName}`,
    value: acc.accountNumber
  }))

  if (isSuccessOpen) {
    return (
      <div className="bg-white p-8 sm:p-10 md:p-12 w-full flex flex-col items-center justify-center text-center animate-in fade-in duration-300 min-h-[450px]">
        <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm animate-bounce">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Transaksi Berhasil Direkam!</h3>
        <p className="text-gray-500 max-w-md mb-6 leading-relaxed text-sm">
          Entri jurnal untuk transaksi <span className="font-semibold text-gray-800">"{description || 'Tanpa Deskripsi'}"</span> pada tanggal <span className="font-semibold text-gray-800">{new Date(date).toLocaleDateString('id-ID')}</span> telah dicatat secara aman ke sistem akuntansi.
        </p>
        <div className="w-full max-w-md bg-gray-50 border border-gray-100 rounded-2xl p-5 mb-8 text-left space-y-3 shadow-sm">
          <div className="flex justify-between items-center text-sm border-b border-gray-200/60 pb-2.5">
            <span className="text-gray-500 font-medium">Nominal Transaksi</span>
            <span className="font-bold text-emerald-600 text-base">Rp {formatCurrency(totalDebitAmount)}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500 font-medium">Klasifikasi Jurnal</span>
            <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
              journalClassification.tone === 'red'
                ? 'bg-red-50 text-red-700 border-red-100'
                : journalClassification.tone === 'emerald'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                  : 'bg-slate-50 text-slate-700 border-slate-200'
            }`}>
              {journalClassification.label.replace('Terdeteksi sebagai ', '')}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setIsSuccessOpen(false)
            setDebits([{ accountNumber: '', amount: '' }])
            setCredits([{ accountNumber: '', amount: '' }])
            setDescription('')
            if (onSuccess) onSuccess()
          }}
          className="btn-primary w-full max-w-md py-3 font-semibold text-base shadow-lg shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-700 hover:border-emerald-700 focus:outline-none"
        >
          Selesai
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white p-6 sm:p-8 md:p-10 w-full">
      <div className="flex justify-between items-center border-b pb-5 mb-6 border-gray-100 pr-12">
        <h3 className="font-bold text-gray-900 text-xl tracking-tight">{editingEntry ? 'Edit Jurnal Umum' : 'Input Jurnal Cepat (Compound Entry)'}</h3>
      </div>
      
      {error && (
        <div className="p-3 mb-5 bg-red-50 text-red-700 text-sm rounded-lg flex items-start border border-red-100">
          <AlertCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal Transaksi</label>
            <input type="date" className="form-input w-full" value={date} onChange={(e) => setDate(e.target.value)} disabled={isSyncing} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Keterangan Transaksi</label>
            <input type="text" className="form-input w-full" placeholder="Contoh: Pembayaran asuransi bangunan..." value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </div>

        <div className={`rounded-2xl border px-4 py-3 flex items-start gap-3 ${
          journalClassification.tone === 'red'
            ? 'bg-red-50 border-red-200 text-red-900'
            : journalClassification.tone === 'emerald'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-slate-50 border-slate-200 text-slate-700'
        }`}>
          <div className={`mt-0.5 p-2 rounded-xl ${
            journalClassification.tone === 'red'
              ? 'bg-red-100 text-red-700'
              : journalClassification.tone === 'emerald'
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-slate-100 text-slate-500'
          }`}>
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-semibold">
              {journalClassification.label}
            </div>
            <p className="text-xs mt-1 leading-relaxed">
              {journalClassification.reason}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Debit Section */}
          <div className="bg-emerald-50/40 p-5 rounded-xl border border-emerald-100/50 space-y-4">
            <div className="flex justify-between items-center mb-1">
              <label className="text-sm font-bold text-emerald-900">DEBIT</label>
              <button onClick={addDebitRow} className="text-xs flex items-center text-emerald-600 hover:text-emerald-800 font-medium bg-emerald-100/50 hover:bg-emerald-200/50 transition-colors px-2.5 py-1.5 rounded-lg">
                <Plus className="w-3.5 h-3.5 mr-1" /> Tambah Akun
              </button>
            </div>
            {debits.map((debit, idx) => (
              <div key={`d-${idx}`} className="flex gap-3 items-start">
                <div className="flex-1 space-y-3">
                  <Select 
                    className="w-full"
                    placeholder="-- Pilih Akun Debit --"
                    options={accountOptions}
                    value={debit.accountNumber}
                    onChange={(val) => updateDebit(idx, 'accountNumber', val)}
                  />
                  <input type="number" className="form-input w-full" placeholder="Nominal Rp" value={debit.amount} onChange={(e) => updateDebit(idx, 'amount', e.target.value)} />
                </div>
                {debits.length > 1 && (
                  <button onClick={() => removeDebitRow(idx)} className="mt-1 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100">
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Credit Section */}
          <div className="bg-orange-50/40 p-5 rounded-xl border border-orange-100/50 space-y-4">
            <div className="flex justify-between items-center mb-1">
              <label className="text-sm font-bold text-orange-900">KREDIT</label>
              <button onClick={addCreditRow} className="text-xs flex items-center text-orange-600 hover:text-orange-800 font-medium bg-orange-100/50 hover:bg-orange-200/50 transition-colors px-2.5 py-1.5 rounded-lg">
                <Plus className="w-3.5 h-3.5 mr-1" /> Tambah Akun
              </button>
            </div>
            {credits.map((credit, idx) => (
              <div key={`c-${idx}`} className="flex gap-3 items-start">
                <div className="flex-1 space-y-3">
                  <Select 
                    className="w-full"
                    placeholder="-- Pilih Akun Kredit --"
                    options={accountOptions}
                    value={credit.accountNumber}
                    onChange={(val) => updateCredit(idx, 'accountNumber', val)}
                  />
                  <input type="number" className="form-input w-full" placeholder="Nominal Rp" value={credit.amount} onChange={(e) => updateCredit(idx, 'amount', e.target.value)} />
                </div>
                {credits.length > 1 && (
                  <button onClick={() => removeCreditRow(idx)} className="mt-1 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100">
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="pt-2 flex flex-col md:flex-row md:items-center justify-between gap-4 border-t border-gray-100 mt-6 pt-6">
          {/* Modern Balance Indicator */}
          <div className={`flex-1 relative overflow-hidden rounded-xl p-3 md:px-4 flex flex-col sm:flex-row sm:items-center justify-between border shadow-sm md:max-w-md transition-all duration-300 ${isBalanced ? 'bg-gradient-to-r from-emerald-600 to-[#10B981] border-emerald-600 shadow-emerald-500/30' : 'bg-white border-orange-200 ring-1 ring-orange-100'}`}>
            {/* Background Graphic Element for Balanced State */}
            {isBalanced && (
              <Scale className="absolute right-0 top-1/2 -translate-y-1/2 w-28 h-28 text-emerald-400/20 -rotate-12 translate-x-4 pointer-events-none" />
            )}
            
            <div className="relative z-10 flex items-center gap-3 mb-2 sm:mb-0">
              <div className={`p-1.5 rounded-full ${isBalanced ? 'bg-emerald-500/50 text-white' : 'bg-orange-50 text-orange-400'}`}>
                <Scale className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-3 text-sm font-bold">
                <span className={isBalanced ? 'text-white' : 'text-emerald-600'}>
                  D: Rp {formatCurrency(totalDebitAmount)}
                </span>
                {/* Separator Line */}
                <div className={`w-px h-3.5 ${isBalanced ? 'bg-emerald-400/60' : 'bg-gray-300'}`}></div>
                <span className={isBalanced ? 'text-white' : 'text-orange-600'}>
                  K: Rp {formatCurrency(totalCreditAmount)}
                </span>
              </div>
            </div>

            <div className={`relative z-10 self-start sm:self-auto px-3 py-1 rounded-full font-bold text-xs flex items-center gap-1.5 shadow-sm backdrop-blur-sm ${isBalanced ? 'bg-white/20 text-white border border-white/30' : 'bg-orange-100 text-orange-700 border border-orange-200'}`}>
              {isBalanced ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
              {isBalanced ? 'SEIMBANG' : 'SELISIH'}
            </div>
          </div>

          <button onClick={handleRecord} disabled={!isBalanced || isSyncing} className="btn-primary flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed py-3 px-8 text-base shadow-lg shadow-primary/20">
            <Save className="w-5 h-5 mr-2" /> Rekam Transaksi
          </button>
        </div>
      </div>
    </div>
  )
}
