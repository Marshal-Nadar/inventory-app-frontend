import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/common/Combobox";
import { DatePicker } from "@/components/ui/date-picker";
import {
  miscExpenseService,
  type MiscExpense,
} from "@/services/miscExpenseService";
import {
  expenseTypeService,
  type ExpenseType,
} from "@/services/expenseTypeService";
import { toast } from "sonner";
import { format } from "date-fns";

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "upi", label: "UPI" },
];

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  expense: MiscExpense | null;
}

export const MiscExpenseEditDialog = ({
  open,
  onClose,
  onSuccess,
  expense,
}: Props) => {
  const [expenseTypes, setExpenseTypes] = useState<ExpenseType[]>([]);
  const [expenseTypeId, setExpenseTypeId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [expenseDate, setExpenseDate] = useState<Date | undefined>();
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedType = expenseTypes.find((t) => String(t.id) === expenseTypeId);

  const subcategoryOptions =
    selectedType?.subcategories
      ?.filter((s) => s.is_active)
      .map((s) => ({ value: String(s.id), label: s.name })) || [];

  useEffect(() => {
    expenseTypeService.getAll().then(async (types) => {
      const withSubs = await Promise.all(
        types.map(async (t) => {
          if (t.has_subcategory) {
            const detail = await expenseTypeService.getById(t.id);
            return { ...t, subcategories: detail.subcategories };
          }
          return t;
        }),
      );
      setExpenseTypes(withSubs.filter((t) => t.is_active));
    });
  }, []);

  useEffect(() => {
    if (expense && open) {
      setExpenseTypeId(String(expense.expense_type_id));
      setSubcategoryId(
        expense.subcategory_id ? String(expense.subcategory_id) : "",
      );
      setAmount(String(expense.amount));
      setPaymentMethod(expense.payment_method);
      setExpenseDate(
        new Date(`${expense.expense_date.split("T")[0]}T00:00:00`),
      );
      setNotes(expense.notes || "");
      setError("");
    }
  }, [expense, open]);

  useEffect(() => {
    setSubcategoryId("");
  }, [expenseTypeId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!expenseTypeId) {
      setError("Please select an expense type");
      return;
    }
    if (!amount || Number(amount) <= 0) {
      setError("Amount must be greater than 0");
      return;
    }
    if (!paymentMethod) {
      setError("Please select a payment method");
      return;
    }
    if (!expenseDate) {
      setError("Please select a date");
      return;
    }

    setLoading(true);
    try {
      await miscExpenseService.update(expense!.id, {
        expense_type_id: Number(expenseTypeId),
        subcategory_id: subcategoryId ? Number(subcategoryId) : null,
        amount: Number(amount),
        payment_method: paymentMethod,
        expense_date: format(expenseDate, "yyyy-MM-dd"),
        notes,
      });
      toast.success("Expense updated");
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update expense");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Edit Expense</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className='space-y-4 py-2'>
          <div className='space-y-2'>
            <Label>Expense Type</Label>
            <Combobox
              options={expenseTypes.map((t) => ({
                value: String(t.id),
                label: t.name,
              }))}
              value={expenseTypeId}
              onChange={setExpenseTypeId}
              placeholder='Select expense type'
              searchPlaceholder='Search types...'
              emptyText='No expense types found.'
            />
          </div>

          {selectedType?.has_subcategory && (
            <div className='space-y-2'>
              <Label>Subcategory</Label>
              <Combobox
                options={subcategoryOptions}
                value={subcategoryId}
                onChange={setSubcategoryId}
                placeholder='Select subcategory'
                searchPlaceholder='Search subcategories...'
                emptyText='No subcategories found.'
              />
            </div>
          )}

          <div className='space-y-2'>
            <Label>Amount (₹)</Label>
            <Input
              type='number'
              min='0.01'
              step='0.01'
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className='space-y-2'>
            <Label>Payment Method</Label>
            <Combobox
              options={PAYMENT_METHODS}
              value={paymentMethod}
              onChange={setPaymentMethod}
              placeholder='Select payment method'
              searchPlaceholder=''
              emptyText=''
            />
          </div>

          <div className='space-y-2'>
            <Label>Expense Date</Label>
            <DatePicker
              date={expenseDate}
              setDate={setExpenseDate}
              placeholder='Select date'
            />
          </div>

          <div className='space-y-2'>
            <Label>
              Notes{" "}
              <span className='text-xs text-muted-foreground ml-1'>
                (optional)
              </span>
            </Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder='Any additional details...'
            />
          </div>

          {error && (
            <p className='text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md'>
              {error}
            </p>
          )}

          <DialogFooter>
            <Button type='button' variant='outline' onClick={onClose}>
              Cancel
            </Button>
            <Button type='submit' disabled={loading}>
              {loading ? "Saving..." : "Update"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
