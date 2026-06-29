import { useState, useEffect, useMemo } from 'react'
import { spreadsheetApi } from '@/services/sheets-client'
import { defaultEngine, syncAccountingWithSheet, generateAdjustingEntries } from '@/features/accounting'
import { filterJournalEntriesByPeriod, getPeriodLabel, type PeriodFilter } from '@/features/accounting/calculations/period'
import JournalEntryModal from '@/features/accounting/components/JournalEntryModal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { Loader2, ArrowUpDown, Edit, Pencil, SlidersHorizontal, Sparkles, Coins, Info, ShieldAlert, Sparkle, Settings } from 'lucide-react'
import AccountingDownloadMenu from '@/features/accounting/components/AccountingDownloadMenu'

interface AdjustingEntriesViewProps {
  period: PeriodFilter
}

const DEFAULT_ASSETS = [
  {
    id: 'AST-AC-101',
    name: 'AC Kamar 101',
    cost: 4500000,
    salvageValue: 500000,
    usefulLifeMonths: 60, // 5 tahun
    purchaseDate: '2026-01-01',
    accountNumber: '1501'
  },
  {
    id: 'AST-AC-102',
    name: 'AC Kamar 102',
    cost: 4500000,
    salvageValue: 500000,
    usefulLifeMonths: 60,
    purchaseDate: '2026-01-01',
    accountNumber: '1501'
  },
  {
    id: 'AST-BED-KOS',
    name: 'Kasur & Ranjang Kost (10 Set)',
    cost: 20000000,
    salvageValue: 2000000,
    usefulLifeMonths: 36, // 3 tahun
    purchaseDate: '2026-01-01',
    accountNumber: '1501'
  },
  {
    id: 'AST-TV-LOBBY',
    name: 'Smart TV Lobby Utama',
    cost: 6000000,
    salvageValue: 600000,
    usefulLifeMonths: 48, // 4 tahun
    purchaseDate: '2026-02-15',
    accountNumber: '1501'
  },
  {
    id: 'AST-WIFI-SYS',
    name: 'Router & Infrastruktur WiFi',
    cost: 3600000,
    salvageValue: 0,
    usefulLifeMonths: 24, // 2 tahun
    purchaseDate: '2026-03-01',
    accountNumber: '1501'
  }
]

const parseJournalLines = (lines: unknown) => {
  if (!lines) return []

  if (Array.isArray(lines)) {
    return lines.map((line: any) => ({
      accountNumber: String(line.accountNumber || line.account_number || ''),
      amount: Number(line.amount) || 0
    })).filter(line => line.accountNumber && line.amount > 0)
  }

  if (typeof lines === 'string') {
    try {
      const parsed = JSON.parse(lines)
      return parseJournalLines(parsed)
    } catch {
      return []
    }
  }

  return []
}

const normalizeJournalEntry = (entry: any) => ({
  ...entry,
  id: String(entry.id || ''),
  date: entry.date || '',
  description: entry.description || '',
  debits: parseJournalLines(entry.debits),
  credits: parseJournalLines(entry.credits)
})

const isAdjustingEntry = (entry: any) => {
  const id = String(entry.id || '').toLowerCase()
  const description = String(entry.description || '').toLowerCase()
  const source = String(entry.source || entry.type || '').toLowerCase()

  return id.startsWith('adj') || source.includes('adjust') || source.includes('penyesuaian') || description.includes('adjusting') || description.includes('penyesuaian')
}

