import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type ColorMode = "light" | "dark";
export type ThemePreset = "lake-view" | "default" | "sunset" | "forest";
export type ThemeScale = "xs" | "sm" | "md" | "lg";
export type ThemeRadius = "sm" | "md" | "lg" | "xl";
export type SidebarMode = "default" | "icon";
export type ContentLayout = "full" | "centered";

export interface ThemeSettings {
  colorMode: ColorMode;
  preset: ThemePreset;
  scale: ThemeScale;
  radius: ThemeRadius;
  sidebarMode: SidebarMode;
  contentLayout: ContentLayout;
}

const defaultTheme: ThemeSettings = {
  colorMode: "light",
  preset: "lake-view",
  scale: "md",
  radius: "md",
  sidebarMode: "default",
  contentLayout: "full",
};

const loadFromStorage = (): ThemeSettings => {
  try {
    const stored = localStorage.getItem("theme_settings");
    return stored ? { ...defaultTheme, ...JSON.parse(stored) } : defaultTheme;
  } catch {
    return defaultTheme;
  }
};

const saveToStorage = (settings: ThemeSettings) => {
  localStorage.setItem("theme_settings", JSON.stringify(settings));
};

const initialState: ThemeSettings = loadFromStorage();

const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    setColorMode(state, action: PayloadAction<ColorMode>) {
      state.colorMode = action.payload;
      saveToStorage({ ...state });
    },
    setPreset(state, action: PayloadAction<ThemePreset>) {
      state.preset = action.payload;
      saveToStorage({ ...state });
    },
    setScale(state, action: PayloadAction<ThemeScale>) {
      state.scale = action.payload;
      saveToStorage({ ...state });
    },
    setRadius(state, action: PayloadAction<ThemeRadius>) {
      state.radius = action.payload;
      saveToStorage({ ...state });
    },
    setSidebarMode(state, action: PayloadAction<SidebarMode>) {
      state.sidebarMode = action.payload;
      saveToStorage({ ...state });
    },
    setContentLayout(state, action: PayloadAction<ContentLayout>) {
      state.contentLayout = action.payload;
      saveToStorage({ ...state });
    },
    resetTheme(state) {
      Object.assign(state, defaultTheme);
      saveToStorage(defaultTheme);
    },
    applyTheme(state, action: PayloadAction<ThemeSettings>) {
      Object.assign(state, action.payload);
      saveToStorage(action.payload);
    },
  },
});

export const {
  setColorMode,
  setPreset,
  setScale,
  setRadius,
  setSidebarMode,
  setContentLayout,
  resetTheme,
  applyTheme,
} = themeSlice.actions;

export default themeSlice.reducer;
