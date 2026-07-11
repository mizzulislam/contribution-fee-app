import { spreadsheetApi } from '@/services/sheets-client'

export interface PaymentMethod {
  id: string
  bank_name: string
  account_name: string
  account_number: string
  status: string
}

const FALLBACK_PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'fallback-bca',
    bank_name: 'BCA',
    account_name: 'Splitz',
    account_number: '1234567890',
    status: 'Aktif',
  },
]

function normalizePaymentMethod(row: any): PaymentMethod | null {
  const bankName = String(row?.bank_name || row?.bankName || row?.name || '').trim()
  const accountName = String(row?.account_name || row?.accountName || '').trim()
  const accountNumber = String(row?.account_number || row?.accountNumber || '').trim()
  const id = String(row?.id || `${bankName}-${accountNumber}`).trim()

  if (!bankName || !accountNumber) return null

  return {
    id,
    bank_name: bankName,
    account_name: accountName || 'Bendahara Splitz',
    account_number: accountNumber,
    status: String(row?.status || 'Aktif').trim(),
  }
}

export function isPaymentMethodActive(method: Pick<PaymentMethod, 'status'>) {
  const status = String(method.status || '').toLowerCase()
  return status === 'aktif' || status === 'active'
}

export function formatPaymentMethodLabel(method: PaymentMethod) {
  return `${method.bank_name} - ${method.account_number} a.n ${method.account_name}`
}

export async function getPaymentMethods(): Promise<PaymentMethod[]> {
  const { data, error } = await spreadsheetApi.get('PaymentMethods')
  if (error) throw error

  const rows = Array.isArray(data) ? data : []
  const methods = rows
    .map(normalizePaymentMethod)
    .filter((method): method is PaymentMethod => Boolean(method))

  return methods.length > 0 ? methods : FALLBACK_PAYMENT_METHODS
}

export function findPaymentMethod(methods: PaymentMethod[], value?: string) {
  const normalizedValue = String(value || '').toLowerCase()
  return methods.find(method => {
    return [
      method.id,
      method.bank_name,
      method.account_number,
      formatPaymentMethodLabel(method),
    ].some(candidate => String(candidate).toLowerCase() === normalizedValue)
  })
}
