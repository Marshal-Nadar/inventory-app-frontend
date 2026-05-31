import api from "@/lib/axios";

export interface MiscExpense {
  id: number;
  restaurant_id: number;
  restaurant_name: string;
  branch_id: number;
  branch_name: string;
  expense_type_id: number;
  expense_type_name: string;
  subcategory_id: number | null;
  subcategory_name: string | null;
  amount: number;
  payment_method: string;
  expense_date: string;
  notes: string;
  created_by: number;
  created_by_name: string;
  created_at: string;
}

export interface MiscExpenseReportStats {
  total: number;
  cash: number;
  upi: number;
}

export const miscExpenseService = {
  getAll: async (filters?: {
    date?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: MiscExpense[]; pagination: any }> => {
    const params = new URLSearchParams();
    if (filters?.date) params.append("date", filters.date);
    params.append("page", String(filters?.page || 1));
    params.append("limit", String(filters?.limit || 20));
    const res = await api.get(`/misc-expenses?${params}`);
    return { data: res.data.data, pagination: res.data.pagination };
  },

  create: async (payload: {
    expense_type_id: number;
    subcategory_id?: number | null;
    amount: number;
    payment_method: string;
    expense_date: string;
    notes?: string;
    branch_id?: number;
    restaurant_id?: number;
  }): Promise<MiscExpense> => {
    const res = await api.post("/misc-expenses", payload);
    return res.data.data;
  },

  update: async (
    id: number,
    payload: {
      expense_type_id: number;
      subcategory_id?: number | null;
      amount: number;
      payment_method: string;
      expense_date: string;
      notes?: string;
    },
  ): Promise<MiscExpense> => {
    const res = await api.put(`/misc-expenses/${id}`, payload);
    return res.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/misc-expenses/${id}`);
  },

  getReport: async (filters: {
    date_from: string;
    date_to: string;
    branch_id?: string;
    payment_method?: string;
  }): Promise<{ expenses: MiscExpense[]; stats: MiscExpenseReportStats }> => {
    const params = new URLSearchParams({
      date_from: filters.date_from,
      date_to: filters.date_to,
    });
    if (filters.branch_id) params.append("branch_id", filters.branch_id);
    if (filters.payment_method)
      params.append("payment_method", filters.payment_method);
    const res = await api.get(`/misc-expenses/report?${params}`);
    return res.data.data;
  },
};
