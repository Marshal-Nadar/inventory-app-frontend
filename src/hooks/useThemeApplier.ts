import { useEffect } from "react";
import { useAppSelector } from "./useAppSelector";

export const useThemeApplier = () => {
  const theme = useAppSelector((state) => state.theme);

  useEffect(() => {
    const root = document.documentElement;

    // color mode
    root.classList.remove("light", "dark");
    root.classList.add(theme.colorMode);

    // scale
    root.setAttribute("data-scale", theme.scale);

    // radius
    root.setAttribute("data-radius", theme.radius);

    // preset
    root.setAttribute("data-preset", theme.preset);

    // sidebar mode
    root.setAttribute("data-sidebar", theme.sidebarMode);

    // content layout
    root.setAttribute("data-layout", theme.contentLayout);
  }, [theme]);
};
