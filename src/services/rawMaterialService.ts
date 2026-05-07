import api from "@/lib/axios";

export interface RawMaterial {
  id: number;
  restaurant_id: number;
  restaurant_name: string;
  category: string;
  name: string;
  metric: string;
  is_active: boolean;
  created_by: number;
  created_by_name: string;
  created_at: string;
  updated_at: string;
}

export interface RawMaterialItem {
  category: string;
  name: string;
  metric: string;
}

export const rawMaterialService = {
  getAll: async (): Promise<RawMaterial[]> => {
    const res = await api.get("/raw-materials");
    return res.data.data;
  },

  create: async (
    items: RawMaterialItem[],
    restaurant_id?: number,
  ): Promise<RawMaterial[]> => {
    const res = await api.post("/raw-materials", { items, restaurant_id });
    return res.data.data;
  },

  update: async (
    id: number,
    payload: RawMaterialItem,
  ): Promise<RawMaterial> => {
    const res = await api.put(`/raw-materials/${id}`, payload);
    return res.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/raw-materials/${id}`);
  },
};
