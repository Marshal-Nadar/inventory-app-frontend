import api from "@/lib/axios";

export interface Restaurant {
  id: number;
  name: string;
  slug: string;
  timezone: string;
  is_active: boolean;
  created_at: string;
}

export const restaurantService = {
  getAll: async (): Promise<Restaurant[]> => {
    const res = await api.get("/restaurants");
    return res.data.data;
  },

  getById: async (id: number): Promise<Restaurant> => {
    const res = await api.get(`/restaurants/${id}`);
    return res.data.data;
  },

  create: async (payload: {
    name: string;
    slug: string;
    timezone: string;
  }): Promise<Restaurant> => {
    const res = await api.post("/restaurants", payload);
    return res.data.data;
  },

  update: async (
    id: number,
    payload: { name: string; slug: string; timezone: string },
  ): Promise<Restaurant> => {
    const res = await api.put(`/restaurants/${id}`, payload);
    return res.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/restaurants/${id}`);
  },

  activate: async (id: number): Promise<Restaurant> => {
    const res = await api.patch(`/restaurants/${id}/activate`);
    return res.data.data;
  },
};
