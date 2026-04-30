import api from "@/lib/axios";

export interface User {
  id: number;
  name: string;
  email: string;
  role_id: number;
  role_name: string;
  branch_id: number;
  branch_name: string;
  restaurant_id: number;
  restaurant_name: string;
  is_active: boolean;
  created_at: string;
}

export interface CreateUserPayload {
  restaurant_id: number;
  branch_id: number;
  role_id: number;
  name: string;
  email: string;
  password: string;
}

export interface UpdateUserPayload {
  branch_id: number;
  role_id: number;
  name: string;
  email: string;
}

export const userService = {
  getAll: async (): Promise<User[]> => {
    const res = await api.get("/users");
    return res.data.data;
  },

  getById: async (id: number): Promise<User> => {
    const res = await api.get(`/users/${id}`);
    return res.data.data;
  },

  create: async (payload: CreateUserPayload): Promise<User> => {
    const res = await api.post("/users", payload);
    return res.data.data;
  },

  update: async (id: number, payload: UpdateUserPayload): Promise<User> => {
    const res = await api.put(`/users/${id}`, payload);
    return res.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/users/${id}`);
  },
};
