import api from "@/lib/axios";

export type TransferStatus = "pending" | "approved" | "rejected";

export interface TransferRequestItem {
  id: number;
  transfer_request_id: number;
  raw_material_id: number;
  raw_material_name: string;
  raw_material_category: string;
  current_stock: number;
  quantity: number;
  metric: string;
  avg_price: number;
}

export interface TransferRequest {
  id: number;
  restaurant_id: number;
  restaurant_name: string;
  branch_id: number;
  branch_name: string;
  status: TransferStatus;
  notes: string;
  rejection_reason: string;
  requested_by: number;
  requested_by_name: string;
  actioned_by: number | null;
  actioned_by_name: string | null;
  actioned_at: string | null;
  created_at: string;
  items: TransferRequestItem[];
}

export const transferRequestService = {
  getAll: async (): Promise<TransferRequest[]> => {
    const res = await api.get("/transfer-requests");
    return res.data.data;
  },

  create: async (payload: {
    items: {
      raw_material_id: number;
      quantity: number;
      metric: string;
    }[];
    notes?: string;
    branch_id?: number;
  }): Promise<TransferRequest> => {
    const res = await api.post("/transfer-requests", payload);
    return res.data.data;
  },

  approve: async (id: number): Promise<TransferRequest> => {
    const res = await api.patch(`/transfer-requests/${id}/approve`);
    return res.data.data;
  },

  reject: async (
    id: number,
    rejection_reason: string,
  ): Promise<TransferRequest> => {
    const res = await api.patch(`/transfer-requests/${id}/reject`, {
      rejection_reason,
    });
    return res.data.data;
  },
};
