import { useEffect, useState, useMemo } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  vendorPaymentService,
  type VendorPaymentSummary,
  type VendorInvoice,
  type PaymentRow,
} from "@/services/vendorPaymentService";
import { toast } from "sonner";

const PAYMENT_MODES = [
  { value: "cash", label: "Cash" },
  { value: "upi", label: "UPI" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "cheque", label: "Cheque" },
];

const ONLINE_MODES = ["upi", "bank_transfer", "cheque"];

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  vendor: VendorPaymentSummary | null;
}

export const VendorPaymentDialog = ({
  open,
  onClose,
  onSuccess,
  vendor,
}: Props) => {
  const [invoices, setInvoices] = useState<VendorInvoice[]>([]);
  const [paymentRows, setPaymentRows] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState("");

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (open && vendor) {
      setFetching(true);
      setError("");
      vendorPaymentService
        .getInvoices(vendor.vendor_id)
        .then((data) => {
          // only show invoices with balance due
          const unpaid = data.filter((inv) => Number(inv.balance_due) > 0);
          setInvoices(unpaid);
          setPaymentRows(
            unpaid.map((inv) => ({
              purchase_id: inv.purchase_id,
              amount: "",
              payment_mode: "",
              payment_date: today,
              notes: "",
            })),
          );
        })
        .catch(() => setError("Failed to load invoices"))
        .finally(() => setFetching(false));
    }
  }, [open, vendor]);

  const updateRow = (index: number, field: keyof PaymentRow, value: string) => {
    setPaymentRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    );
  };

  // live totals
  const liveTotalPaying = useMemo(
    () =>
      paymentRows.reduce((sum, row) => sum + (parseFloat(row.amount) || 0), 0),
    [paymentRows],
  );

  const liveOutstanding = useMemo(
    () => Number(vendor?.outstanding_balance || 0) - liveTotalPaying,
    [vendor, liveTotalPaying],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const validRows = paymentRows.filter((row) => parseFloat(row.amount) > 0);

    if (validRows.length === 0) {
      setError("Please enter at least one payment amount");
      return;
    }

    for (const row of validRows) {
      if (!row.payment_mode) {
        setError("Please select payment mode for all filled rows");
        return;
      }
    }

    setLoading(true);
    try {
      await vendorPaymentService.createPayments(
        vendor!.vendor_id,
        validRows.map((row) => ({
          purchase_id: row.purchase_id,
          amount: parseFloat(row.amount),
          payment_mode: row.payment_mode,
          payment_date: row.payment_date,
          notes: row.notes,
        })),
      );
      toast.success("Payments recorded successfully");
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to record payments");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-4xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Vendor Payment — {vendor?.vendor_name}</DialogTitle>
        </DialogHeader>

        {/* Summary header */}
        <div className='grid grid-cols-2 sm:grid-cols-4 gap-3 py-2'>
          <div className='p-3 rounded-md bg-muted space-y-1'>
            <p className='text-xs text-muted-foreground'>Total Purchases</p>
            <p className='text-sm font-bold text-foreground'>
              ₹{Number(vendor?.total_purchases || 0).toFixed(2)}
            </p>
          </div>
          <div className='p-3 rounded-md bg-muted space-y-1'>
            <p className='text-xs text-muted-foreground'>Amount Paid</p>
            <p className='text-sm font-bold text-green-600'>
              ₹{Number(vendor?.amount_paid || 0).toFixed(2)}
            </p>
          </div>
          <div className='p-3 rounded-md bg-muted space-y-1'>
            <p className='text-xs text-muted-foreground'>Paying Now</p>
            <p className='text-sm font-bold text-blue-600'>
              ₹{liveTotalPaying.toFixed(2)}
            </p>
          </div>
          <div className='p-3 rounded-md bg-muted space-y-1'>
            <p className='text-xs text-muted-foreground'>Outstanding Balance</p>
            <p
              className={`text-sm font-bold ${
                liveOutstanding > 0 ? "text-destructive" : "text-green-600"
              }`}
            >
              ₹{liveOutstanding.toFixed(2)}
            </p>
          </div>
        </div>

        <Separator />

        {fetching ? (
          <div className='py-8 text-center text-muted-foreground text-sm'>
            Loading invoices...
          </div>
        ) : invoices.length === 0 ? (
          <div className='py-8 text-center text-muted-foreground text-sm'>
            No outstanding invoices for this vendor.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className='space-y-4'>
            {/* Column headers */}
            <div className='grid grid-cols-[1.5fr_1fr_1fr_1fr_1.2fr_1fr] gap-2 px-1'>
              <Label className='text-xs text-muted-foreground'>
                Invoice No
              </Label>
              <Label className='text-xs text-muted-foreground'>
                Purchase Date
              </Label>
              <Label className='text-xs text-muted-foreground'>
                Invoice Amount
              </Label>
              <Label className='text-xs text-muted-foreground'>
                Balance Due
              </Label>
              <Label className='text-xs text-muted-foreground'>
                Pay Now (₹)
              </Label>
              <Label className='text-xs text-muted-foreground'>
                Payment Mode
              </Label>
            </div>

            <Separator />

            {/* Invoice rows */}
            <div className='space-y-3 max-h-64 overflow-y-auto pr-1'>
              {invoices.map((invoice, index) => (
                <div key={invoice.purchase_id} className='space-y-2'>
                  <div className='grid grid-cols-[1.5fr_1fr_1fr_1fr_1.2fr_1fr] gap-2 items-center'>
                    {/* Invoice number — disabled */}
                    <code className='text-xs bg-muted px-2 py-2 rounded truncate'>
                      {invoice.invoice_number}
                    </code>

                    {/* Purchase date — disabled */}
                    <span className='text-sm text-muted-foreground'>
                      {new Date(invoice.purchase_date).toLocaleDateString(
                        "en-IN",
                        { day: "2-digit", month: "short", year: "numeric" },
                      )}
                    </span>

                    {/* Invoice amount — disabled */}
                    <span className='text-sm text-foreground font-medium'>
                      ₹{Number(invoice.invoice_amount).toFixed(2)}
                    </span>

                    {/* Balance due — disabled */}
                    <span className='text-sm font-semibold text-destructive'>
                      ₹{Number(invoice.balance_due).toFixed(2)}
                    </span>

                    {/* Pay now — editable */}
                    <Input
                      type='number'
                      min='0'
                      step='0.01'
                      max={Number(invoice.balance_due)}
                      placeholder='0.00'
                      value={paymentRows[index]?.amount || ""}
                      onChange={(e) =>
                        updateRow(index, "amount", e.target.value)
                      }
                    />

                    {/* Payment mode */}
                    <Select
                      value={paymentRows[index]?.payment_mode || ""}
                      onValueChange={(val) =>
                        updateRow(index, "payment_mode", val)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='Mode' />
                      </SelectTrigger>
                      <SelectContent>
                        {PAYMENT_MODES.map((m) => (
                          <SelectItem key={m.value} value={m.value}>
                            <div className='flex items-center gap-2'>
                              {m.label}
                              {ONLINE_MODES.includes(m.value) && (
                                <Badge
                                  variant='secondary'
                                  className='text-xs px-1 py-0'
                                >
                                  Online
                                </Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
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
              <Button type='submit' disabled={loading || liveTotalPaying === 0}>
                {loading
                  ? "Recording..."
                  : `Record Payment ₹${liveTotalPaying.toFixed(2)}`}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
