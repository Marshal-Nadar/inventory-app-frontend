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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Plus, X } from "lucide-react";
import { Combobox } from "@/components/common/Combobox";
import { vendorService, type Vendor } from "@/services/vendorService";
import {
  rawMaterialService,
  type RawMaterial,
} from "@/services/rawMaterialService";
import { purchaseService, type Purchase } from "@/services/purchaseService";
import { NumberInput } from "@/components/ui/number-input";

const METRICS = [
  { value: "kg", label: "Kilogram (kg)" },
  { value: "g", label: "Gram (g)" },
  { value: "l", label: "Liter (l)" },
  { value: "ml", label: "Milliliter (ml)" },
  { value: "unit", label: "Unit" },
];

interface ItemRow {
  raw_material_id: string;
  quantity: string;
  metric: string;
  price_per_unit: string;
}

const emptyRow = (): ItemRow => ({
  raw_material_id: "",
  quantity: "",
  metric: "",
  price_per_unit: "",
});

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  purchaseId: number | null;
}

export const PurchaseEditDialog = ({
  open,
  onClose,
  onSuccess,
  purchaseId,
}: Props) => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);

  const [vendorId, setVendorId] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [notes, setNotes] = useState("");
  const [rows, setRows] = useState<ItemRow[]>([emptyRow()]);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState("");

  // load vendors and raw materials once
  useEffect(() => {
    if (open) {
      vendorService.getAll().then(setVendors);
      rawMaterialService.getAll().then(setRawMaterials);
    }
  }, [open]);

  // load purchase data when dialog opens
  useEffect(() => {
    if (open && purchaseId) {
      setFetching(true);
      setError("");
      purchaseService
        .getById(purchaseId)
        .then((data: Purchase) => {
          setVendorId(String(data.vendor_id));
          setInvoiceNumber(data.invoice_number);
          setPurchaseDate(
            new Date(data.purchase_date).toISOString().split("T")[0],
          );
          setNotes(data.notes || "");
          if (data.items && data.items.length > 0) {
            setRows(
              data.items.map((item) => ({
                raw_material_id: String(item.raw_material_id),
                quantity: String(item.quantity),
                metric: item.metric,
                price_per_unit: String(item.price_per_unit),
              })),
            );
          }
        })
        .catch(() => setError("Failed to load purchase data"))
        .finally(() => setFetching(false));
    }
  }, [open, purchaseId]);

  const addRow = () => setRows((prev) => [...prev, emptyRow()]);

  const removeRow = (index: number) => {
    if (rows.length === 1) return;
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const updateRow = (index: number, field: keyof ItemRow, value: string) => {
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    );
  };

  const rowTotal = (row: ItemRow): number => {
    const qty = parseFloat(row.quantity) || 0;
    const price = parseFloat(row.price_per_unit) || 0;
    return parseFloat((qty * price).toFixed(2));
  };

  const overallTotal = rows.reduce((sum, row) => sum + rowTotal(row), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!vendorId) {
      setError("Please select a vendor");
      return;
    }
    if (!invoiceNumber.trim()) {
      setError("Invoice number is required");
      return;
    }
    if (!purchaseDate) {
      setError("Purchase date is required");
      return;
    }

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (
        !row.raw_material_id ||
        !row.quantity ||
        !row.metric ||
        !row.price_per_unit
      ) {
        setError(`Row ${i + 1} — all fields are required`);
        return;
      }
      if (parseFloat(row.quantity) <= 0) {
        setError(`Row ${i + 1} — quantity must be greater than 0`);
        return;
      }
      if (parseFloat(row.price_per_unit) <= 0) {
        setError(`Row ${i + 1} — price must be greater than 0`);
        return;
      }
    }

    setLoading(true);
    try {
      await purchaseService.update(purchaseId!, {
        vendor_id: Number(vendorId),
        invoice_number: invoiceNumber.trim(),
        purchase_date: purchaseDate,
        notes,
        items: rows.map((row) => ({
          raw_material_id: Number(row.raw_material_id),
          quantity: parseFloat(row.quantity),
          metric: row.metric,
          price_per_unit: parseFloat(row.price_per_unit),
          total_cost: rowTotal(row),
        })),
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update purchase");
    } finally {
      setLoading(false);
    }
  };

  const selectedVendor = vendors.find((v) => String(v.id) === vendorId);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-3xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>
            Edit Purchase
            {invoiceNumber && (
              <span className='text-muted-foreground font-normal ml-2 text-sm'>
                — {invoiceNumber}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {fetching ? (
          <div className='py-12 text-center text-muted-foreground text-sm'>
            Loading purchase data...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className='space-y-5 py-2'>
            {/* Header fields */}
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label>Vendor</Label>
                <Combobox
                  options={vendors.map((v) => ({
                    value: String(v.id),
                    label: v.name,
                  }))}
                  value={vendorId}
                  onChange={setVendorId}
                  placeholder='Select vendor'
                  searchPlaceholder='Search vendors...'
                  emptyText='No vendors found.'
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='invoice'>Invoice Number</Label>
                <Input
                  id='invoice'
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder='e.g. INV-2024-001'
                  required
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='editDate'>Purchase Date</Label>
                <input
                  id='editDate'
                  type='date'
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className='flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='editNotes'>
                  Notes
                  <span className='text-xs text-muted-foreground ml-2'>
                    (optional)
                  </span>
                </Label>
                <Input
                  id='editNotes'
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder='e.g. Weekly vegetable purchase'
                />
              </div>
            </div>

            <Separator />

            {/* Line items */}
            <div className='space-y-3'>
              <p className='text-sm font-medium text-foreground'>
                Raw Materials
              </p>

              {/* Column headers */}
              <div className='grid grid-cols-[2fr_1fr_1fr_1fr_1fr_32px] gap-2 px-1'>
                <Label className='text-xs text-muted-foreground'>
                  Raw Material
                </Label>
                <Label className='text-xs text-muted-foreground'>
                  Quantity
                </Label>
                <Label className='text-xs text-muted-foreground'>Metric</Label>
                <Label className='text-xs text-muted-foreground'>
                  Price/Unit (₹)
                </Label>
                <Label className='text-xs text-muted-foreground'>
                  Total (₹)
                </Label>
                <span />
              </div>

              {/* Rows */}
              <div className='space-y-2 max-h-64 overflow-y-auto pr-1'>
                {rows.map((row, index) => (
                  <div
                    key={index}
                    className='grid grid-cols-[2fr_1fr_1fr_1fr_1fr_32px] gap-2 items-center'
                  >
                    <Combobox
                      options={rawMaterials.map((rm) => ({
                        value: String(rm.id),
                        label: `${rm.name} (${rm.category})`,
                      }))}
                      value={row.raw_material_id}
                      onChange={(val) =>
                        updateRow(index, "raw_material_id", val)
                      }
                      placeholder='Select item'
                      searchPlaceholder='Search materials...'
                      emptyText='No materials found.'
                    />

                    <NumberInput
                      min='0'
                      placeholder='0'
                      value={row.quantity}
                      onChange={(value) => updateRow(index, "quantity", value)}
                    />

                    <Select
                      value={row.metric}
                      onValueChange={(val) => updateRow(index, "metric", val)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='Unit' />
                      </SelectTrigger>
                      <SelectContent>
                        {METRICS.map((m) => (
                          <SelectItem key={m.value} value={m.value}>
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <NumberInput
                      min='0'
                      placeholder='0.00'
                      value={row.price_per_unit}
                      onChange={(value) =>
                        updateRow(index, "price_per_unit", value)
                      }
                    />

                    <Input
                      value={
                        rowTotal(row) > 0
                          ? `₹${rowTotal(row).toFixed(2)}`
                          : "₹0.00"
                      }
                      readOnly
                      className='bg-muted text-muted-foreground cursor-not-allowed text-sm font-medium'
                    />

                    <Button
                      type='button'
                      variant='ghost'
                      size='icon'
                      className='w-8 h-8 text-muted-foreground hover:text-destructive'
                      onClick={() => removeRow(index)}
                      disabled={rows.length === 1}
                    >
                      <X className='w-4 h-4' />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Add row */}
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={addRow}
                className='gap-2'
              >
                <Plus className='w-4 h-4' />
                Add Row
              </Button>

              <Separator />

              {/* Overall total */}
              <div className='flex items-center justify-end gap-4'>
                <span className='text-sm font-medium text-foreground'>
                  Overall Total (₹)
                </span>
                <Input
                  value={`₹${overallTotal.toFixed(2)}`}
                  readOnly
                  className='w-40 bg-muted font-bold text-foreground cursor-not-allowed text-right'
                />
              </div>
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
                {loading ? "Saving..." : "Update Purchase"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
