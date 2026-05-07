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
import type { Vendor, VendorPayload } from "@/services/vendorService";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: VendorPayload) => Promise<void>;
  editingVendor?: Vendor | null;
  loading: boolean;
}

export const VendorFormDialog = ({
  open,
  onClose,
  onSubmit,
  editingVendor,
  loading,
}: Props) => {
  const user = useAppSelector((state) => state.auth.user);
  const isSuperAdmin = user?.is_super_admin;
  const isEdit = !!editingVendor;

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
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
    if (editingVendor) {
      setName(editingVendor.name);
      setPhone(editingVendor.phone);
      setAddress(editingVendor.address || "");
      setDescription(editingVendor.description || "");
      setRestaurantId(String(editingVendor.restaurant_id));
    } else {
      setName("");
      setPhone("");
      setAddress("");
      setDescription("");
      setRestaurantId(String(user?.restaurant_id || ""));
    }
    setError("");
  }, [editingVendor, open]);

  // only allow digits, max 10
  const handlePhoneChange = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 10);
    setPhone(digits);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (phone.length !== 10) {
      setError("Phone number must be exactly 10 digits");
      return;
    }

    const finalRestaurantId = isSuperAdmin
      ? Number(restaurantId)
      : user!.restaurant_id!;

    if (isSuperAdmin && !restaurantId) {
      setError("Please select a restaurant");
      return;
    }

    try {
      await onSubmit({
        name,
        phone,
        address,
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
          <DialogTitle>{isEdit ? "Edit Vendor" : "Add New Vendor"}</DialogTitle>
          {!isEdit && (
            <p className='text-sm text-muted-foreground'>
              Add vendor details like name, phone number, and address.
            </p>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4 py-2'>
          {/* Restaurant picker — super admin only */}
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
            <Label htmlFor='name'>Vendor Name</Label>
            <Input
              id='name'
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='e.g. Fresh Farms'
              required
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='phone'>
              Phone Number
              <span className='text-xs text-muted-foreground ml-2'>
                (10 digits)
              </span>
            </Label>
            <div className='relative'>
              <Input
                id='phone'
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder='9876543210'
                inputMode='numeric'
                maxLength={10}
                required
              />
              <span
                className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs
                  ${
                    phone.length === 10
                      ? "text-green-600"
                      : "text-muted-foreground"
                  }`}
              >
                {phone.length}/10
              </span>
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='address'>Address</Label>
            <Input
              id='address'
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder='e.g. Market Yard, Pune'
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='description'>
              Description
              <span className='text-xs text-muted-foreground ml-2'>
                (optional)
              </span>
            </Label>
            <Input
              id='description'
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder='e.g. Vegetable and dairy supplier'
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
              {loading ? "Saving..." : isEdit ? "Update" : "Add Vendor"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
