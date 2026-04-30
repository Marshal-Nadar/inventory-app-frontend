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

  const [roles, setRoles] = useState<Role[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [roleId, setRoleId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      roleService.getAll().then(setRoles);
      branchService.getAll().then(setBranches);
    }
  }, [open]);

  useEffect(() => {
    if (editingUser) {
      setName(editingUser.name);
      setEmail(editingUser.email);
      setRoleId(String(editingUser.role_id));
      setBranchId(String(editingUser.branch_id));
      setPassword("");
    } else {
      setName("");
      setEmail("");
      setPassword("");
      setRoleId("");
      setBranchId("");
    }
    setError("");
  }, [editingUser, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      if (isEdit) {
        await onSubmit({
          name,
          email,
          role_id: Number(roleId),
          branch_id: Number(branchId),
        } as UpdateUserPayload);
      } else {
        await onSubmit({
          name,
          email,
          password,
          role_id: Number(roleId),
          branch_id: Number(branchId),
          restaurant_id: authUser!.restaurant_id,
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

          <div className='space-y-2'>
            <Label>Branch</Label>
            <Select value={branchId} onValueChange={setBranchId} required>
              <SelectTrigger>
                <SelectValue placeholder='Select branch' />
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

          <div className='space-y-2'>
            <Label>Role</Label>
            <Select value={roleId} onValueChange={setRoleId} required>
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
