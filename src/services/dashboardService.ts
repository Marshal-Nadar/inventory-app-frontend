import api from "@/lib/axios";

export interface DashboardStats {
  restaurants: {
    total: number;
    active: number;
  };
  branches: {
    total: number;
    active: number;
  };
  users: {
    total: number;
    active: number;
  };
  roles: {
    total: number;
    custom: number;
  };
}

export const dashboardService = {
  getStats: async (): Promise<DashboardStats> => {
    const [restaurants, branches, users, roles] = await Promise.all([
      api.get("/restaurants"),
      api.get("/branches"),
      api.get("/users"),
      api.get("/roles"),
    ]);

    const restaurantData = restaurants.data.data;
    const branchData = branches.data.data;
    const userData = users.data.data;
    const roleData = roles.data.data;

    return {
      restaurants: {
        total: restaurantData.length,
        active: restaurantData.filter((r: any) => r.is_active).length,
      },
      branches: {
        total: branchData.length,
        active: branchData.filter((b: any) => b.is_active).length,
      },
      users: {
        total: userData.length,
        active: userData.filter((u: any) => u.is_active).length,
      },
      roles: {
        total: roleData.length,
        custom: roleData.filter((r: any) => !r.is_default).length,
      },
    };
  },
};
