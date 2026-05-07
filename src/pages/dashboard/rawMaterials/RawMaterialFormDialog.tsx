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
import { Plus, X } from "lucide-react";
import {
  restaurantService,
  type Restaurant,
} from "@/services/restaurantService";
import { useAppSelector } from "@/hooks/useAppSelector";
import type {
  RawMaterial,
  RawMaterialItem,
} from "@/services/rawMaterialService";

const METRICS = [
  { value: "kg", label: "Kilograms (kg)" },
  { value: "g", label: "Grams (g)" },
  { value: "l", label: "Liter (l)" },
  { value: "ml", label: "Milliliter (ml)" },
  { value: "unit", label: "Unit" },
];

const emptyRow = (): RawMaterialItem => ({
  category: "",
  name: "",
  metric: "",
});

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmitCreate: (
    items: RawMaterialItem[],
    restaurantId?: number,
  ) => Promise<void>;
  onSubmitUpdate: (id: number, item: RawMaterialItem) => Promise<void>;
  editingMaterial?: RawMaterial | null;
  loading: boolean;
}

export const RawMaterialFormDialog = ({
  open,
  onClose,
  onSubmitCreate,
  onSubmitUpdate,
  editingMaterial,
  loading,
}: Props) => {
  const user = useAppSelector((state) => state.auth.user);
  const isSuperAdmin = user?.is_super_admin;
  const isEdit = !!editingMaterial;

  const [rows, setRows] = useState<RawMaterialItem[]>([emptyRow()]);
  const [restaurantId, setRestaurantId] = useState("");
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open && isSuperAdmin) {
      restaurantService
        .getAll()
        .then((data) => setRestaurants(data.filter((r) => r.is_active)));
    }
  }, [open, isSuperAdmin]);

  useEffect(() => {
    if (editingMaterial) {
      setRows([
        {
          category: editingMaterial.category,
          name: editingMaterial.name,
          metric: editingMaterial.metric,
        },
      ]);
      setRestaurantId(String(editingMaterial.restaurant_id));
    } else {
      setRows([emptyRow()]);
      setRestaurantId(String(user?.restaurant_id || ""));
    }
    setError("");
  }, [editingMaterial, open]);

  const addRow = () => setRows((prev) => [...prev, emptyRow()]);

  const removeRow = (index: number) =>
    setRows((prev) => prev.filter((_, i) => i !== index));

  const updateRow = (
    index: number,
    field: keyof RawMaterialItem,
    value: string,
  ) => {
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // validate all rows
    for (const row of rows) {
      if (!row.category.trim() || !row.name.trim() || !row.metric) {
        setError("All fields are required for each row");
        return;
      }
    }

    try {
      if (isEdit && editingMaterial) {
        await onSubmitUpdate(editingMaterial.id, rows[0]);
      } else {
        const finalRestaurantId = isSuperAdmin
          ? Number(restaurantId)
          : undefined;

        if (isSuperAdmin && !restaurantId) {
          setError("Please select a restaurant");
          return;
        }

        await onSubmitCreate(rows, finalRestaurantId);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-2xl'>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Raw Material" : "Add Raw Materials"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4 py-2'>
          {/* Restaurant picker for super admin */}
          {isSuperAdmin && !isEdit && (
            <div className='space-y-2'>
              <Label>Restaurant</Label>
              <Select value={restaurantId} onValueChange={setRestaurantId}>
                <SelectTrigger>
                  <SelectValue placeholder='Select restaurant' />
                </SelectTrigger>
                <SelectContent>
                  {restaurants.map((r) => (
                    <SelectItem key={r.id} value={String(r.id)}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Column headers */}
          <div className='grid grid-cols-[1fr_1fr_140px_32px] gap-2 px-1'>
            <Label className='text-xs text-muted-foreground'>Category</Label>
            <Label className='text-xs text-muted-foreground'>
              Raw Material Name
            </Label>
            <Label className='text-xs text-muted-foreground'>Metric</Label>
            <span />
          </div>

          {/* Rows */}
          <div className='space-y-2 max-h-72 overflow-y-auto pr-1'>
            {rows.map((row, index) => (
              <div
                key={index}
                className='grid grid-cols-[1fr_1fr_140px_32px] gap-2 items-center'
              >
                <Input
                  placeholder='e.g. Vegetables'
                  value={row.category}
                  onChange={(e) => updateRow(index, "category", e.target.value)}
                />
                <Input
                  placeholder='e.g. Tomato'
                  value={row.name}
                  onChange={(e) => updateRow(index, "name", e.target.value)}
                />
                <Select
                  value={row.metric}
                  onValueChange={(val) => updateRow(index, "metric", val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Metric' />
                  </SelectTrigger>
                  <SelectContent>
                    {METRICS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Remove row button */}
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

          {/* Add row button — hidden in edit mode */}
          {!isEdit && (
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
          )}

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
              {loading
                ? "Saving..."
                : isEdit
                  ? "Update"
                  : `Add ${rows.length > 1 ? `${rows.length} Items` : "Item"}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
