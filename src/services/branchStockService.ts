import api from "@/lib/axios";

export interface BranchStockRow {
  transfer_id: number;
  transfer_time: string;
  branch_id: number;
  branch_name: string;
  restaurant_name: string;
  raw_material_id: number;
  raw_material_name: string;
  category: string;
  quantity: number;
  metric: string;
  avg_price: number;
}

export const branchStockService = {
  getView: async (
    dateFrom: string,
    dateTo: string,
    branchId?: string,
  ): Promise<BranchStockRow[]> => {
    const params = new URLSearchParams({
      date_from: dateFrom,
      date_to: dateTo,
    });
    if (branchId) params.append("branch_id", branchId);
    const res = await api.get(`/transfer-requests/branch-stock?${params}`);
    return res.data.data;
  },
};
