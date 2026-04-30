import { useAppDispatch } from "@/hooks/useAppDispatch";
import { useAppSelector } from "@/hooks/useAppSelector";
import { setColorMode } from "@/store/slices/themeSlice";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";

export const ThemeToggle = () => {
  const dispatch = useAppDispatch();
  const colorMode = useAppSelector((state) => state.theme.colorMode);

  const toggleTheme = () => {
    dispatch(setColorMode(colorMode === "light" ? "dark" : "light"));
  };

  return (
    <Button variant='outline' size='icon' onClick={toggleTheme}>
      {colorMode === "light" ? (
        <Moon className='h-4 w-4' />
      ) : (
        <Sun className='h-4 w-4' />
      )}
    </Button>
  );
};
