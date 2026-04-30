import api from "@/lib/axios";

export interface Branch {
  id: number;
  name: string;
  address: string;
  phone: string;
  restaurant_id: number;
  restaurant_name: string;
  is_active: boolean;
}

export const branchService = {
  getAll: async (): Promise<Branch[]> => {
    const res = await api.get("/branches");
    return res.data.data;
  },
};
