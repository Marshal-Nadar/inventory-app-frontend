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
import { Combobox } from "@/components/common/Combobox";
import {
  rawMaterialService,
  type RawMaterial,
} from "@/services/rawMaterialService";
import { transferRequestService } from "@/services/transferRequestService";
import { useAppSelector } from "@/hooks/useAppSelector";
import { toast } from "sonner";
import { ArrowLeftRight, Plus, X } from "lucide-react";
import { StockBadge } from "@/components/common/StockBadge";
import { Separator } from "@/components/ui/separator";

const METRICS = [
  { value: "kg", label: "Kilogram (kg)" },
  { value: "g", label: "Gram (g)" },
  { value: "l", label: "Liter (l)" },
  { value: "ml", label: "Milliliter (ml)" },
  { value: "unit", label: "Unit" },
];

interface RequestRow {
  raw_material_id: string;
  quantity: string;
  metric: string;
}

const emptyRow = (): RequestRow => ({
  raw_material_id: "",
  quantity: "",
  metric: "",
});

export const NewTransferRequestPage = () => {
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);

  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [rows, setRows] = useState<RequestRow[]>([emptyRow()]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    rawMaterialService.getAll().then((data) => {
      setRawMaterials(data.filter((rm) => Number(rm.current_stock) > 0));
    });
  }, []);

  const addRow = () => setRows((prev) => [...prev, emptyRow()]);

  const removeRow = (index: number) =>
    setRows((prev) => prev.filter((_, i) => i !== index));

  const updateRow = (index: number, field: keyof RequestRow, value: string) => {
    setRows((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row;
        const updated = { ...row, [field]: value };
        // auto set metric when raw material selected
        if (field === "raw_material_id") {
          const rm = rawMaterials.find((m) => String(m.id) === value);
          if (rm) updated.metric = rm.metric;
        }
        return updated;
      }),
    );
  };

  const getSelectedMaterial = (rawMaterialId: string) =>
    rawMaterials.find((rm) => String(rm.id) === rawMaterialId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row.raw_material_id) {
        setError(`Row ${i + 1} — please select a raw material`);
        return;
      }
      if (!row.quantity || Number(row.quantity) <= 0) {
        setError(`Row ${i + 1} — quantity must be greater than 0`);
        return;
      }
      if (!row.metric) {
        setError(`Row ${i + 1} — please select a metric`);
        return;
      }
      const material = getSelectedMaterial(row.raw_material_id);
      if (material && Number(row.quantity) > Number(material.current_stock)) {
        setError(
          `Row ${i + 1} — ${material.name}: requested ${row.quantity} exceeds available stock (${material.current_stock} ${material.metric})`,
        );
        return;
      }
    }

    setLoading(true);
    try {
      await transferRequestService.create({
        items: rows.map((row) => ({
          raw_material_id: Number(row.raw_material_id),
          quantity: Number(row.quantity),
          metric: row.metric,
        })),
        notes,
      });
      toast.success("Transfer request submitted successfully");
      navigate("/dashboard/transfers");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to submit request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='space-y-6 max-w-3xl'>
      <div>
        <h2 className='text-xl font-bold text-foreground'>
          New Transfer Request
        </h2>
        <p className='text-sm text-muted-foreground mt-1'>
          Request raw materials from the store for your branch.
        </p>
      </div>

      {/* Branch info */}
      <div className='flex items-center gap-2 p-3 rounded-md bg-muted text-sm text-muted-foreground'>
        <ArrowLeftRight className='w-4 h-4 flex-shrink-0' />
        <span>
          Requesting for:{" "}
          <span className='font-medium text-foreground'>{user?.branch}</span>
        </span>
      </div>

      <form onSubmit={handleSubmit} className='space-y-6'>
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
            <div className='space-y-3'>
              {rows.map((row, index) => {
                const selectedMaterial = getSelectedMaterial(
                  row.raw_material_id,
                );
                return (
                  <div key={index} className='space-y-1'>
                    <div className='grid grid-cols-[2fr_1fr_1fr_1fr_1fr_32px] gap-2 items-center'>
                      <Combobox
                        options={rawMaterials.map((rm) => ({
                          value: String(rm.id),
                          label: `${rm.name} (${rm.category})`,
                        }))}
                        value={row.raw_material_id}
                        onChange={(val) =>
                          updateRow(index, "raw_material_id", val)
                        }
                        placeholder='Select material'
                        searchPlaceholder='Search...'
                        emptyText='No materials available.'
                      />
                      <Input
                        type='number'
                        min='0.001'
                        step='0.001'
                        placeholder='0'
                        value={row.quantity}
                        onChange={(e) =>
                          updateRow(index, "quantity", e.target.value)
                        }
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

                      {/* Price per unit — from avg_price, disabled */}
                      <Input
                        value={
                          selectedMaterial &&
                          Number(selectedMaterial.avg_price) > 0
                            ? `₹${Number(selectedMaterial.avg_price).toFixed(2)}`
                            : "—"
                        }
                        readOnly
                        className='bg-muted text-muted-foreground cursor-not-allowed text-sm'
                      />

                      {/* Row total — qty * avg_price, disabled */}
                      <Input
                        value={
                          selectedMaterial &&
                          Number(selectedMaterial.avg_price) > 0 &&
                          Number(row.quantity) > 0
                            ? `₹${(Number(row.quantity) * Number(selectedMaterial.avg_price)).toFixed(2)}`
                            : "—"
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

                    {/* Show available stock for selected material */}
                    {selectedMaterial && (
                      <div className='ml-1'>
                        <StockBadge
                          currentStock={Number(selectedMaterial.current_stock)}
                          minStock={Number(selectedMaterial.min_stock)}
                          metric={selectedMaterial.metric}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
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

            {/* Overall total */}
            {rows.some((row) => {
              const m = getSelectedMaterial(row.raw_material_id);
              return m && Number(m.avg_price) > 0 && Number(row.quantity) > 0;
            }) && (
              <>
                <Separator />
                <div className='flex items-center justify-end gap-4'>
                  <span className='text-sm font-medium text-foreground'>
                    Overall Total (₹)
                  </span>
                  <Input
                    value={`₹${rows
                      .reduce((sum, row) => {
                        const m = getSelectedMaterial(row.raw_material_id);
                        if (!m || !row.quantity) return sum;
                        return sum + Number(row.quantity) * Number(m.avg_price);
                      }, 0)
                      .toFixed(2)}`}
                    readOnly
                    className='w-40 bg-muted font-bold text-foreground cursor-not-allowed text-right'
                  />
                </div>
              </>
            )}

            <Separator />

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
                placeholder='e.g. Need for tonight service'
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
            <ArrowLeftRight className='w-4 h-4' />
            {loading
              ? "Submitting..."
              : `Submit Request (${rows.length} item${rows.length > 1 ? "s" : ""})`}
          </Button>
          <Button
            type='button'
            variant='outline'
            onClick={() => navigate("/dashboard/transfers")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};
