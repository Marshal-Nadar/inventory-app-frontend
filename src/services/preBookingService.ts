import api from "@/lib/axios";
import { PaginatedResponse } from "./purchaseService";

export interface PreBookingItem {
  id?: number;
  booking_id?: number;
  product_id: number;
  product_name: string;
  unit_price: number;
  quantity: number;
  product_discount: number;
  item_total: number;
}

export interface PreBooking {
  id: number;
  order_id: string;
  restaurant_id: number;
  restaurant_name: string;
  branch_id: number;
  branch_name: string;
  customer_name: string;
  mobile: string;
  email: string;
  delivery_address: string;
  subtotal: number;
  product_discount_total: number;
  overall_discount: number;
  final_amount: number;
  amount_paid: number;
  pending_balance: number;
  payment_method: string;
  payment_status: string;
  order_status: string;
  delivery_date: string;
  delivery_time: string;
  remarks: string;
  notes: string;
  created_by: number;
  created_by_name: string;
  created_at: string;
  updated_at: string;
  items?: PreBookingItem[];
  payment_history?: PreBookingPayment[];
}

export interface CreatePreBookingPayload {
  branch_id?: number;
  restaurant_id?: number;
  customer_name: string;
  mobile: string;
  email?: string;
  delivery_address: string;
  items: {
    product_id: number;
    product_name: string;
    unit_price: number;
    quantity: number;
    product_discount: number;
    item_total: number;
  }[];
  subtotal: number;
  product_discount_total: number;
  overall_discount: number;
  final_amount: number;
  amount_paid: number;
  payment_method?: string;
  delivery_date: string;
  delivery_time: string;
  remarks?: string;
  notes?: string;
}

export interface PreBookingPayment {
  id: number;
  booking_id: number;
  amount: number;
  payment_method: string;
  remarks: string;
  created_by_name: string;
  created_at: string;
}

export interface ProductReportRow {
  booking_id: number;
  order_id: string;
  customer_name: string;
  mobile: string;
  branch_name: string;
  delivery_date: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  product_discount: number;
  item_total: number;
  order_total: number;
  amount_paid: number;
  payment_status: string;
  order_status: string;
}

export interface ProductReportStats {
  total_orders: number;
  total_qty: number;
  total_item_value: number;
  total_paid: number;
}

export const preBookingService = {
  getAll: async (filters?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<PreBooking>> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append("status", filters.status);
    params.append("page", String(filters?.page || 1));
    params.append("limit", String(filters?.limit || 20));
    const res = await api.get(`/pre-bookings?${params}`);
    return { data: res.data.data, pagination: res.data.pagination };
  },

  getById: async (id: number): Promise<PreBooking> => {
    const res = await api.get(`/pre-bookings/${id}`);
    return res.data.data;
  },

  create: async (payload: CreatePreBookingPayload): Promise<PreBooking> => {
    const res = await api.post("/pre-bookings", payload);
    return res.data.data;
  },

  updatePayment: async (
    id: number,
    payload: {
      additional_payment: number;
      payment_method: string;
      remarks?: string;
    },
  ): Promise<PreBooking> => {
    const res = await api.patch(`/pre-bookings/${id}/payment`, payload);
    return res.data.data;
  },

  update: async (id: number, payload: any): Promise<PreBooking> => {
    const res = await api.put(`/pre-bookings/${id}`, payload);
    return res.data.data;
  },

  getProductReport: async (filters: {
    branch_id?: string;
    product_id: string;
    date_from: string;
    date_to: string;
  }): Promise<{ rows: ProductReportRow[]; stats: ProductReportStats }> => {
    const params = new URLSearchParams({
      product_id: filters.product_id,
      date_from: filters.date_from,
      date_to: filters.date_to,
    });
    if (filters.branch_id) params.append("branch_id", filters.branch_id);
    const res = await api.get(`/pre-bookings/product-report?${params}`);
    return res.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/pre-bookings/${id}`);
  },
};
