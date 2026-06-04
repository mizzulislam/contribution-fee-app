export type AccountType = 'Harta' | 'Kewajiban' | 'Modal' | 'Pendapatan' | 'Beban'

export interface Account {
  account_number: string
  account_name: string
  account_type: AccountType
  is_default: boolean
  status: 'Aktif' | 'Nonaktif'
}

export const DEFAULT_CHART_OF_ACCOUNTS: Account[] = [
  // Harta (Assets) - 1xxx
  { account_number: '1101', account_name: 'Kas Kecil', account_type: 'Harta', is_default: true, status: 'Aktif' },
  { account_number: '1102', account_name: 'Kas di Bank BCA', account_type: 'Harta', is_default: true, status: 'Aktif' },
  { account_number: '1103', account_name: 'Kas di Bank Mandiri', account_type: 'Harta', is_default: true, status: 'Aktif' },
  { account_number: '1104', account_name: 'Piutang Penghuni', account_type: 'Harta', is_default: true, status: 'Aktif' },
  
  // Kewajiban (Liabilities) - 2xxx
  { account_number: '2101', account_name: 'Hutang Usaha', account_type: 'Kewajiban', is_default: true, status: 'Aktif' },
  { account_number: '2102', account_name: 'Uang Muka Sewa', account_type: 'Kewajiban', is_default: true, status: 'Aktif' },
  
  // Modal (Equity) - 3xxx
  { account_number: '3101', account_name: 'Modal Pemilik', account_type: 'Modal', is_default: true, status: 'Aktif' },
  { account_number: '3201', account_name: 'Prive Pemilik', account_type: 'Modal', is_default: true, status: 'Aktif' },
  
  // Pendapatan (Revenue) - 4xxx
  { account_number: '4101', account_name: 'Pendapatan Sewa Kamar', account_type: 'Pendapatan', is_default: true, status: 'Aktif' },
  { account_number: '4102', account_name: 'Pendapatan Denda', account_type: 'Pendapatan', is_default: true, status: 'Aktif' },
  { account_number: '4103', account_name: 'Pendapatan Lain-lain', account_type: 'Pendapatan', is_default: true, status: 'Aktif' },
  
  // Beban (Expenses) - 5xxx
  { account_number: '5101', account_name: 'Beban Listrik & Air', account_type: 'Beban', is_default: true, status: 'Aktif' },
  { account_number: '5102', account_name: 'Beban Kebersihan & Keamanan', account_type: 'Beban', is_default: true, status: 'Aktif' },
  { account_number: '5103', account_name: 'Beban Perawatan Bangunan', account_type: 'Beban', is_default: true, status: 'Aktif' },
  { account_number: '5104', account_name: 'Beban Gaji Karyawan', account_type: 'Beban', is_default: true, status: 'Aktif' },
  { account_number: '5105', account_name: 'Beban Administrasi Bank', account_type: 'Beban', is_default: true, status: 'Aktif' },
]

export const mergeAccounts = (customAccounts: any[]): Account[] => {
  // Ubah data dari API/Google Sheets menjadi format yang sesuai
  const formattedCustoms = customAccounts.map(c => ({
    id: c.id,
    account_number: String(c.account_number),
    account_name: c.account_name || c.name, // fallback for legacy data
    account_type: c.account_type || c.type, // fallback
    is_default: false,
    status: c.status || 'Aktif'
  }))

  // Cek konflik nomor akun. Prioritaskan custom (jika diubah) atau keep default
  const merged = [...DEFAULT_CHART_OF_ACCOUNTS]
  
  formattedCustoms.forEach(custom => {
    const existingIndex = merged.findIndex(m => m.account_number === custom.account_number)
    if (existingIndex >= 0) {
      // Jika no akun sama, kita override nama dan statusnya dengan yang custom
      merged[existingIndex] = { ...merged[existingIndex], ...custom, is_default: true } // keep it marked as default for deletion protection
    } else {
      merged.push(custom)
    }
  })

  // Sort by account number
  return merged.sort((a, b) => a.account_number.localeCompare(b.account_number))
}
