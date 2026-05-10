import { Badge } from "@/components/ui/badge";

interface Props {
  currentStock: number;
  minStock: number;
  metric: string;
}

type StockStatus = "out" | "low" | "medium" | "sufficient";

const getStockStatus = (current: number, min: number): StockStatus => {
  if (current === 0) return "out";
  if (min === 0) return "sufficient"; // no limit set
  if (current <= min) return "low";
  if (current <= min * 1.5) return "medium";
  return "sufficient";
};

const STATUS_CONFIG = {
  out: {
    label: "Out of Stock",
    className: "bg-red-500/10 text-red-600 border-red-200 hover:bg-red-500/20",
  },
  low: {
    label: "Low",
    className:
      "bg-orange-500/10 text-orange-600 border-orange-200 hover:bg-orange-500/20",
  },
  medium: {
    label: "Medium",
    className:
      "bg-yellow-500/10 text-yellow-600 border-yellow-200 hover:bg-yellow-500/20",
  },
  sufficient: {
    label: "Sufficient",
    className:
      "bg-green-500/10 text-green-600 border-green-200 hover:bg-green-500/20",
  },
};

export const StockBadge = ({ currentStock, minStock, metric }: Props) => {
  const status = getStockStatus(currentStock, minStock);
  const config = STATUS_CONFIG[status];

  return (
    <div className='flex items-center gap-2'>
      <span className='text-sm text-foreground'>
        {Number(currentStock)} {metric}
      </span>
      <Badge variant='outline' className={`text-xs border ${config.className}`}>
        {config.label}
      </Badge>
    </div>
  );
};
