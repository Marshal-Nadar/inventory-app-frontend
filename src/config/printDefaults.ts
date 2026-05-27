import { type PrintSettings } from "@/services/printSettingsService";

export const DEFAULT_PRINT_SETTINGS: PrintSettings = {
  id: 0,
  name: "Restaurant",
  print_company_name: "",
  print_address: null,
  print_contact: null,
  print_footer_note: null,
};
