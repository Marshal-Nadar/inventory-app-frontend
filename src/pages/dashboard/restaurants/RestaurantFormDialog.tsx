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
import type { Restaurant } from "@/services/restaurantService";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    slug: string;
    timezone: string;
  }) => Promise<void>;
  editingRestaurant?: Restaurant | null;
  loading: boolean;
}

export const RestaurantFormDialog = ({
  open,
  onClose,
  onSubmit,
  editingRestaurant,
  loading,
}: Props) => {
  const isEdit = !!editingRestaurant;

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [error, setError] = useState("");

  useEffect(() => {
    if (editingRestaurant) {
      setName(editingRestaurant.name);
      setSlug(editingRestaurant.slug);
      setTimezone(editingRestaurant.timezone);
    } else {
      setName("");
      setSlug("");
      setTimezone("Asia/Kolkata");
    }
    setError("");
  }, [editingRestaurant, open]);

  // auto generate slug from name
  const handleNameChange = (value: string) => {
    setName(value);
    if (!isEdit) {
      setSlug(
        value
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-"),
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await onSubmit({ name, slug, timezone });
    } catch (err: any) {
      setError(err.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Restaurant" : "Create Restaurant"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4 py-2'>
          <div className='space-y-2'>
            <Label htmlFor='name'>Restaurant Name</Label>
            <Input
              id='name'
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder='Max Restaurant'
              required
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='slug'>
              Slug
              <span className='text-xs text-muted-foreground ml-2'>
                (auto-generated)
              </span>
            </Label>
            <Input
              id='slug'
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder='max-restaurant'
              required
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='timezone'>Timezone</Label>
            <Input
              id='timezone'
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              placeholder='Asia/Kolkata'
              required
            />
            <p className='text-xs text-muted-foreground'>
              e.g. Asia/Kolkata, Asia/Dubai, America/New_York
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
              {loading ? "Saving..." : isEdit ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
