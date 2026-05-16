import api from "@/lib/axios";

export interface ExpenseSubcategory {
  id: number;
  expense_type_id: number;
  name: string;
  is_active: boolean;
}

export interface ExpenseType {
  id: number;
  restaurant_id: number;
  restaurant_name: string;
  name: string;
  has_subcategory: boolean;
  is_active: boolean;
  subcategory_count: number;
  subcategories?: ExpenseSubcategory[];
  created_at: string;
}

export const expenseTypeService = {
  getAll: async (): Promise<ExpenseType[]> => {
    const res = await api.get("/expense-types");
    return res.data.data;
  },

  getById: async (id: number): Promise<ExpenseType> => {
    const res = await api.get(`/expense-types/${id}`);
    return res.data.data;
  },

  create: async (payload: {
    name: string;
    has_subcategory: boolean;
    subcategories: string[];
    restaurant_id?: number;
  }): Promise<ExpenseType> => {
    const res = await api.post("/expense-types", payload);
    return res.data.data;
  },

  update: async (
    id: number,
    payload: { name: string; has_subcategory: boolean },
  ): Promise<ExpenseType> => {
    const res = await api.put(`/expense-types/${id}`, payload);
    return res.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/expense-types/${id}`);
  },

  addSubcategory: async (
    expenseTypeId: number,
    name: string,
  ): Promise<ExpenseSubcategory> => {
    const res = await api.post(
      `/expense-types/${expenseTypeId}/subcategories`,
      { name },
    );
    return res.data.data;
  },

  updateSubcategory: async (
    expenseTypeId: number,
    subId: number,
    name: string,
  ): Promise<ExpenseSubcategory> => {
    const res = await api.put(
      `/expense-types/${expenseTypeId}/subcategories/${subId}`,
      { name },
    );
    return res.data.data;
  },

  deleteSubcategory: async (
    expenseTypeId: number,
    subId: number,
  ): Promise<void> => {
    await api.delete(`/expense-types/${expenseTypeId}/subcategories/${subId}`);
  },
};
