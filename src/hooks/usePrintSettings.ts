import { useAppSelector } from "@/hooks/useAppSelector";
import { toast } from "sonner";

export const usePrintSettings = () => {
  const printSettings = useAppSelector((state) => state.auth.printSettings);

  const getPrintSettings = () => {
    if (!printSettings) {
      toast.error(
        "Print settings not configured. Please set up in Settings → Print Settings.",
      );
      return null;
    }
    return printSettings;
  };

  return { getPrintSettings };
};
