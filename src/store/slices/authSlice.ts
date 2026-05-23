import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { type PrintSettings } from "@/services/printSettingsService";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: string;
  branch: string | null;
  branch_id: number | null;
  restaurant_id: number | null;
  is_super_admin: boolean;
  can_manage_store: boolean;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  printSettings: PrintSettings | null;
}

const loadAuth = (): AuthState => {
  try {
    const token = localStorage.getItem("auth_token");
    const user = localStorage.getItem("auth_user");
    const printSettings = localStorage.getItem("auth_print_settings");
    return {
      token,
      user: user ? JSON.parse(user) : null,
      isAuthenticated: !!token,
      printSettings: printSettings ? JSON.parse(printSettings) : null,
    };
  } catch {
    return {
      token: null,
      user: null,
      isAuthenticated: false,
      printSettings: null,
    };
  }
};

const initialState: AuthState = loadAuth();

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials(
      state,
      action: PayloadAction<{ user: AuthUser; token: string }>,
    ) {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      localStorage.setItem("auth_token", action.payload.token);
      localStorage.setItem("auth_user", JSON.stringify(action.payload.user));
    },
    setPrintSettings(state, action: PayloadAction<PrintSettings | null>) {
      state.printSettings = action.payload;
      if (action.payload) {
        localStorage.setItem(
          "auth_print_settings",
          JSON.stringify(action.payload),
        );
      } else {
        localStorage.removeItem("auth_print_settings");
      }
    },
    logout(state) {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.printSettings = null;
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
      localStorage.removeItem("auth_print_settings");
    },
  },
});

export const { setCredentials, logout, setPrintSettings } = authSlice.actions;
export default authSlice.reducer;
