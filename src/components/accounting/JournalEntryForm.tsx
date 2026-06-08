import { useState, useEffect } from 'react'
import { defaultEngine } from '@/lib/accounting'
import type { Account, AccountType } from '@/lib/accounting'
import { Save, AlertCircle, Plus, Trash2, CheckCircle2, AlertTriangle, Scale } from 'lucide-react'
import { spreadsheetApi } from '@/lib/spreadsheet'
import { mergeAccounts } from '@/lib/chartOfAccounts'
import Select from '@/components/ui/Select'

interface EntryLineForm {
  accountNumber: string
  amount: string
}

export default function JournalEntryForm({ onSuccess }: { onSuccess?: () => void }) {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [isSyncing, setIsSyncing] = useState(true)

  // Compound Entry State
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [debits, setDebits] = useState<EntryLineForm[]>([{ accountNumber: '', amount: '' }])
  const [credits, setCredits] = useState<EntryLineForm[]>([{ accountNumber: '', amount: '' }])
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    refreshData()
  }, [])

  const refreshData = async () => {
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

  const handleRecord = () => {
    setError('')
    try {
      if (!description.trim()) {
        throw new Error('Keterangan transaksi wajib diisi.')
      }

      const parsedDebits = debits
        .filter(d => d.accountNumber && parseFloat(d.amount) > 0)
        .map(d => ({ accountNumber: d.accountNumber, amount: parseFloat(d.amount) }))
      
      const parsedCredits = credits
        .filter(c => c.accountNumber && parseFloat(c.amount) > 0)
        .map(c => ({ accountNumber: c.accountNumber, amount: parseFloat(c.amount) }))

      if (parsedDebits.length === 0 || parsedCredits.length === 0) {
        throw new Error('Minimal harus ada satu akun Debit dan satu akun Kredit yang terisi dengan nominal valid.')
      }

      const sumD = parsedDebits.reduce((sum, d) => sum + d.amount, 0)
      const sumC = parsedCredits.reduce((sum, c) => sum + c.amount, 0)
      if (Math.abs(sumD - sumC) >= 0.001) {
        throw new Error(`Total Debit tidak sama dengan Total Kredit. Neraca harus seimbang!`)
      }

      // Record transaction locally
      defaultEngine.recordTransaction(date, parsedDebits, parsedCredits, description)
      const newEntryId = defaultEngine.journal.getEntries()[defaultEngine.journal.getEntries().length - 1].id

      // Post to Google Sheets
      const entryData = {
        id: newEntryId,
        date: date,
        description: description,
        debits: JSON.stringify(parsedDebits),
        credits: JSON.stringify(parsedCredits),
        created_at: new Date().toISOString()
      }
      
      // Don't await directly to avoid blocking UI too long, or await and show loading.
      // Since there's no loading state for submit, we will just await it.
      setIsSyncing(true)
      spreadsheetApi.post('JournalEntries', entryData).finally(() => {
        setIsSyncing(false)
        // Reset form
        setDebits([{ accountNumber: '', amount: '' }])
        setCredits([{ accountNumber: '', amount: '' }])
        setDescription('')
        
        if (onSuccess) {
          onSuccess()
        }
      })
    } catch (err: any) {
      setIsSyncing(false)
      setError(err.message)
    }
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'decimal', maximumFractionDigits: 0 }).format(val)
  }

  const accountOptions = accounts.map(acc => ({
    label: `${acc.accountNumber} - ${acc.accountName}`,
    value: acc.accountNumber
  }))

  return (
    <div className="bg-white p-6 sm:p-8 md:p-10 w-full">
      <div className="flex justify-between items-center border-b pb-5 mb-6 border-gray-100 pr-12">
        <h3 className="font-bold text-gray-900 text-xl tracking-tight">Input Jurnal Cepat (Compound Entry)</h3>
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
