import api from "@/lib/axios";

export interface BillingProduct {
  id: number;
  name: string;
  price: number;
}

export interface BillItem {
  product_id: number;
  product_name: string;
  unit_price: number;
  quantity: number;
  item_total: number;
}

export interface Bill {
  id: number;
  bill_number: string;
  restaurant_id: number;
  branch_id: number;
  branch_name: string;
  subtotal: number;
  gst_percent: number;
  gst_amount: number;
  total_amount: number;
  payment_method: string;
  billed_by: number;
  billed_by_name: string;
  created_at: string;
  print_company_name?: string;
  print_address?: string;
  print_contact?: string;
  print_footer_note?: string;
  items?: BillItem[];
}

export const billingService = {
  getProducts: async (): Promise<BillingProduct[]> => {
    const res = await api.get("/billing/products");
    return res.data.data;
  },

  create: async (payload: {
    items: BillItem[];
    payment_method: string;
    branch_id?: number;
  }): Promise<Bill> => {
    const res = await api.post("/billing", payload);
    return res.data.data;
  },

  getById: async (id: number): Promise<Bill> => {
    const res = await api.get(`/billing/${id}`);
    return res.data.data;
  },

  getAll: async (filters?: {
    date_from?: string;
    date_to?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: Bill[]; pagination: any }> => {
    const params = new URLSearchParams();
    if (filters?.date_from) params.append("date_from", filters.date_from);
    if (filters?.date_to) params.append("date_to", filters.date_to);
    params.append("page", String(filters?.page || 1));
    params.append("limit", String(filters?.limit || 20));
    const res = await api.get(`/billing?${params}`);
    return { data: res.data.data, pagination: res.data.pagination };
  },
};
