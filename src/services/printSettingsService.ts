import api from "@/lib/axios";

export interface PrintSettings {
  id: number;
  name: string;
  print_company_name: string;
  print_address: string | null;
  print_contact: string | null;
  print_footer_note: string | null;
}

export const printSettingsService = {
  get: async (restaurantId: number): Promise<PrintSettings> => {
    const res = await api.get(`/restaurants/${restaurantId}/print-settings`);
    return res.data.data;
  },

  update: async (
    restaurantId: number,
    data: Partial<Omit<PrintSettings, "id" | "name">>,
  ): Promise<PrintSettings> => {
    const res = await api.patch(
      `/restaurants/${restaurantId}/print-settings`,
      data,
    );
    return res.data.data;
  },
};
