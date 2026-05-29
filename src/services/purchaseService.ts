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

export interface VendorReportPurchaseItem {
  raw_material_name: string;
  category: string;
  quantity: number;
  metric: string;
  price_per_unit: number;
  total_cost: number;
}
export interface VendorReportPurchase {
  id: number;
  invoice_number: string;
  purchase_date: string;
  total_cost: number;
  restaurant_name: string;
  storage_room_name: string;
  items: VendorReportPurchaseItem[]; // ← add this
}

export interface VendorReport {
  summary: VendorReportSummary | null;
  purchases: VendorReportPurchase[];
  materials: VendorReportMaterial[];
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const purchaseService = {
  getAll: async (filters: {
    vendor_id?: string;
    invoice_number?: string;
    date_from?: string;
    date_to?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Purchase>> => {
    const params = new URLSearchParams();
    if (filters.vendor_id) params.append("vendor_id", filters.vendor_id);
    if (filters.invoice_number)
      params.append("invoice_number", filters.invoice_number);
    if (filters.date_from) params.append("date_from", filters.date_from);
    if (filters.date_to) params.append("date_to", filters.date_to);
    params.append("page", String(filters.page || 1));
    params.append("limit", String(filters.limit || 20));
    const res = await api.get(`/purchases?${params}`);
    return {
      data: res.data.data,
      pagination: res.data.pagination,
    };
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

  update: async (
    id: number,
    payload: CreatePurchasePayload,
  ): Promise<Purchase> => {
    const res = await api.put(`/purchases/${id}`, payload);
    return res.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/purchases/${id}`);
  },

  getStockSummary: async (): Promise<any[]> => {
    const res = await api.get("/purchases/stock-summary");
    return res.data.data;
  },
};
