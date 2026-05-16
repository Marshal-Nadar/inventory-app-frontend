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

export const miscExpenseService = {
  getAll: async (): Promise<MiscExpense[]> => {
    const res = await api.get("/misc-expenses");
    return res.data.data;
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

  delete: async (id: number): Promise<void> => {
    await api.delete(`/misc-expenses/${id}`);
  },
};
