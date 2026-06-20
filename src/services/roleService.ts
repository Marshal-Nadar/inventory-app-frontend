import api from "@/lib/axios";

export interface Role {
  id: number;
  name: string;
  description: string;
  restaurant_id: number;
  restaurant_name: string;
  is_default: boolean;
  created_at: string;
}

export interface CreateRolePayload {
  restaurant_id: number;
  name: string;
  description: string;
}

export interface UpdateRolePayload {
  name: string;
  description: string;
}

export const roleService = {
  getAll: async (): Promise<Role[]> => {
    const res = await api.get("/roles");
    return res.data.data;
  },

  getByRestaurant: async (restaurantId: number): Promise<Role[]> => {
    const res = await api.get(`/roles/restaurant/${restaurantId}`);
    return res.data.data;
  },

  getById: async (id: number): Promise<Role> => {
    const res = await api.get(`/roles/${id}`);
    return res.data.data;
  },

  create: async (payload: CreateRolePayload): Promise<Role> => {
    const res = await api.post("/roles", payload);
    return res.data.data;
  },

  update: async (id: number, payload: UpdateRolePayload): Promise<Role> => {
    const res = await api.put(`/roles/${id}`, payload);
    return res.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/roles/${id}`);
  },
};
