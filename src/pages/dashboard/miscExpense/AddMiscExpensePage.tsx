import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Combobox } from "@/components/common/Combobox";
import { DatePicker } from "@/components/ui/date-picker";
import { miscExpenseService } from "@/services/miscExpenseService";
import {
  expenseTypeService,
  type ExpenseType,
} from "@/services/expenseTypeService";
import { branchService, type Branch } from "@/services/branchService";
import { useAppSelector } from "@/hooks/useAppSelector";
import { toast } from "sonner";
import { format } from "date-fns";
import { Receipt } from "lucide-react";
import { NumberInput } from "@/components/ui/number-input";

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "upi", label: "UPI" },
];

export const AddMiscExpensePage = () => {
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const isAdmin = user?.role === "admin" || user?.is_super_admin;

  const [expenseTypes, setExpenseTypes] = useState<ExpenseType[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);

  const [expenseTypeId, setExpenseTypeId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [branchId, setBranchId] = useState(String(user?.branch_id || ""));
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [expenseDate, setExpenseDate] = useState<Date | undefined>(new Date());
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedType = expenseTypes.find((t) => String(t.id) === expenseTypeId);

  const subcategoryOptions =
    selectedType?.subcategories
      ?.filter((s) => s.is_active)
      .map((s) => ({ value: String(s.id), label: s.name })) || [];

  useEffect(() => {
    // fetch expense types with subcategories
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

    if (isAdmin) {
      branchService
        .getAll()
        .then((data) => setBranches(data.filter((b) => b.is_active)));
    }
  }, []);

  // reset subcategory when type changes
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

    if (
      selectedType?.has_subcategory &&
      subcategoryOptions.length > 0 &&
      !subcategoryId
    ) {
      setError("Please select a subcategory");
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

    const formattedDate = format(expenseDate, "yyyy-MM-dd");

    setLoading(true);
    try {
      await miscExpenseService.create({
        expense_type_id: Number(expenseTypeId),
        subcategory_id: subcategoryId ? Number(subcategoryId) : null,
        amount: Number(amount),
        payment_method: paymentMethod,
        expense_date: formattedDate,
        notes,
        branch_id: isAdmin ? Number(branchId) : undefined,
        restaurant_id: user?.is_super_admin
          ? (user?.restaurant_id ?? undefined)
          : undefined,
      });
      toast.success("Expense recorded successfully");
      navigate("/dashboard/misc-expense/list");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to record expense");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='space-y-6 max-w-xl'>
      {/* Header */}
      <div>
        <h2 className='text-xl font-bold text-foreground'>
          Add Miscellaneous Expense
        </h2>
        <p className='text-sm text-muted-foreground mt-1'>
          Record a miscellaneous expense for your branch.
        </p>
      </div>

      <form onSubmit={handleSubmit} className='space-y-6'>
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='text-base'>Expense Details</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            {/* Expense Type */}
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

            {/* Subcategory — only if type has subcategory */}
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

            {/* Branch — admin gets dropdown, others get disabled */}
            <div className='space-y-2'>
              <Label>Branch</Label>
              {isAdmin ? (
                <Combobox
                  options={branches.map((b) => ({
                    value: String(b.id),
                    label: b.name,
                  }))}
                  value={branchId}
                  onChange={setBranchId}
                  placeholder='Select branch'
                  searchPlaceholder='Search branches...'
                  emptyText='No branches found.'
                />
              ) : (
                <Input
                  value={user?.branch || ""}
                  readOnly
                  className='bg-muted text-muted-foreground cursor-not-allowed'
                />
              )}
            </div>

            {/* Branch Manager Name — always disabled */}
            <div className='space-y-2'>
              <Label>Branch Manager</Label>
              <Input
                value={user?.name || ""}
                readOnly
                className='bg-muted text-muted-foreground cursor-not-allowed'
              />
            </div>

            {/* Amount */}
            <div className='space-y-2'>
              <Label htmlFor='amount'>Cost (₹)</Label>
              <NumberInput
                id='amount'
                value={amount}
                onChange={setAmount}
                placeholder='0.00'
                min='0'
                required
              />
            </div>

            {/* Payment Method */}
            <div className='space-y-2'>
              <Label>Payment Method</Label>
              <Combobox
                options={PAYMENT_METHODS}
                value={paymentMethod}
                onChange={setPaymentMethod}
                placeholder='Select payment method'
                searchPlaceholder='Search...'
                emptyText='No options.'
              />
            </div>

            {/* Date */}
            <div className='space-y-2'>
              <Label>Expense Date</Label>
              {isAdmin ? (
                <DatePicker
                  date={expenseDate}
                  setDate={setExpenseDate}
                  placeholder='Start date'
                />
              ) : (
                <Input
                  value={format(new Date(), "dd MMM yyyy")}
                  readOnly
                  className='bg-muted text-muted-foreground cursor-not-allowed w-40'
                />
              )}
              {!isAdmin && (
                <p className='text-xs text-muted-foreground'>
                  Expenses can only be added for today.
                </p>
              )}
            </div>

            {/* Notes */}
            <div className='space-y-2'>
              <Label htmlFor='notes'>
                Notes
                <span className='text-xs text-muted-foreground ml-2'>
                  (optional)
                </span>
              </Label>
              <Input
                id='notes'
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder='Any additional details...'
              />
            </div>
          </CardContent>
        </Card>

        {error && (
          <p className='text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md'>
            {error}
          </p>
        )}

        <div className='flex gap-3'>
          <Button type='submit' disabled={loading} className='gap-2'>
            <Receipt className='w-4 h-4' />
            {loading ? "Saving..." : "Record Expense"}
          </Button>
          <Button
            type='button'
            variant='outline'
            onClick={() => navigate("/dashboard/misc-expense/list")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};
