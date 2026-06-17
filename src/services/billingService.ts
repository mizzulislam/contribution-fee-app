import { spreadsheetApi } from '@/lib/spreadsheet';
import type { Bill, Payment } from '@/types/database';

export const billingService = {
  /**
   * Fetch all bills from spreadsheet
   */
  async getBills(): Promise<{ data: Bill[] | null; error: Error | null }> {
    const { data, error } = await spreadsheetApi.get('Bills');
    return { 
      data: data as Bill[] | null, 
      error: error as Error | null 
    };
  },

  /**
   * Create a new bill in spreadsheet
   */
  async createBill(bill: Omit<Bill, 'id'> & { id?: string }): Promise<{ success: boolean; error: Error | null }> {
    const { success, error } = await spreadsheetApi.post('Bills', bill);
    return { success, error: error as Error | null };
  },

  /**
   * Update an existing bill
   */
  async updateBill(bill: Bill): Promise<{ success: boolean; error: Error | null }> {
    const { success, error } = await spreadsheetApi.put('Bills', bill);
    return { success, error: error as Error | null };
  },

  /**
   * Delete a bill by ID
   */
  async deleteBill(id: string): Promise<{ success: boolean; error: Error | null }> {
    const { success, error } = await spreadsheetApi.del('Bills', id);
    return { success, error: error as Error | null };
  },

  /**
   * Fetch all payments
   */
  async getPayments(): Promise<{ data: Payment[] | null; error: Error | null }> {
    const { data, error } = await spreadsheetApi.get('Payments');
    return { 
      data: data as Payment[] | null, 
      error: error as Error | null 
    };
  },

  /**
   * Submit a payment verification request
   */
  async createPayment(payment: Omit<Payment, 'id'> & { id?: string }): Promise<{ success: boolean; error: Error | null }> {
    const { success, error } = await spreadsheetApi.post('Payments', payment);
    return { success, error: error as Error | null };
  },

  /**
   * Update a payment record (e.g. status)
   */
  async updatePayment(payment: Payment): Promise<{ success: boolean; error: Error | null }> {
    const { success, error } = await spreadsheetApi.put('Payments', payment);
    return { success, error: error as Error | null };
  },

  /**
   * Delete a payment record
   */
  async deletePayment(id: string): Promise<{ success: boolean; error: Error | null }> {
    const { success, error } = await spreadsheetApi.del('Payments', id);
    return { success, error: error as Error | null };
  }
};
