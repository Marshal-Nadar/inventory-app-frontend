import api from "@/lib/axios";

export interface DashboardStats {
  restaurants: { total: number; active: number };
  branches: { total: number; active: number };
  users: { total: number; active: number };
  roles: { total: number; custom: number };
  operations: {
    pending_transfers: number;
    out_of_stock: number;
    low_stock: number;
    pending_prebookings: number;
    confirmed_prebookings: number;
    today_deliveries: number;
    vendor_outstanding: number;
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
}

export const dashboardService = {
  getStats: async (): Promise<DashboardStats> => {
    const res = await api.get("/dashboard/stats");
    return res.data.data;
  },
};
