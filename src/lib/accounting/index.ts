export * from './types'
export * from './ChartOfAccounts'
export * from './DoubleEntryEngine'
export * from './GeneralJournal'
export * from './GeneralLedger'
export * from './TrialBalance'
export * from './FinancialStatements'
export * from './ClosingProcess'
export * from './AccountingEngine'

// Create a singleton instance for global use
import { AccountingEngine } from './AccountingEngine'
export const defaultEngine = new AccountingEngine()

// --- Seed Data for Demonstration ---
const today = new Date().toISOString().split('T')[0]

// 1. Initial Investment
defaultEngine.recordTransaction(
  today,
  [{ accountNumber: '1102', amount: 50000000 }], // Debit Kas BCA 50M
  [{ accountNumber: '3101', amount: 50000000 }], // Credit Modal Pemilik 50M
  'Setoran Modal Awal Pemilik'
)

// 2. Buy Equipment (Galon, etc)
defaultEngine.recordTransaction(
  today,
  [{ accountNumber: '1501', amount: 5000000 }], // Debit Peralatan Kos 5M
  [{ accountNumber: '1102', amount: 5000000 }], // Credit Kas BCA 5M
  'Pembelian Peralatan Kos (Kulkas, Galon)'
)

// 3. Receive Rent Revenue
defaultEngine.recordTransaction(
  today,
  [{ accountNumber: '1102', amount: 3500000 }], // Debit Kas BCA 3.5M
  [{ accountNumber: '4101', amount: 3500000 }], // Credit Pendapatan Sewa 3.5M
  'Penerimaan Sewa Kamar Bulan Ini'
)

// 4. Pay Utilities
defaultEngine.recordTransaction(
  today,
  [{ accountNumber: '5101', amount: 800000 }], // Debit Beban Listrik 800k
  [{ accountNumber: '1102', amount: 800000 }], // Credit Kas BCA 800k
  'Pembayaran Tagihan Listrik & Air'
)
