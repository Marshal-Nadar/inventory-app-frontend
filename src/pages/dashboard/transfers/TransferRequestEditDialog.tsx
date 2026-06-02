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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2 } from "lucide-react";
import { Combobox } from "@/components/common/Combobox";
import {
  transferRequestService,
  type TransferRequest,
} from "@/services/transferRequestService";
import { rawMaterialService } from "@/services/rawMaterialService";
import { toast } from "sonner";
import { NumberInput } from "@/components/ui/number-input";

interface EditableItem {
  raw_material_id: number;
  raw_material_name: string;
  current_stock: number;
  quantity: number;
  metric: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  request: TransferRequest | null;
}

const METRICS = ["kg", "g", "l", "ml", "unit"];

export const TransferRequestEditDialog = ({
  open,
  onClose,
  onSuccess,
  request,
}: Props) => {
  const [items, setItems] = useState<EditableItem[]>([]);
  const [notes, setNotes] = useState("");
  const [rawMaterials, setRawMaterials] = useState<any[]>([]);
  const [selectedRmId, setSelectedRmId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !request) return;

    // populate from existing request
    setNotes(request.notes || "");
    setItems(
      request.items.map((item) => ({
        raw_material_id: item.raw_material_id,
        raw_material_name: item.raw_material_name,
        current_stock: Number(item.current_stock),
        quantity: Number(item.quantity),
        metric: item.metric,
      })),
    );
    setError("");
    setSelectedRmId("");

    // fetch raw materials for adding new items
    rawMaterialService.getAll().then((data) => {
      setRawMaterials(data.filter((rm: any) => rm.is_active));
    });
  }, [open, request]);

  const handleAddItem = () => {
    if (!selectedRmId) return;
    const existing = items.find(
      (item) => String(item.raw_material_id) === selectedRmId,
    );
    if (existing) {
      toast.error("Already in list — adjust quantity instead");
      return;
    }
    const rm = rawMaterials.find((r) => String(r.id) === selectedRmId);
    if (!rm) return;
    setItems((prev) => [
      ...prev,
      {
        raw_material_id: rm.id,
        raw_material_name: rm.name,
        current_stock: Number(rm.current_stock),
        quantity: 1,
        metric: rm.metric,
      },
    ]);
    setSelectedRmId("");
  };

  const updateQty = (index: number, value: string) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        return { ...item, quantity: parseFloat(value) || 0 };
      }),
    );
  };

  const updateMetric = (index: number, value: string) => {
    setItems((prev) =>
      prev.map((item, i) => (i !== index ? item : { ...item, metric: value })),
    );
  };

  const removeItem = (index: number) => {
    if (items.length === 1) {
      toast.error("At least one item is required");
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setError("");

    if (items.length === 0) {
      setError("At least one item is required");
      return;
    }

    for (const item of items) {
      if (item.quantity <= 0) {
        setError(
          `Quantity must be greater than 0 for ${item.raw_material_name}`,
        );
        return;
      }
      if (item.quantity > item.current_stock) {
        setError(
          `${item.raw_material_name}: requested ${item.quantity} but only ${item.current_stock} available`,
        );
        return;
      }
    }

    setSaving(true);
    try {
      await transferRequestService.update(request!.id, {
        items: items.map((item) => ({
          raw_material_id: item.raw_material_id,
          quantity: item.quantity,
          metric: item.metric,
        })),
        notes,
      });
      toast.success("Transfer request updated");
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update request");
    } finally {
      setSaving(false);
    }
  };

  if (!request) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>
            Edit Transfer Request
            <span className='text-muted-foreground font-normal text-sm ml-2'>
              — #{request.id}
            </span>
          </DialogTitle>
          <p className='text-xs text-muted-foreground'>
            Branch: {request.branch_name}
          </p>
        </DialogHeader>

        <div className='space-y-4 py-2'>
          {/* Add item */}
          <div className='flex gap-3 items-end'>
            <div className='flex-1 space-y-2'>
              <Label>Add Raw Material</Label>
              <Combobox
                options={rawMaterials
                  .filter(
                    (rm) =>
                      !items.find((item) => item.raw_material_id === rm.id),
                  )
                  .map((rm) => ({
                    value: String(rm.id),
                    label: `${rm.name} (${rm.current_stock} ${rm.metric} available)`,
                  }))}
                value={selectedRmId}
                onChange={setSelectedRmId}
                placeholder='Select raw material'
                searchPlaceholder='Search...'
                emptyText='No materials available.'
              />
            </div>
            <Button
              type='button'
              variant='outline'
              onClick={handleAddItem}
              className='gap-2'
            >
              <Plus className='w-4 h-4' />
              Add
            </Button>
          </div>

          <Separator />

          {/* Items list */}
          <div className='space-y-3'>
            {items.map((item, index) => (
              <div
                key={index}
                className='flex items-center gap-3 p-3 rounded-lg border bg-muted/30'
              >
                <div className='flex-1 min-w-0'>
                  <p className='text-sm font-medium text-foreground truncate'>
                    {item.raw_material_name}
                  </p>
                  <p className='text-xs text-muted-foreground'>
                    Available: {item.current_stock} {item.metric}
                  </p>
                </div>

                {/* Quantity */}
                <div className='w-28 space-y-1'>
                  <Label className='text-xs'>Quantity</Label>
                  <Input
                    type='number'
                    min='0.001'
                    step='0.001'
                    max={item.current_stock}
                    value={item.quantity}
                    onChange={(e) => updateQty(index, e.target.value)}
                    className={
                      item.quantity > item.current_stock
                        ? "border-destructive"
                        : ""
                    }
                  />
                  {/* <NumberInput
                    min='0.001'
                    value={item.quantity}
                    onChange={(value) => updateQty(index, value)}
                    className={
                      item.quantity > item.current_stock
                        ? "border-destructive"
                        : ""
                    }
                  /> */}
                </div>

                {/* Metric */}
                <div className='w-24 space-y-1'>
                  <Label className='text-xs'>Metric</Label>
                  <select
                    value={item.metric}
                    onChange={(e) => updateMetric(index, e.target.value)}
                    className='w-full h-9 rounded-md border border-input bg-background px-3 text-sm'
                  >
                    {METRICS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Stock warning */}
                {item.quantity > item.current_stock && (
                  <Badge
                    variant='outline'
                    className='text-xs text-destructive border-destructive/40'
                  >
                    Exceeds stock
                  </Badge>
                )}

                <Button
                  type='button'
                  variant='ghost'
                  size='icon'
                  className='w-8 h-8 text-destructive hover:text-destructive flex-shrink-0'
                  onClick={() => removeItem(index)}
                >
                  <Trash2 className='w-4 h-4' />
                </Button>
              </div>
            ))}
          </div>

          {/* Notes */}
          <div className='space-y-2'>
            <Label>Notes</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder='Optional notes...'
            />
          </div>

          {error && (
            <p className='text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md'>
              {error}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
