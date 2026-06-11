import api from "@/lib/axios";

export interface DashboardStats {
  restaurants: { total: number; active: number };
  branches: { total: number; active: number };
  users: { total: number; active: number };
  roles: { total: number; custom: number };
  vendor_stats: {
    total_purchase_amount: number;
    total_amount_paid: number;
    total_amount_due: number;
  };
  operations: {
    pending_transfers: number;
    out_of_stock: number;
    low_stock: number;
    pending_prebookings: number;
    confirmed_prebookings: number;
    today_deliveries: number;
  };
  today_sales: {
    branches_reported: number;
    total_net_sales: number;
    total_net_counter: number;
  };
  recent_purchases: {
    id: number;
    purchase_date: string;
    invoice_number: string;
    total_cost: number;
    vendor_name: string;
  }[];
  cumulative_sales: {
    total_net_sales: number;
    total_net_counter: number;
    total_cash: number;
    total_upi: number;
  };
}

export interface RestaurantStat {
  id: number;
  name: string;
  is_active: boolean;
  active_branches: number;
  active_users: number;
  today_sales: number;
  month_sales: number;
  pending_prebookings: number;
  pending_transfers: number;
  total_purchases: number;
}

export interface SuperAdminStats {
  totals: {
    total_restaurants: number;
    total_branches: number;
    total_users: number;
    today_sales: number;
    pending_prebookings: number;
    pending_transfers: number;
  };
  restaurants: RestaurantStat[];
}

export const dashboardService = {
  getStats: async (): Promise<DashboardStats> => {
    const res = await api.get("/dashboard/stats");
    return res.data.data;
  },
  getSuperAdminStats: async (): Promise<SuperAdminStats> => {
    const res = await api.get("/dashboard/super-admin");
    return res.data.data;
  },
};
