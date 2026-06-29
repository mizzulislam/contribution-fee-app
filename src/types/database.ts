export type Role = 'super admin' | 'admin' | 'user';

export interface User {
  id: string;
  full_name: string;
  email: string;
  role: Role;
  room_number: string;
  status: 'Aktif' | 'Nonaktif' | string;
  nickname?: string;
  password?: string;
  phone_number?: string | number;
}

export interface Bill {
  id: string;
  amount: number;
  status: 'unpaid' | 'paid' | 'pending' | 'rejected' | string;
  due_date: string;
  resident_email: string;
  resident_name: string;
  room_number: string;
  title?: string;
  description?: string;
  category?: string;
  month?: string;
  contributions?: string; // Relation or title
  payment_source?: string;
  accounting_journal_id?: string | number;
  paid_at?: string;
  updated_at?: string;
}

export interface Payment {
  id: string;
  amount: number;
  status: 'pending_verification' | 'verified' | 'rejected' | string;
  date: string;
  date_submitted: string;
  billId: string;
  resident_email: string;
  resident_name: string;
  room_number?: string;
  proofDataUrl?: string;
  proofFileName?: string;
  fileName?: string;
}

export interface Expense {
  id: string;
  amount: number;
  category: string;
  date: string;
  title?: string;
  note?: string;
}

export interface DebitLine {
  accountNumber: string;
  amount: number;
}

export interface CreditLine {
  accountNumber: string;
  amount: number;
}

export interface JournalEntry {
  id: string;
  date: string;
  description: string;
  debits: DebitLine[] | string;
  credits: CreditLine[] | string;
}

export interface MasterData {
  id: string;
  account_number: string;
  account_name: string;
  account_type: string;
  status?: string;
}

export interface Gallon {
  id: string;
  quantity: number;
  type: 'Penggunaan' | 'Pembelian' | string;
  date: string;
  userName?: string;
  note?: string;
  created_at?: string;
  containerName?: string;
  containerType?: string;
  containerCapacity?: number;
  photoUrl?: string;
}

export interface GallonContainer {
  id: string;
  name: string;
  type: 'Tumbler' | 'Gelas' | string;
  capacity: number;
  photoUrl?: string;
  status?: string;
}

export interface SystemSettings {
  id: string;
  key: string;
  value: string;
}

export interface DutySchedule {
  id: string;
  date: string;
  task: string;
  user_id?: string;
  user?: string;
  status?: 'Belum Selesai' | 'Selesai' | string;
  created_at?: string;
}
