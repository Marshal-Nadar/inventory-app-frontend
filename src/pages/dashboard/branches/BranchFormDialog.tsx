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
import type { Branch } from "@/services/branchService";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    address: string;
    phone: string;
  }) => Promise<void>;
  editingBranch?: Branch | null;
  loading: boolean;
}

export const BranchFormDialog = ({
  open,
  onClose,
  onSubmit,
  editingBranch,
  loading,
}: Props) => {
  const isEdit = !!editingBranch;

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (editingBranch) {
      setName(editingBranch.name);
      setAddress(editingBranch.address || "");
      setPhone(editingBranch.phone || "");
    } else {
      setName("");
      setAddress("");
      setPhone("");
    }
    setError("");
  }, [editingBranch, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await onSubmit({ name, address, phone });
    } catch (err: any) {
      setError(err.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Branch" : "Create Branch"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4 py-2'>
          <div className='space-y-2'>
            <Label htmlFor='name'>Branch Name</Label>
            <Input
              id='name'
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='Andheri Branch'
              required
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='address'>Address</Label>
            <Input
              id='address'
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder='Shop 4, Andheri West, Mumbai'
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='phone'>Phone</Label>
            <Input
              id='phone'
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder='9876543210'
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
