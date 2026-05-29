import api from "@/lib/axios";

export interface StockLedgerEntry {
  id: number;
  restaurant_id: number;
  raw_material_id: number;
  entry_type: "purchase_in" | "transfer_out" | "transfer_in" | "adjustment";
  quantity: number;
  reference_id: number | null;
  reference_type: string | null;
  notes: string;
  created_by: number;
  created_at: string;
  raw_material_name: string;
  category: string;
  metric: string;
  restaurant_name: string;
  created_by_name: string;
}

export const stockLedgerService = {
  getAll: async (): Promise<StockLedgerEntry[]> => {
    const res = await api.get("/stock-ledger");
    return res.data.data;
  },

  getByRawMaterial: async (
    rawMaterialId: number,
  ): Promise<StockLedgerEntry[]> => {
    const res = await api.get(`/stock-ledger/${rawMaterialId}`);
    return res.data.data;
  },
};
