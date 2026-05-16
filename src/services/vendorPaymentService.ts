import api from "@/lib/axios";

export interface VendorPaymentSummary {
  vendor_id: number;
  vendor_name: string;
  vendor_phone: string;
  total_invoices: number;
  total_purchases: number;
  amount_paid: number;
  outstanding_balance: number;
}

export interface VendorInvoice {
  purchase_id: number;
  invoice_number: string;
  purchase_date: string;
  invoice_amount: number;
  amount_paid: number;
  balance_due: number;
}

export interface PaymentRow {
  purchase_id: number;
  amount: string;
  payment_mode: string;
  payment_date: string;
  notes: string;
}

export interface PaymentReceipt {
  payment_id: number;
  payment_date: string;
  amount: number;
  payment_mode: string;
  notes: string;
  vendor_name: string;
  vendor_phone: string;
  invoice_number: string;
  purchase_date: string;
  invoice_amount: number;
  recorded_by: string;
}

export interface PendingPayment {
  vendor_name: string;
  vendor_phone: string;
  purchase_id: number;
  invoice_number: string;
  purchase_date: string;
  purchase_amount: number;
  amount_paid: number;
  amount_due: number;
}

export const vendorPaymentService = {
  getSummary: async (): Promise<VendorPaymentSummary[]> => {
    const res = await api.get("/vendor-payments/summary");
    return res.data.data;
  },

  getInvoices: async (vendorId: number): Promise<VendorInvoice[]> => {
    const res = await api.get(`/vendor-payments/invoices/${vendorId}`);
    return res.data.data;
  },

  createPayments: async (
    vendorId: number,
    payments: {
      purchase_id: number;
      amount: number;
      payment_mode: string;
      payment_date: string;
      notes?: string;
    }[],
  ): Promise<any> => {
    const res = await api.post("/vendor-payments", {
      vendor_id: vendorId,
      payments,
    });
    return res.data.data;
  },

  getReceipts: async (filters: {
    vendor_id?: string;
    date_from?: string;
    date_to?: string;
    payment_mode?: string;
  }): Promise<{ receipts: PaymentReceipt[]; total_amount: number }> => {
    const params = new URLSearchParams();
    if (filters.vendor_id) params.append("vendor_id", filters.vendor_id);
    if (filters.date_from) params.append("date_from", filters.date_from);
    if (filters.date_to) params.append("date_to", filters.date_to);
    if (filters.payment_mode)
      params.append("payment_mode", filters.payment_mode);
    const res = await api.get(`/vendor-payments/receipts?${params}`);
    return res.data.data;
  },

  getPending: async (
    vendorId?: string,
  ): Promise<{
    pending: PendingPayment[];
    total_due: number;
  }> => {
    const params = new URLSearchParams();
    if (vendorId) params.append("vendor_id", vendorId);
    const res = await api.get(`/vendor-payments/pending?${params}`);
    return res.data.data;
  },
};
