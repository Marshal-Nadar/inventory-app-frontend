import api from "@/lib/axios";

export interface PurchaseItem {
  id: number;
  purchase_id: number;
  raw_material_id: number;
  raw_material_name: string;
  raw_material_category: string;
  quantity: number;
  metric: string;
  price_per_unit: number;
  total_cost: number;
}

export interface Purchase {
  id: number;
  restaurant_id: number;
  restaurant_name: string;
  storage_room_name: string;
  vendor_id: number;
  vendor_name: string;
  invoice_number: string;
  purchase_date: string;
  total_cost: number;
  notes: string;
  created_by: number;
  created_by_name: string;
  created_at: string;
  items?: PurchaseItem[];
}

export interface PurchaseItemPayload {
  raw_material_id: number;
  quantity: number;
  metric: string;
  price_per_unit: number;
  total_cost: number;
}

export interface CreatePurchasePayload {
  vendor_id: number;
  invoice_number: string;
  purchase_date: string;
  notes?: string;
  items: PurchaseItemPayload[];
  restaurant_id?: number;
}

export interface PurchaseStats {
  total_count: number;
  total_spend: number;
}

export interface PurchaseFilters {
  vendor_id?: string;
  invoice_number?: string;
  date_from?: string;
  date_to?: string;
}

export interface PurchaseListResponse {
  purchases: Purchase[];
  stats: PurchaseStats;
}

export interface VendorReportSummary {
  vendor_id: number;
  vendor_name: string;
  vendor_phone: string;
  total_purchases: number;
  total_spend: number;
  first_purchase: string;
  last_purchase: string;
}

export interface VendorReportMaterial {
  raw_material_name: string;
  category: string;
  total_quantity: number;
  metric: string;
  total_cost: number;
}

export interface VendorReportPurchase {
  id: number;
  invoice_number: string;
  purchase_date: string;
  total_cost: number;
  restaurant_name: string;
  storage_room_name: string;
}

export interface VendorReport {
  summary: VendorReportSummary | null;
  purchases: VendorReportPurchase[];
  materials: VendorReportMaterial[];
}

export const purchaseService = {
  getAll: async (filters?: PurchaseFilters): Promise<PurchaseListResponse> => {
    const params = new URLSearchParams();
    if (filters?.vendor_id) params.append("vendor_id", filters.vendor_id);
    if (filters?.invoice_number)
      params.append("invoice_number", filters.invoice_number);
    if (filters?.date_from) params.append("date_from", filters.date_from);
    if (filters?.date_to) params.append("date_to", filters.date_to);

    const query = params.toString();
    const res = await api.get(`/purchases${query ? `?${query}` : ""}`);
    return res.data.data;
  },

  getById: async (id: number): Promise<Purchase> => {
    const res = await api.get(`/purchases/${id}`);
    return res.data.data;
  },

  getVendorReport: async (
    vendorId: string,
    dateFrom: string,
    dateTo: string,
  ): Promise<VendorReport> => {
    const res = await api.get(
      `/purchases/purchase-report?vendor_id=${vendorId}&date_from=${dateFrom}&date_to=${dateTo}`,
    );
    return res.data.data;
  },

  create: async (payload: CreatePurchasePayload): Promise<Purchase> => {
    const res = await api.post("/purchases", payload);
    return res.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/purchases/${id}`);
  },
};
