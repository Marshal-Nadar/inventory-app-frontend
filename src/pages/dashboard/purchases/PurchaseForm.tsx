import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Plus, X, ShoppingCart } from "lucide-react";
import { vendorService, type Vendor } from "@/services/vendorService";
import {
  rawMaterialService,
  type RawMaterial,
} from "@/services/rawMaterialService";
import {
  restaurantService,
  type Restaurant,
} from "@/services/restaurantService";
import {
  purchaseService,
  type PurchaseItemPayload,
} from "@/services/purchaseService";
import { useAppSelector } from "@/hooks/useAppSelector";
import { toast } from "sonner";
import { Combobox } from "@/components/common/Combobox";

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

export const PurchaseForm = () => {
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const isSuperAdmin = user?.is_super_admin;

  // header state
  const [purchaseDate, setPurchaseDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [vendorId, setVendorId] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [restaurantId, setRestaurantId] = useState(
    String(user?.restaurant_id || ""),
  );

  // data
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [storageRoomName, setStorageRoomName] = useState("Main Store");

  // line items
  const [rows, setRows] = useState<ItemRow[]>([emptyRow()]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    vendorService.getAll().then(setVendors);
    rawMaterialService.getAll().then(setRawMaterials);

    if (isSuperAdmin) {
      restaurantService
        .getAll()
        .then((data) => setRestaurants(data.filter((r) => r.is_active)));
    } else {
      // fetch restaurant to get storage_room_name
      if (user?.restaurant_id) {
        restaurantService.getAll().then((data) => {
          const r = data.find((r) => r.id === user.restaurant_id);
          if (r)
            setStorageRoomName((r as any).storage_room_name || "Main Store");
        });
      }
    }
  }, []);

  // when super admin selects restaurant — update storage room name
  useEffect(() => {
    if (isSuperAdmin && restaurantId) {
      const r = restaurants.find((r) => String(r.id) === restaurantId);
      if (r) setStorageRoomName((r as any).storage_room_name || "Main Store");
    }
  }, [restaurantId, restaurants]);

  const addRow = () => setRows((prev) => [...prev, emptyRow()]);

  const removeRow = (index: number) =>
    setRows((prev) => prev.filter((_, i) => i !== index));

  const updateRow = (index: number, field: keyof ItemRow, value: string) => {
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    );
  };

  // calculate row total
  const rowTotal = (row: ItemRow): number => {
    const qty = parseFloat(row.quantity) || 0;
    const price = parseFloat(row.price_per_unit) || 0;
    return parseFloat((qty * price).toFixed(2));
  };

  // overall total
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
    if (isSuperAdmin && !restaurantId) {
      setError("Please select a restaurant");
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

    const items: PurchaseItemPayload[] = rows.map((row) => ({
      raw_material_id: Number(row.raw_material_id),
      quantity: parseFloat(row.quantity),
      metric: row.metric,
      price_per_unit: parseFloat(row.price_per_unit),
      total_cost: rowTotal(row),
    }));

    setLoading(true);
    try {
      await purchaseService.create({
        vendor_id: Number(vendorId),
        invoice_number: invoiceNumber.trim(),
        purchase_date: purchaseDate,
        notes,
        items,
        restaurant_id: isSuperAdmin ? Number(restaurantId) : undefined,
      });
      toast.success("Purchase recorded successfully");
      navigate("/dashboard/purchases");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create purchase");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='space-y-6 max-w-4xl'>
      {/* Page header */}
      <div>
        <h2 className='text-xl font-bold text-foreground'>New Purchase</h2>
        <p className='text-sm text-muted-foreground mt-1'>
          Record a new purchase from a vendor.
        </p>
      </div>

      <form onSubmit={handleSubmit} className='space-y-6'>
        {/* Purchase header card */}
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='text-base'>Purchase Details</CardTitle>
          </CardHeader>
          <CardContent className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            {/* Super admin restaurant picker */}
            {isSuperAdmin && (
              <div className='space-y-2 sm:col-span-2'>
                <Label>Restaurant</Label>
                <Combobox
                  options={restaurants.map((r) => ({
                    value: String(r.id),
                    label: r.name,
                  }))}
                  value={restaurantId}
                  onChange={setRestaurantId}
                  placeholder='Select restaurant'
                  searchPlaceholder='Search restaurants...'
                  emptyText='No restaurants found.'
                />
              </div>
            )}

            {/* Date */}
            <div className='space-y-2'>
              <Label htmlFor='date'>Purchase Date</Label>
              <Input
                id='date'
                type='date'
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                required
              />
            </div>

            {/* Vendor */}
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

            {/* Invoice number */}
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

            {/* Storage room — read only */}
            <div className='space-y-2'>
              <Label>Destination Storage Room</Label>
              <Input
                value={storageRoomName}
                readOnly
                className='bg-muted text-muted-foreground cursor-not-allowed'
              />
            </div>

            {/* Notes */}
            <div className='space-y-2 sm:col-span-2'>
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
                placeholder='e.g. Weekly vegetable purchase'
              />
            </div>
          </CardContent>
        </Card>

        {/* Line items card */}
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='text-base'>Raw Materials</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            {/* Column headers */}
            <div className='grid grid-cols-[2fr_1fr_1fr_1fr_1fr_32px] gap-2 px-1'>
              <Label className='text-xs text-muted-foreground'>
                Raw Material
              </Label>
              <Label className='text-xs text-muted-foreground'>Quantity</Label>
              <Label className='text-xs text-muted-foreground'>Metric</Label>
              <Label className='text-xs text-muted-foreground'>
                Price/Unit (₹)
              </Label>
              <Label className='text-xs text-muted-foreground'>Total (₹)</Label>
              <span />
            </div>

            {/* Rows */}
            <div className='space-y-2 max-h-80 overflow-y-auto pr-1'>
              {rows.map((row, index) => (
                <div
                  key={index}
                  className='grid grid-cols-[2fr_1fr_1fr_1fr_1fr_32px] gap-2 items-center'
                >
                  {/* Raw material */}
                  <Combobox
                    options={rawMaterials.map((rm) => ({
                      value: String(rm.id),
                      label: `${rm.name} (${rm.category})`,
                    }))}
                    value={row.raw_material_id}
                    onChange={(val) => updateRow(index, "raw_material_id", val)}
                    placeholder='Select item'
                    searchPlaceholder='Search materials...'
                    emptyText='No materials found.'
                  />

                  {/* Quantity */}
                  <Input
                    type='number'
                    min='0'
                    step='0.001'
                    placeholder='0'
                    value={row.quantity}
                    onChange={(e) =>
                      updateRow(index, "quantity", e.target.value)
                    }
                  />

                  {/* Metric */}
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

                  {/* Price per unit */}
                  <Input
                    type='number'
                    min='0'
                    step='0.01'
                    placeholder='0.00'
                    value={row.price_per_unit}
                    onChange={(e) =>
                      updateRow(index, "price_per_unit", e.target.value)
                    }
                  />

                  {/* Total cost — disabled */}
                  <Input
                    value={
                      rowTotal(row) > 0
                        ? `₹${rowTotal(row).toFixed(2)}`
                        : "₹0.00"
                    }
                    readOnly
                    className='bg-muted text-muted-foreground cursor-not-allowed text-sm font-medium'
                  />

                  {/* Remove row */}
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
                Overall Total Cost (₹)
              </span>
              <Input
                value={`₹${overallTotal.toFixed(2)}`}
                readOnly
                className='w-40 bg-muted font-bold text-foreground cursor-not-allowed text-right'
              />
            </div>
          </CardContent>
        </Card>

        {error && (
          <p className='text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md'>
            {error}
          </p>
        )}

        {/* Form actions */}
        <div className='flex items-center gap-3'>
          <Button type='submit' disabled={loading} className='gap-2'>
            <ShoppingCart className='w-4 h-4' />
            {loading ? "Saving..." : "Submit Purchase"}
          </Button>
          <Button
            type='button'
            variant='outline'
            onClick={() => navigate("/dashboard/purchases")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};
