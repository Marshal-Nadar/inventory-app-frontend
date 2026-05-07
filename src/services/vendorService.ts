import api from "@/lib/axios";

export interface Vendor {
  id: number;
  restaurant_id: number;
  restaurant_name: string;
  name: string;
  phone: string;
  address: string;
  description: string;
  is_active: boolean;
  created_by: number;
  created_by_name: string;
  created_at: string;
  updated_at: string;
}

export interface VendorPayload {
  name: string;
  phone: string;
  address: string;
  description: string;
  restaurant_id?: number;
}

export const vendorService = {
  getAll: async (): Promise<Vendor[]> => {
    const res = await api.get("/vendors");
    return res.data.data;
  },

  create: async (payload: VendorPayload): Promise<Vendor> => {
    const res = await api.post("/vendors", payload);
    return res.data.data;
  },

  update: async (id: number, payload: VendorPayload): Promise<Vendor> => {
    const res = await api.put(`/vendors/${id}`, payload);
    return res.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/vendors/${id}`);
  },
};
