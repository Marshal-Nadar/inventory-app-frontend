import { Provider } from "react-redux";
import { store } from "../store";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeApplier } from "./ThemeApplier";

interface Props {
  children: React.ReactNode;
}

export const AppProviders = ({ children }: Props) => {
  return (
    <Provider store={store}>
      <TooltipProvider>
        <ThemeApplier />
        {children}
      </TooltipProvider>
    </Provider>
  );
};