export default function AdjustingEntriesView({ period }: AdjustingEntriesViewProps) {
  const [journalEntries, setJournalEntries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<any | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
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

  async function loadData() {
    setLoading(true)
    try {
      const journalRes = await spreadsheetApi.get('JournalEntries')
      setJournalEntries(Array.isArray(journalRes.data) ? journalRes.data.map(normalizeJournalEntry) : [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const actualEntries = useMemo(() => {
    return filterJournalEntriesByPeriod(journalEntries, period).filter(isAdjustingEntry)
  }, [journalEntries, period])

  const sortedEntries = useMemo(() => {
    return [...actualEntries].sort((a, b) => {
      const dateA = new Date(a.date).getTime()
      const dateB = new Date(b.date).getTime()
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA
    })
  }, [actualEntries, sortOrder])

  const periodLabel = getPeriodLabel(period)
  const periodSlug = periodLabel.toLowerCase().replace(/[^a-z0-9]+/gi, '-').replace(/(^-|-$)/g, '') || 'semua-periode'

  const handleGenerateAdjusting = () => {
    if (period.preset === 'all') {
      setAlertDialog({
        isOpen: true,
        title: 'Periode Tidak Valid',
        message: 'Pilih periode waktu yang spesifik (bukan Semua Periode) pada filter di atas untuk menjalankan Jurnal Penyesuaian otomatis.',
        variant: 'info',
        showCancel: false,
        confirmLabel: 'Mengerti'
      })
      return
    }
    if (actualEntries.length > 0) {
      setAlertDialog({
        isOpen: true,
        title: 'Jurnal Penyesuaian Sudah Ada',
        message: 'Jurnal penyesuaian untuk periode terpilih sudah terbentuk. Jika ingin membuat ulang, hapus entri penyesuaian yang ada terlebih dahulu.',
        variant: 'info',
        showCancel: false,
        confirmLabel: 'Mengerti'
      })
      return
    }

    setAlertDialog({
      isOpen: true,
      title: 'Jalankan Jurnal Penyesuaian',
      message: `Apakah Anda yakin ingin menjalankan Jurnal Penyesuaian otomatis untuk periode ${periodLabel}? Sistem akan membuat penyesuaian sewa kamar (deferrals) dan penyusutan aset tetap (accruals/depreciation) secara otomatis sesuai standar IFRS & PSAK.`,
      variant: 'info',
      showCancel: true,
      confirmLabel: 'Ya, Jalankan',
      onConfirm: () => {
        setAlertDialog(prev => ({ ...prev, isOpen: false }))
        executeAdjusting()
      }
    })
  }

  const executeAdjusting = async () => {
    setIsGenerating(true)
    const adjustingDate = period.endDate || new Date().toISOString().split('T')[0]

    // Saga rollback helper
    const postedAdjustingEntries: string[] = []
    let errorMsg = ''

    try {
      // 1. Fetch Payments dari API
      const { data: paymentsData, error: paymentsError } = await spreadsheetApi.get('Payments')
      if (paymentsError) throw paymentsError

      // 2. Generate penyesuaian otomatis
      const generated = generateAdjustingEntries(paymentsData || [], DEFAULT_ASSETS, adjustingDate)
      
      if (generated.length === 0) {
        throw new Error('Tidak ada akun sewa diterima dimuka atau aset tetap yang membutuhkan penyesuaian pada periode ini.')
      }

      // 3. Post ke database spreadsheet secara berurutan
      for (const entry of generated) {
        const payload = {
          id: entry.id,
          date: entry.date,
          description: entry.description,
          debits: JSON.stringify(entry.debits),
          credits: JSON.stringify(entry.credits),
          source: 'adjusting_entry',
          source_id: entry.source_id || '',
          created_at: new Date().toISOString()
        }
        
        const res = await spreadsheetApi.post('JournalEntries', payload)
        if (!res.success) {
          throw new Error((res.error as any)?.message || `Gagal memposting jurnal penyesuaian ${entry.id}`)
        }
        postedAdjustingEntries.push(entry.id)
      }

      // Sinkronisasi engine dan reload data
      await syncAccountingWithSheet()
      await loadData()

      setAlertDialog({
        isOpen: true,
        title: 'Penyesuaian Sukses',
        message: `Berhasil membuat dan memposting ${generated.length} entri jurnal penyesuaian untuk periode ${periodLabel}.`,
        variant: 'success',
        showCancel: false,
        confirmLabel: 'Selesai'
      })
    } catch (err: any) {
      console.error('Eksekusi penyesuaian gagal:', err)
      errorMsg = err.message || String(err)

      // Rollback jika terjadi kegagalan di tengah jalan
      for (const entryId of postedAdjustingEntries) {
        await spreadsheetApi.del('JournalEntries', entryId)
      }

      setAlertDialog({
        isOpen: true,
        title: 'Proses Penyesuaian Gagal',
        message: `Gagal memproses jurnal penyesuaian: ${errorMsg}. Seluruh perubahan baru telah dibatalkan (rolled back).`,
        variant: 'danger',
        showCancel: false,
        confirmLabel: 'Mengerti'
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const adjustingExportRows = useMemo(() => {
    const formatAmount = (val: number) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(val)
    const exportRows = sortedEntries.flatMap(entry => [
      ...entry.debits.map((debit: any) => ({
        id: formatJournalId(entry.id),
        date: formatDate(entry.date),
        description: entry.description,
        accountName: getAccountName(debit.accountNumber),
        ref: debit.accountNumber,
        debit: debit.amount,
        credit: '',
      })),
      ...entry.credits.map((credit: any) => ({
        id: formatJournalId(entry.id),
        date: formatDate(entry.date),
        description: entry.description,
        accountName: `    ${getAccountName(credit.accountNumber)}`,
        ref: credit.accountNumber,
        debit: '',
        credit: credit.amount,
      })),
    ])

    return exportRows.map(row => [
      row.id,
      row.date,
      row.description,
      row.accountName,
      row.ref,
      typeof row.debit === 'number' ? `Rp ${formatAmount(row.debit)}` : '',
      typeof row.credit === 'number' ? `Rp ${formatAmount(row.credit)}` : '',
    ])
  }, [sortedEntries])

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return

    setIsDeleting(true)
    try {
      const count = selectedIds.length
      const results = await Promise.all(selectedIds.map(id => spreadsheetApi.del('JournalEntries', id)))
      if (results.some(result => !result.success)) {
        console.error('Sebagian jurnal penyesuaian gagal dihapus dari spreadsheet.')
      }

      setJournalEntries(prev => prev.filter(entry => !selectedIds.includes(String(entry.id))))
      setSelectedIds([])
      setIsEditMode(false)
      setIsDeleteDialogOpen(false)

      await syncAccountingWithSheet()

      setAlertDialog({
        isOpen: true,
        title: 'Penghapusan Berhasil',
        message: `${count} entri jurnal penyesuaian berhasil dihapus secara permanen dari database.`,
        variant: 'success',
        showCancel: false,
        confirmLabel: 'Selesai'
      })
    } catch (err) {
      console.error(err)
    } finally {
      setIsDeleting(false)
    }
  }

  const formatCurrencyParts = (val: number) => {
    const formatted = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(val)
    return { symbol: 'Rp', amount: formatted }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    if (Number.isNaN(date.getTime())) return dateString || '-'
    const day = date.getDate().toString().padStart(2, '0')
    let month = ''
    try {
      month = date.toLocaleString('id-ID', { month: 'short' })
    } catch {
      month = String(date.getMonth() + 1).padStart(2, '0')
    }
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }

  const formatJournalId = (id: string) => (
    id.split('-').length > 2 ? `ADJ-${id.split('-')[2].slice(-4)}` : id
  )

  const getAccountName = (num: string) => {
    const acc = defaultEngine.coa.getAccount(num)
    return acc ? acc.accountName : '-'
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-emerald-700">
        <Loader2 className="w-10 h-10 animate-spin mb-4" />
        <p className="font-medium">Memuat Jurnal Penyesuaian...</p>
      </div>
    )
  }

  const adjustingPrintContent = (
    <div className="space-y-6">
      <div className="print-brand text-[11px] font-bold text-emerald-600 tracking-wider">SOEMATRA KOST</div>
      <h1 className="text-2xl font-bold text-gray-900 mt-1">Jurnal Penyesuaian</h1>
      <div className="text-[11px] text-gray-600 border-b-2 border-emerald-500 pb-2 mb-4">
        Periode: {periodLabel} | Dicetak: {new Date().toLocaleString('id-ID')}
      </div>
      
      <table className="w-full table-fixed text-left text-[11.5px] border border-gray-200 border-collapse">
        <colgroup>
          <col className="w-[12%]" />
          <col className="w-[13%]" />
          <col className="w-[41%]" />
          <col className="w-[10%]" />
          <col className="w-[12%]" />
          <col className="w-[12%]" />
        </colgroup>
        <thead className="bg-[#F8FAFC] border-b border-gray-300 text-gray-700">
          <tr>
            <th className="px-3 py-2 border-r border-gray-200 font-bold text-center">ID Jurnal</th>
            <th className="px-3 py-2 border-r border-gray-200 font-bold text-center">Tanggal</th>
            <th className="px-3 py-2 border-r border-gray-200 font-bold text-center">Deskripsi</th>
            <th className="px-3 py-2 border-r border-gray-200 font-bold text-center">Ref</th>
            <th className="px-3 py-2 border-r border-gray-200 font-bold text-center">Debit</th>
            <th className="px-3 py-2 font-bold text-center">Kredit</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 text-gray-700 bg-white">
          {sortedEntries.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                Belum ada jurnal penyesuaian pada periode ini.
              </td>
            </tr>
          ) : (
            sortedEntries.map((entry) => (
              <tr key={entry.id} className="align-top border-b border-gray-200">
                <td className="px-3 py-2 border-r border-gray-200 text-center font-mono">
                  {formatJournalId(entry.id)}
                </td>
                <td className="px-3 py-2 border-r border-gray-200 text-center whitespace-nowrap">
                  {formatDate(entry.date)}
                </td>
                <td className="px-3 py-2 border-r border-gray-200">
                  <div className="space-y-1.5 text-[11px] leading-relaxed">
                    {/* Debits */}
                    {entry.debits.map((d: any, i: number) => (
                      <div key={`d-${i}`} className="text-gray-900 font-semibold">{getAccountName(d.accountNumber)}</div>
                    ))}
                    {/* Credits (Indented) */}
                    {entry.credits.map((c: any, i: number) => (
                      <div key={`c-${i}`} className="text-gray-900 pl-4">{getAccountName(c.accountNumber)}</div>
                    ))}
                  </div>
                  {/* Keterangan di baris paling bawah ayat jurnal */}
                  <div className="mt-1 text-[10px] leading-normal text-[#047857] italic font-semibold">
                    ({entry.description})
                  </div>
                </td>
                <td className="px-3 py-2 border-r border-gray-200 text-center text-gray-500">
                  <div className="space-y-1.5">
                    {entry.debits.map((d: any, i: number) => (
                      <div key={`dref-${i}`}>{d.accountNumber}</div>
                    ))}
                    {entry.credits.map((c: any, i: number) => (
                      <div key={`cref-${i}`}>{c.accountNumber}</div>
                    ))}
                  </div>
                </td>
                <td className="px-3 py-2 border-r border-gray-200">
                  <div className="space-y-1.5 text-right">
                    {entry.debits.map((d: any, i: number) => {
                      const { symbol, amount } = formatCurrencyParts(d.amount)
                      return (
                        <div key={`da-${i}`} className="text-gray-900 font-semibold flex justify-between w-full">
                          <span className="text-gray-400 font-normal">{symbol}</span>
                          <span>{amount}</span>
                        </div>
                      )
                    })}
                    {entry.credits.map((c: any, i: number) => (
                      <div key={`ca-${i}`} className="text-transparent select-none flex justify-between w-full">
                        <span>Rp</span><span>0</span>
                      </div>
                    ))}
                  </div>
                </td>
                <td className="px-3 py-2">
                  <div className="space-y-1.5 text-right">
                    {entry.debits.map((d: any, i: number) => (
                      <div key={`ds-${i}`} className="text-transparent select-none flex justify-between w-full">
                        <span>Rp</span><span>0</span>
                      </div>
                    ))}
                    {entry.credits.map((c: any, i: number) => {
                      const { symbol, amount } = formatCurrencyParts(c.amount)
                      return (
                        <div key={`ca-${i}`} className="text-gray-900 font-semibold flex justify-between w-full">
                          <span className="text-gray-400 font-normal">{symbol}</span>
                          <span>{amount}</span>
                        </div>
                      )
                    })}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight leading-tight flex items-center">
            <SlidersHorizontal className="mr-2 sm:mr-3 text-primary w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0" />
            Jurnal Penyesuaian (Adjusting Entries)
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            Mencatat pendapatan akrual/tangguhan dan penyusutan peralatan di akhir periode akuntansi.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <AccountingDownloadMenu
            fileName={`jurnal-penyesuaian-${periodSlug}`}
            title="Jurnal Penyesuaian"
            meta={`Periode: ${periodLabel} | Dicetak: ${new Date().toLocaleString('id-ID')}`}
            headers={['ID Jurnal', 'Tanggal', 'Deskripsi', 'Akun', 'Ref', 'Debit', 'Kredit']}
            rows={adjustingExportRows}
            amountColumnIndexes={[5, 6]}
            colWidths={['10%', '12%', '20%', '22%', '8%', '14%', '14%']}
            printContent={adjustingPrintContent}
          />
        </div>
      </div>

      {/* IFRS / PSAK Assumptions Panel */}
      <div className="bg-white border border-gray-150 rounded-[20px] p-6 shadow-sm">
        <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-emerald-600" />
          Penerapan Asumsi Akuntansi (IFRS & PSAK)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="border border-gray-100 rounded-xl p-4 bg-gray-50/50">
            <div className="font-semibold text-gray-900 text-sm flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Periodisitas (Periodicity)
            </div>
            <p className="text-[11.5px] text-gray-600 mt-2 leading-relaxed">
              Membagi aktivitas ekonomi entitas ke dalam periode waktu bulanan/tahunan untuk penyajian laporan yang tepat waktu dan relevan.
            </p>
          </div>
          <div className="border border-gray-100 rounded-xl p-4 bg-gray-50/50">
            <div className="font-semibold text-gray-900 text-sm flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Penangguhan (Deferral)
            </div>
            <p className="text-[11.5px] text-gray-600 mt-2 leading-relaxed">
              Pendapatan sewa dibayar dimuka dari penghuni dicatat sebagai kewajiban (<strong>Uang Muka Sewa - Akun 2102</strong>), dan direalisasikan bertahap menjadi <strong>Pendapatan - Akun 4101</strong> pada bulan manfaat.
            </p>
          </div>
          <div className="border border-gray-100 rounded-xl p-4 bg-gray-50/50">
            <div className="font-semibold text-gray-900 text-sm flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Asas Akrual (Accrual Basis)
            </div>
            <p className="text-[11.5px] text-gray-600 mt-2 leading-relaxed">
              Mencatat pengaruh transaksi pada periode terjadinya, bukan sekadar saat kas diterima atau dikeluarkan, guna mencerminkan posisi keuangan yang andal.
            </p>
          </div>
          <div className="border border-gray-100 rounded-xl p-4 bg-gray-50/50">
            <div className="font-semibold text-gray-900 text-sm flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Depresiasi (Depreciation)
            </div>
            <p className="text-[11.5px] text-gray-600 mt-2 leading-relaxed">
              Mengalokasikan harga perolehan aset tetap (<strong>Peralatan Kos - Akun 1501</strong>) secara berkala ke <strong>Beban Penyusutan - Akun 5107</strong> berpasangan dengan <strong>Akumulasi Penyusutan - Akun 1502</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Fixed Assets Registry Panel */}
      <div className="bg-white border border-gray-150 rounded-[20px] p-6 shadow-sm">
        <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2 mb-3">
          <Settings className="w-5 h-5 text-emerald-600" />
          Registrasi Aset Tetap Terdaftar (Peralatan Kos - Akun 1501)
        </h3>
        <p className="text-xs text-text-secondary mb-4">
          Aset tetap operasional kos yang disusutkan secara otomatis menggunakan metode Garis Lurus (Straight-line Method).
        </p>
        <div className="overflow-x-auto border border-gray-100 rounded-xl">
          <table className="min-w-full text-left text-xs text-gray-700 bg-white">
            <thead className="bg-[#F8FAFC] border-b border-gray-200 text-gray-600">
              <tr>
                <th className="px-4 py-3 font-semibold">ID Aset</th>
                <th className="px-4 py-3 font-semibold">Nama Aset</th>
                <th className="px-4 py-3 font-semibold text-center">Tgl Perolehan</th>
                <th className="px-4 py-3 font-semibold text-right">Harga Perolehan</th>
                <th className="px-4 py-3 font-semibold text-right">Estimasi Nilai Residu</th>
                <th className="px-4 py-3 font-semibold text-center">Umur Ekonomis</th>
                <th className="px-4 py-3 font-semibold text-right">Penyusutan/Bulan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {DEFAULT_ASSETS.map((asset) => {
                const depr = Math.round((asset.cost - asset.salvageValue) / asset.usefulLifeMonths)
                return (
                  <tr key={asset.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-mono text-gray-500">{asset.id}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{asset.name}</td>
                    <td className="px-4 py-3 text-center">{formatDate(asset.purchaseDate)}</td>
                    <td className="px-4 py-3 text-right">Rp {new Intl.NumberFormat('id-ID').format(asset.cost)}</td>
                    <td className="px-4 py-3 text-right">Rp {new Intl.NumberFormat('id-ID').format(asset.salvageValue)}</td>
                    <td className="px-4 py-3 text-center">{asset.usefulLifeMonths} bulan ({asset.usefulLifeMonths / 12} Th)</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">Rp {new Intl.NumberFormat('id-ID').format(depr)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Execution Warning/Alert banner */}
      {period.preset === 'all' ? (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <div className="text-sm font-semibold">Penyesuaian Otomatis Dinonaktifkan</div>
            <p className="text-xs mt-1 leading-relaxed">
              Silakan pilih periode waktu tertentu (misalnya Bulan Ini atau filter tanggal custom) pada menu filter periode di atas untuk menjalankan posting Jurnal Penyesuaian otomatis.
            </p>
          </div>
        </div>
      ) : (
        <div className={`p-4 rounded-2xl border flex items-start gap-3 ${actualEntries.length > 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-blue-50 border-blue-200 text-blue-900'}`}>
          {actualEntries.length > 0 ? (
            <>
              <Sparkle className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-sm font-bold">Penyesuaian Periode Ini Selesai</div>
                <p className="text-xs mt-1 leading-relaxed">
                  Jurnal penyesuaian untuk periode <strong>{periodLabel}</strong> telah berhasil dijalankan dan tercatat di sistem. Saldo-saldo penyesuaian telah otomatis terintegrasi ke Buku Besar, Neraca Saldo, dan Laporan Keuangan.
                </p>
              </div>
            </>
          ) : (
            <>
              <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-sm font-bold">Jurnal Penyesuaian Belum Dijalankan</div>
                <p className="text-xs mt-1 leading-relaxed">
                  Jurnal penyesuaian untuk periode <strong>{periodLabel}</strong> belum dibuat di database. Jalankan penyesuaian otomatis agar sistem mencatat realisasi sewa dan beban penyusutan peralatan sesuai prinsip PSAK/IFRS.
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Main Journal Entries Table Card */}
      <div className="card-container p-0 overflow-hidden">
        <div className="p-5 border-b border-border bg-white flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <h3 className="font-bold text-gray-800 text-lg">Jurnal Penyesuaian Aktif ({sortedEntries.length})</h3>
          <div className="flex flex-wrap items-center gap-3">
            {period.preset !== 'all' && actualEntries.length === 0 && (
              <button
                onClick={handleGenerateAdjusting}
                disabled={isGenerating}
                className="text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed px-3.5 py-2 rounded-xl transition-colors shadow-sm hover:shadow-md min-h-10 flex items-center gap-1.5 cursor-pointer"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Coins className="w-4 h-4" />}
                <span>Jalankan Jurnal Penyesuaian</span>
              </button>
            )}

            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 px-3.5 py-2 rounded-xl border border-gray-200 transition-colors flex items-center gap-1.5 shadow-sm min-h-10"
            >
              <ArrowUpDown className="w-4 h-4 text-gray-500" />
              <span>Urutan: {sortOrder === 'asc' ? 'Terlama' : 'Terbaru'}</span>
            </button>

            {!isEditMode ? (
              <button
                onClick={() => setIsEditMode(true)}
                className="text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 px-3.5 py-2 rounded-xl border border-blue-200 transition-colors flex items-center gap-1.5 shadow-sm hover:shadow-md min-h-10"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setIsEditMode(false)
                    setSelectedIds([])
                  }}
                  className="text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 px-3.5 py-2 rounded-xl border border-gray-300 transition-colors shadow-sm min-h-10"
                >
                  Batal
                </button>
                <button
                  onClick={() => setIsDeleteDialogOpen(true)}
                  disabled={selectedIds.length === 0}
                  className="text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed px-3.5 py-2 rounded-xl transition-colors shadow-sm shadow-red-500/10 min-h-10"
                >
                  Hapus Pilihan ({selectedIds.length})
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="min-w-[850px] w-full table-fixed text-left text-sm">
            <colgroup>
              {isEditMode && <col className="w-12" />}
              <col className="w-[11%]" />
              <col className="w-[13%]" />
              <col className="w-[29%]" />
              <col className="w-[13%]" />
              <col className="w-[17%]" />
              <col className="w-[17%]" />
              {isEditMode && <col className="w-16" />}
            </colgroup>
            <thead className="bg-[#F8FAFC] border-b border-gray-200 text-gray-600">
              <tr>
                {isEditMode && (
                  <th className="px-4 py-4 text-center w-12">
                    <input
                      type="checkbox"
                      checked={sortedEntries.length > 0 && selectedIds.length === sortedEntries.length}
                      onChange={(event) => {
                        if (event.target.checked) {
                          setSelectedIds(sortedEntries.map(entry => String(entry.id)))
                        } else {
                          setSelectedIds([])
                        }
                      }}
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                    />
                  </th>
                )}
                <th className="px-4 py-4 font-semibold whitespace-nowrap text-center">ID Jurnal</th>
                <th className="px-4 py-4 font-semibold whitespace-nowrap text-center">Tanggal</th>
                <th className="px-4 py-4 font-semibold text-center">Deskripsi</th>
                <th className="px-4 py-4 font-semibold text-center">Ref</th>
                <th className="px-5 py-4 font-semibold text-center">Debit</th>
                <th className="px-5 py-4 font-semibold text-center">Kredit</th>
                {isEditMode && <th className="px-4 py-4 font-semibold text-center w-16">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700 bg-white">
              {sortedEntries.length === 0 ? (
                <tr>
                  <td colSpan={isEditMode ? 8 : 6} className="px-6 py-12 text-center text-text-muted">
                    Belum ada entri jurnal penyesuaian pada periode ini.
                  </td>
                </tr>
              ) : (
                sortedEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50/50 align-top transition-colors">
                    {isEditMode && (
                      <td className="px-4 py-5 text-center align-middle">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(String(entry.id))}
                          onChange={() => {
                            const entryId = String(entry.id)
                            if (selectedIds.includes(entryId)) {
                              setSelectedIds(selectedIds.filter(id => id !== entryId))
                            } else {
                              setSelectedIds([...selectedIds, entryId])
                            }
                          }}
                          className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                        />
                      </td>
                    )}
                    <td className="px-4 py-5 text-center">
                      <div className="text-xs text-gray-600 font-mono bg-gray-50 inline-block px-1.5 py-1 rounded border border-gray-100">
                        {formatJournalId(entry.id)}
                      </div>
                    </td>
                    <td className="px-4 py-5 whitespace-nowrap text-center">
                      <div className="font-medium text-gray-900">{formatDate(entry.date)}</div>
                    </td>
                    <td className="px-4 py-5">
                      <div className="space-y-2 text-[14px] leading-5">
                        {entry.debits.map((d, i) => (
                          <div key={`d-${i}`} className="text-gray-900 font-medium truncate">
                            {getAccountName(d.accountNumber)}
                          </div>
                        ))}
                        {entry.credits.map((c, i) => (
                          <div key={`c-${i}`} className="text-gray-900 pl-6 truncate">
                            {getAccountName(c.accountNumber)}
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 max-w-full truncate text-[13px] leading-5 text-[#047857] italic font-medium">
                        ({entry.description})
                      </div>
                    </td>
                    <td className="px-4 py-5 text-center">
                      <div className="space-y-2 text-[14px] leading-5">
                        {entry.debits.map((d, i) => (
                          <div key={`dref-${i}`} className="text-gray-500">{d.accountNumber}</div>
                        ))}
                        {entry.credits.map((c, i) => (
                          <div key={`cref-${i}`} className="text-gray-500">{c.accountNumber}</div>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-5 text-right">
                      <div className="space-y-2 text-[14px] leading-5">
                        {entry.debits.map((d, i) => {
                          const { symbol, amount } = formatCurrencyParts(d.amount)
                          return (
                            <div key={`da-${i}`} className="text-gray-900 font-medium flex justify-between w-full">
                              <span className="text-gray-500 mr-2">{symbol}</span>
                              <span>{amount}</span>
                            </div>
                          )
                        })}
                        {entry.credits.map((c, i) => (
                          <div key={`ca-empty-${i}`} className="text-transparent select-none flex justify-between w-full">
                            <span className="mr-2">Rp</span><span>0</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-5 text-right">
                      <div className="space-y-2 text-[14px] leading-5">
                        {entry.debits.map((d, i) => (
                          <div key={`ds-empty-${i}`} className="text-transparent select-none flex justify-between w-full">
                            <span className="mr-2">Rp</span><span>0</span>
                          </div>
                        ))}
                        {entry.credits.map((c, i) => {
                          const { symbol, amount } = formatCurrencyParts(c.amount)
                          return (
                            <div key={`ca-${i}`} className="text-gray-900 flex justify-between w-full">
                              <span className="text-gray-500 mr-2">{symbol}</span>
                              <span>{amount}</span>
                            </div>
                          )
                        })}
                      </div>
                    </td>
                    {isEditMode && (
                      <td className="px-4 py-5 text-center align-middle">
                        <button
                          onClick={() => {
                            setEditingEntry(entry)
                            setIsModalOpen(true)
                          }}
                          className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                          title="Edit jurnal penyesuaian"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <JournalEntryModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingEntry(null)
          loadData()
        }}
        editingEntry={editingEntry || undefined}
      />
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        title="Hapus Jurnal Penyesuaian"
        message={`Apakah Anda yakin ingin menghapus ${selectedIds.length} jurnal penyesuaian terpilih?`}
        confirmLabel="Ya, Hapus"
        isLoading={isDeleting}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteSelected}
      />
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
