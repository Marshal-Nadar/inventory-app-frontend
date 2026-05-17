import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { type MiscExpense } from "@/services/miscExpenseService";
import { format } from "date-fns";

interface Props {
  open: boolean;
  onClose: () => void;
  expense: MiscExpense | null;
}

export const MiscExpenseViewDialog = ({ open, onClose, expense }: Props) => {
  if (!expense) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Expense Details</DialogTitle>
        </DialogHeader>

        <div className='space-y-4 py-2'>
          {/* Type + subcategory */}
          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-1'>
              <p className='text-xs text-muted-foreground'>Expense Type</p>
              <p className='text-sm font-semibold text-foreground'>
                {expense.expense_type_name}
              </p>
            </div>
            <div className='space-y-1'>
              <p className='text-xs text-muted-foreground'>Subcategory</p>
              {expense.subcategory_name ? (
                <Badge variant='outline' className='text-xs'>
                  {expense.subcategory_name}
                </Badge>
              ) : (
                <p className='text-sm text-muted-foreground'>—</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Branch + Added by */}
          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-1'>
              <p className='text-xs text-muted-foreground'>Branch</p>
              <p className='text-sm font-medium text-foreground'>
                {expense.branch_name}
              </p>
            </div>
            <div className='space-y-1'>
              <p className='text-xs text-muted-foreground'>Added By</p>
              <p className='text-sm font-medium text-foreground'>
                {expense.created_by_name || "—"}
              </p>
            </div>
          </div>

          <Separator />

          {/* Amount + Payment + Date */}
          <div className='grid grid-cols-3 gap-4'>
            <div className='space-y-1'>
              <p className='text-xs text-muted-foreground'>Amount</p>
              <p className='text-sm font-bold text-foreground'>
                ₹{Number(expense.amount).toFixed(2)}
              </p>
            </div>
            <div className='space-y-1'>
              <p className='text-xs text-muted-foreground'>Payment</p>
              <Badge
                variant='outline'
                className={
                  expense.payment_method === "cash"
                    ? "text-orange-600 border-orange-200 text-xs w-fit"
                    : "text-blue-600 border-blue-200 text-xs w-fit"
                }
              >
                {expense.payment_method === "cash" ? "Cash" : "UPI"}
              </Badge>
            </div>
            <div className='space-y-1'>
              <p className='text-xs text-muted-foreground'>Date</p>
              <p className='text-sm font-medium text-foreground'>
                {format(
                  new Date(`${expense.expense_date.split("T")[0]}T00:00:00`),
                  "dd MMM yyyy",
                )}
              </p>
            </div>
          </div>

          {/* Notes */}
          {expense.notes && (
            <>
              <Separator />
              <div className='space-y-1'>
                <p className='text-xs text-muted-foreground'>Notes</p>
                <p className='text-sm text-foreground'>{expense.notes}</p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
