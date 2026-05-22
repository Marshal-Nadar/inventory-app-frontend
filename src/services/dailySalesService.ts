import api from "@/lib/axios";

export interface DailySalesAutoValues {
  outdoor_catering: number;
  misc_expense: number;
}

export interface DailySales {
  id: number;
  restaurant_id: number;
  restaurant_name: string;
  branch_id: number;
  branch_name: string;
  sale_date: string;
  petpooja_total: number;
  ns_total: number;
  outdoor_catering: number;
  upi: number;
  cash: number;
  misc_expense: number;
  swiggy: number;
  zomato: number;
  net_sales: number;
  net_counter: number;
  difference: number;
  created_by_name: string;
  created_at: string;
  updated_at: string;
}

export const dailySalesService = {
  getAutoValues: async (
    branchId: string,
    date: string,
  ): Promise<DailySalesAutoValues> => {
    const res = await api.get(
      `/daily-sales/auto-values?branch_id=${branchId}&date=${date}`,
    );
    return res.data.data;
  },

  getByBranchAndDate: async (
    branchId: string,
    date: string,
  ): Promise<DailySales | null> => {
    const res = await api.get(
      `/daily-sales/by-date?branch_id=${branchId}&date=${date}`,
    );
    return res.data.data;
  },

  getAll: async (filters?: {
    branch_id?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<DailySales[]> => {
    const params = new URLSearchParams();
    if (filters?.branch_id) params.append("branch_id", filters.branch_id);
    if (filters?.date_from) params.append("date_from", filters.date_from);
    if (filters?.date_to) params.append("date_to", filters.date_to);
    const res = await api.get(`/daily-sales?${params}`);
    return res.data.data;
  },

  upsert: async (payload: {
    branch_id?: number;
    restaurant_id?: number;
    sale_date: string;
    petpooja_total: number;
    ns_total: number;
    outdoor_catering: number;
    upi: number;
    cash: number;
    misc_expense: number;
    swiggy: number;
    zomato: number;
    net_sales: number;
    net_counter: number;
    difference: number;
  }): Promise<DailySales> => {
    const res = await api.post("/daily-sales", payload);
    return res.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/daily-sales/${id}`);
  },
};
