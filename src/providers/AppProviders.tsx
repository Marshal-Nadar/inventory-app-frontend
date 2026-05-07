import { Provider } from "react-redux";
import { store } from "../store";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeApplier } from "./ThemeApplier";
import { Toaster } from "@/components/ui/sonner";

interface Props {
  children: React.ReactNode;
}

export const AppProviders = ({ children }: Props) => {
  return (
    <Provider store={store}>
      <TooltipProvider>
        <ThemeApplier />
        {children}
        <Toaster position='top-right' />
      </TooltipProvider>
    </Provider>
  );
};
