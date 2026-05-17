import api from "@/lib/axios";

export interface Product {
  id: number;
  restaurant_id: number;
  restaurant_name: string;
  name: string;
  price: number;
  is_active: boolean;
  created_by: number;
  created_by_name: string;
  created_at: string;
}

export const productService = {
  getAll: async (): Promise<Product[]> => {
    const res = await api.get("/products");
    return res.data.data;
  },

  create: async (payload: {
    name: string;
    price: number;
    is_active: boolean;
    restaurant_id?: number;
  }): Promise<Product> => {
    const res = await api.post("/products", payload);
    return res.data.data;
  },

  update: async (
    id: number,
    payload: {
      name: string;
      price: number;
      is_active: boolean;
    },
  ): Promise<Product> => {
    const res = await api.put(`/products/${id}`, payload);
    return res.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/products/${id}`);
  },
};
