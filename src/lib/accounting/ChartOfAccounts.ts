import type { Account, AccountType, NormalBalance } from './types'

export class ChartOfAccounts {
  private accounts: Map<string, Account> = new Map()

  /**
   * Determine Normal Balance based on Account Type (GAAP Rules)
   * Assets & Expenses -> Debit
   * Liabilities, Equity, Revenues -> Credit
   */
  public static getNormalBalance(type: AccountType): NormalBalance {
    if (type === 'Assets' || type === 'Expenses') {
      return 'Debit'
    }
    return 'Credit'
  }

  public addAccount(accountNumber: string, accountName: string, accountType: AccountType): void {
    if (this.accounts.has(accountNumber)) {
      // Just update name and type if it exists
      const acc = this.accounts.get(accountNumber)!
      acc.accountName = accountName
      acc.accountType = accountType
      acc.normalBalance = ChartOfAccounts.getNormalBalance(accountType)
      return
    }

    const normalBalance = ChartOfAccounts.getNormalBalance(accountType)
    
    this.accounts.set(accountNumber, {
      accountNumber,
      accountName,
      accountType,
      normalBalance
    })
  }

  public clear(): void {
    this.accounts.clear()
  }

  public getAccount(accountNumber: string): Account | undefined {
    return this.accounts.get(accountNumber)
  }

  public getAllAccounts(): Account[] {
    return Array.from(this.accounts.values()).sort((a, b) => a.accountNumber.localeCompare(b.accountNumber))
  }

  public removeAccount(accountNumber: string): void {
    if (!this.accounts.has(accountNumber)) {
      throw new Error(`Account with number ${accountNumber} does not exist.`)
    }
    this.accounts.delete(accountNumber)
  }

  // Pre-seed standard accounts for Kos
  public seedDefaultAccounts(): void {
    // Assets (Harta) - 1xxx
    this.addAccount('1101', 'Kas Kecil', 'Assets')
    this.addAccount('1102', 'Kas di Bank BCA', 'Assets')
    this.addAccount('1103', 'Kas di Bank Mandiri', 'Assets')
    this.addAccount('1104', 'Piutang Penghuni', 'Assets')
    this.addAccount('1501', 'Peralatan Kos (Aset Tetap)', 'Assets')
    
    // Liabilities (Kewajiban) - 2xxx
    this.addAccount('2101', 'Hutang Usaha', 'Liabilities')
    this.addAccount('2102', 'Uang Muka Sewa', 'Liabilities')
    
    // Equity (Modal) - 3xxx
    this.addAccount('3101', 'Modal Pemilik', 'Equity')
    this.addAccount('3201', 'Prive Pemilik', 'Equity')
    this.addAccount('3500', 'Ikhtisar Laba Rugi', 'Equity') // Income Summary
    
    // Revenues (Pendapatan) - 4xxx
    this.addAccount('4101', 'Pendapatan Sewa Kamar', 'Revenues')
    this.addAccount('4102', 'Pendapatan Denda', 'Revenues')
    this.addAccount('4103', 'Pendapatan Lain-lain', 'Revenues')
    
    // Expenses (Beban) - 5xxx
    this.addAccount('5101', 'Beban Listrik & Air', 'Expenses')
    this.addAccount('5102', 'Beban Kebersihan & Keamanan', 'Expenses')
    this.addAccount('5103', 'Beban Perawatan Bangunan', 'Expenses')
    this.addAccount('5104', 'Beban Gaji Karyawan', 'Expenses')
    this.addAccount('5105', 'Beban Administrasi Bank', 'Expenses')
    this.addAccount('5106', 'Beban Air Galon & Konsumsi', 'Expenses')
  }
}
