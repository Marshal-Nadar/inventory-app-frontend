import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { type DailySales } from "@/services/dailySalesService";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
  record: DailySales | null;
}

export const SalesViewDialog = ({ open, onClose, record }: Props) => {
  if (!record) return null;

  const difference = Number(record.difference);

  const Row = ({
    label,
    value,
    valueClass,
  }: {
    label: string;
    value: string;
    valueClass?: string;
  }) => (
    <div className='flex justify-between items-center py-1.5'>
      <span className='text-sm text-muted-foreground'>{label}</span>
      <span className={cn("text-sm font-medium text-foreground", valueClass)}>
        {value}
      </span>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Daily Sales — {record.branch_name}</DialogTitle>
          <p className='text-sm text-muted-foreground'>
            {format(new Date(`${record.sale_date}T00:00:00`), "dd MMM yyyy")}
          </p>
        </DialogHeader>

        <div className='space-y-4 py-2'>
          {/* Income */}
          <div>
            <p className='text-xs font-semibold text-foreground uppercase tracking-wide mb-2'>
              Income
            </p>
            <Row
              label='PetPooja Total'
              value={`₹${Number(record.petpooja_total).toFixed(2)}`}
            />
            <Row
              label='NS Total'
              value={`₹${Number(record.ns_total).toFixed(2)}`}
            />
            <Row
              label='Outdoor Catering'
              value={`₹${Number(record.outdoor_catering).toFixed(2)}`}
            />
          </div>

          <Separator />

          {/* Payment Methods */}
          <div>
            <p className='text-xs font-semibold text-foreground uppercase tracking-wide mb-2'>
              Payment Methods
            </p>
            <Row label='UPI' value={`₹${Number(record.upi).toFixed(2)}`} />
            <Row label='Cash' value={`₹${Number(record.cash).toFixed(2)}`} />
            <Row
              label='Misc Expense'
              value={`₹${Number(record.misc_expense).toFixed(2)}`}
            />
          </div>

          <Separator />

          {/* Online Platforms */}
          <div>
            <p className='text-xs font-semibold text-foreground uppercase tracking-wide mb-2'>
              Online Platforms
            </p>
            <Row
              label='Swiggy'
              value={`₹${Number(record.swiggy).toFixed(2)}`}
            />
            <Row
              label='Zomato'
              value={`₹${Number(record.zomato).toFixed(2)}`}
            />
          </div>

          <Separator />

          {/* Summary */}
          <div>
            <p className='text-xs font-semibold text-foreground uppercase tracking-wide mb-2'>
              Summary
            </p>
            <Row
              label='Net Sales'
              value={`₹${Number(record.net_sales).toFixed(2)}`}
              valueClass='font-semibold'
            />
            <Row
              label='Net Counter'
              value={`₹${Number(record.net_counter).toFixed(2)}`}
              valueClass='font-semibold'
            />
            <div className='flex justify-between items-center py-1.5'>
              <span className='text-sm text-muted-foreground'>Difference</span>
              <span
                className={cn(
                  "text-sm font-bold",
                  difference === 0
                    ? "text-green-600"
                    : difference > 0
                      ? "text-orange-600"
                      : "text-destructive",
                )}
              >
                {difference > 0 ? "+" : ""}
                {difference.toFixed(2)}
              </span>
            </div>
          </div>

          {record.created_by_name && (
            <>
              <Separator />
              <p className='text-xs text-muted-foreground'>
                Submitted by {record.created_by_name}
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
