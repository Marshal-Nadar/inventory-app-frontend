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
import {
  restaurantService,
  type Restaurant,
} from "@/services/restaurantService";
import { useAppSelector } from "@/hooks/useAppSelector";
import type { Role } from "@/services/roleService";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    description: string;
    restaurant_id: number;
  }) => Promise<void>;
  editingRole?: Role | null;
  loading: boolean;
}

export const RoleFormDialog = ({
  open,
  onClose,
  onSubmit,
  editingRole,
  loading,
}: Props) => {
  const user = useAppSelector((state) => state.auth.user);
  const isSuperAdmin = user?.is_super_admin;
  const isEdit = !!editingRole;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [restaurantId, setRestaurantId] = useState(
    String(user?.restaurant_id || ""),
  );
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
    if (editingRole) {
      setName(editingRole.name);
      setDescription(editingRole.description || "");
      setRestaurantId(String(editingRole.restaurant_id));
    } else {
      setName("");
      setDescription("");
      setRestaurantId(String(user?.restaurant_id || ""));
    }
    setError("");
  }, [editingRole, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // for non super admin use their restaurant_id directly
    const finalRestaurantId = isSuperAdmin ? Number(restaurantId) : user?.id;

    if (!finalRestaurantId) {
      setError("Please select a restaurant");
      return;
    }

    try {
      await onSubmit({
        name,
        description,
        restaurant_id: finalRestaurantId,
      });
    } catch (err: any) {
      setError(err.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Role" : "Create Role"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4 py-2'>
          {/* Restaurant selector — only for super admin */}
          {isSuperAdmin && (
            <div className='space-y-2'>
              <Label>Restaurant</Label>
              <Select
                value={restaurantId}
                onValueChange={setRestaurantId}
                disabled={isEdit}
              >
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

          <div className='space-y-2'>
            <Label htmlFor='name'>Role Name</Label>
            <Input
              id='name'
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='e.g. supervisor'
              required
            />
            <p className='text-xs text-muted-foreground'>
              Use lowercase, no spaces. e.g. cashier, supervisor, kitchen
            </p>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='description'>Description</Label>
            <Input
              id='description'
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder='What can this role do?'
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
              {loading ? "Saving..." : isEdit ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
