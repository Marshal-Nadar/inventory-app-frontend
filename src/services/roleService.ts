import api from "@/lib/axios";

export interface Role {
  id: number;
  name: string;
  description: string;
  restaurant_id: number;
}

export const roleService = {
  getAll: async (): Promise<Role[]> => {
    const res = await api.get("/roles");
    return res.data.data;
  },
};
