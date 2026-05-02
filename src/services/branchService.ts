import api from "@/lib/axios";

export interface Branch {
  id: number;
  name: string;
  address: string;
  phone: string;
  restaurant_id: number;
  restaurant_name: string;
  is_active: boolean;
  created_at: string;
}

export interface CreateBranchPayload {
  restaurant_id: number;
  name: string;
  address: string;
  phone: string;
}

export interface UpdateBranchPayload {
  name: string;
  address: string;
  phone: string;
}

export const branchService = {
  getAll: async (): Promise<Branch[]> => {
    const res = await api.get("/branches");
    return res.data.data;
  },

  getById: async (id: number): Promise<Branch> => {
    const res = await api.get(`/branches/${id}`);
    return res.data.data;
  },

  create: async (payload: CreateBranchPayload): Promise<Branch> => {
    const res = await api.post("/branches", payload);
    return res.data.data;
  },

  update: async (id: number, payload: UpdateBranchPayload): Promise<Branch> => {
    const res = await api.put(`/branches/${id}`, payload);
    return res.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/branches/${id}`);
  },

  activate: async (id: number): Promise<Branch> => {
    const res = await api.patch(`/branches/${id}/activate`);
    return res.data.data;
  },
};
