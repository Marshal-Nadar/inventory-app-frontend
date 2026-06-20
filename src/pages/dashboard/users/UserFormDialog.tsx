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
import { roleService, type Role } from "@/services/roleService";
import { branchService, type Branch } from "@/services/branchService";
import {
  restaurantService,
  type Restaurant,
} from "@/services/restaurantService";
import type {
  User,
  CreateUserPayload,
  UpdateUserPayload,
} from "@/services/userService";
import { useAppSelector } from "@/hooks/useAppSelector";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateUserPayload | UpdateUserPayload) => Promise<void>;
  editingUser?: User | null;
  loading: boolean;
}

export const UserFormDialog = ({
  open,
  onClose,
  onSubmit,
  editingUser,
  loading,
}: Props) => {
  const authUser = useAppSelector((state) => state.auth.user);
  const isEdit = !!editingUser;
  const isSuperAdmin = authUser?.is_super_admin;

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [restaurantId, setRestaurantId] = useState("");
  const [roleId, setRoleId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [error, setError] = useState("");

  // load restaurants — super admin only
  useEffect(() => {
    if (open && isSuperAdmin) {
      restaurantService.getAll().then(setRestaurants);
    }
  }, [open, isSuperAdmin]);

  // determine effective restaurant id
  const effectiveRestaurantId = isSuperAdmin
    ? restaurantId
    : String(authUser?.restaurant_id || "");

  // load roles + branches whenever effective restaurant changes
  useEffect(() => {
    if (!open) return;
    if (!effectiveRestaurantId) {
      setRoles([]);
      setBranches([]);
      return;
    }

    roleService.getByRestaurant(Number(effectiveRestaurantId)).then(setRoles);
    branchService
      .getAll()
      .then((data) =>
        setBranches(
          data.filter(
            (b) =>
              b.is_active && String(b.restaurant_id) === effectiveRestaurantId,
          ),
        ),
      );
  }, [open, effectiveRestaurantId]);

  useEffect(() => {
    if (editingUser) {
      setName(editingUser.name);
      setEmail(editingUser.email);
      setRoleId(String(editingUser.role_id));
      setBranchId(editingUser.branch_id ? String(editingUser.branch_id) : "");
      setRestaurantId(String(editingUser.restaurant_id));
      setPassword("");
    } else {
      setName("");
      setEmail("");
      setPassword("");
      setRoleId("");
      setBranchId("");
      setRestaurantId("");
    }
    setError("");
  }, [editingUser, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (isSuperAdmin && !restaurantId) {
      setError("Please select a restaurant");
      return;
    }
    if (!roleId) {
      setError("Please select a role");
      return;
    }

    try {
      if (isEdit) {
        await onSubmit({
          name,
          email,
          role_id: Number(roleId),
          branch_id: branchId ? Number(branchId) : null,
        } as UpdateUserPayload);
      } else {
        await onSubmit({
          name,
          email,
          password,
          role_id: Number(roleId),
          branch_id: branchId ? Number(branchId) : null,
          restaurant_id: isSuperAdmin
            ? Number(restaurantId)
            : authUser!.restaurant_id,
        } as CreateUserPayload);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit User" : "Create User"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4 py-2'>
          {/* Restaurant — super admin only, create only */}
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

          <div className='space-y-2'>
            <Label htmlFor='name'>Full Name</Label>
            <Input
              id='name'
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='Tamil Selvan'
              required
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='email'>Email</Label>
            <Input
              id='email'
              type='email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder='tamil@max.com'
              required
            />
          </div>

          {!isEdit && (
            <div className='space-y-2'>
              <Label htmlFor='password'>Password</Label>
              <Input
                id='password'
                type='password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder='••••••••'
                required
              />
            </div>
          )}

          {/* Branch — optional */}
          <div className='space-y-2'>
            <Label>
              Branch
              <span className='text-xs text-muted-foreground ml-2'>
                (optional — leave empty for restaurant admin)
              </span>
            </Label>
            <Select value={branchId} onValueChange={setBranchId}>
              <SelectTrigger>
                <SelectValue placeholder='No branch (Restaurant Admin)' />
              </SelectTrigger>
              <SelectContent>
                {branches.map((b) => (
                  <SelectItem key={b.id} value={String(b.id)}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Role */}
          <div className='space-y-2'>
            <Label>Role</Label>
            <Select value={roleId} onValueChange={setRoleId}>
              <SelectTrigger>
                <SelectValue placeholder='Select role' />
              </SelectTrigger>
              <SelectContent>
                {roles.map((r) => (
                  <SelectItem key={r.id} value={String(r.id)}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
