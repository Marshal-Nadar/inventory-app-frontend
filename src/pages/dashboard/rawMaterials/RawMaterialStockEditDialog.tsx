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
  rawMaterialService,
  type RawMaterial,
} from "@/services/rawMaterialService";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  material: RawMaterial | null;
}

export const RawMaterialStockEditDialog = ({
  open,
  onClose,
  onSuccess,
  material,
}: Props) => {
  const [minStock, setMinStock] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (material) {
      setMinStock(String(material.min_stock || 0));
    }
    setError("");
  }, [material, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (minStock === "" || Number(minStock) < 0) {
      setError("Min stock must be 0 or greater");
      return;
    }
    setLoading(true);
    try {
      await rawMaterialService.updateMinStock(material!.id, Number(minStock));
      toast.success("Stock limit updated");
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update stock limit");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-sm'>
        <DialogHeader>
          <DialogTitle>Set Stock Limit</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className='space-y-4 py-2'>
          {/* Read only info */}
          <div className='p-3 rounded-md bg-muted space-y-1'>
            <p className='text-xs text-muted-foreground'>Raw Material</p>
            <p className='text-sm font-medium text-foreground'>
              {material?.name}
            </p>
            <p className='text-xs text-muted-foreground capitalize'>
              {material?.category} · {material?.metric}
            </p>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='minStock'>Minimum Stock ({material?.metric})</Label>
            <Input
              id='minStock'
              type='number'
              min='0'
              step='0.001'
              value={minStock}
              onChange={(e) => setMinStock(e.target.value)}
              placeholder='e.g. 10'
              required
            />
            <p className='text-xs text-muted-foreground'>
              A low stock alert will show when current stock falls below this
              value.
            </p>
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
              {loading ? "Saving..." : "Set Limit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
