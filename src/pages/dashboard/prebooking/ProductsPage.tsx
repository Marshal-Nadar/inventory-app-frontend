import { useEffect, useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search,
  ArrowUpDown,
  MoreHorizontal,
  Pencil,
  Trash2,
  Package,
} from "lucide-react";
import { productService, type Product } from "@/services/productService";
import { DeleteConfirmDialog } from "@/components/common/DeleteConfirmDialog";
import { useAppSelector } from "@/hooks/useAppSelector";
import { toast } from "sonner";

const columnHelper = createColumnHelper<Product>();

const PERMITTED_ROLES = ["admin", "storekeeper"];

export const ProductsPage = () => {
  const user = useAppSelector((state) => state.auth.user);
  const canMutate =
    user?.is_super_admin || PERMITTED_ROLES.includes(user?.role || "");

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);

  // form
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [isActive, setIsActive] = useState("true");
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  // delete
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await productService.getAll();
      setProducts(data);
    } catch {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const openForm = (product?: Product) => {
    setEditingProduct(product || null);
    setName(product?.name || "");
    setPrice(product ? String(product.price) : "");
    setIsActive(product ? String(product.is_active) : "true");
    setFormError("");
    setFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!name.trim()) {
      setFormError("Product name is required");
      return;
    }
    if (!price || Number(price) <= 0) {
      setFormError("Price must be greater than 0");
      return;
    }

    setFormLoading(true);
    try {
      if (editingProduct) {
        await productService.update(editingProduct.id, {
          name: name.trim(),
          price: Number(price),
          is_active: isActive === "true",
        });
        toast.success("Product updated");
      } else {
        await productService.create({
          name: name.trim(),
          price: Number(price),
          is_active: isActive === "true",
        });
        toast.success("Product added");
      }
      await fetchProducts();
      setFormOpen(false);
    } catch (err: any) {
      setFormError(err.response?.data?.message || "Failed to save product");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingProduct) return;
    setDeleteLoading(true);
    try {
      await productService.delete(deletingProduct.id);
      toast.success("Product deleted");
      await fetchProducts();
      setDeleteOpen(false);
      setDeletingProduct(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete product");
    } finally {
      setDeleteLoading(false);
    }
  };

  const filtered = useMemo(
    () =>
      products.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [products, search],
  );

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "serial",
        header: "#",
        cell: ({ row }) => (
          <span className='text-sm text-muted-foreground'>{row.index + 1}</span>
        ),
      }),
      columnHelper.accessor("name", {
        header: ({ column }) => (
          <Button
            variant='ghost'
            size='sm'
            onClick={() => column.toggleSorting()}
            className='gap-1 px-0 font-medium'
          >
            Product Name <ArrowUpDown className='w-3.5 h-3.5' />
          </Button>
        ),
        cell: (info) => (
          <span className='font-medium text-foreground'>{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor("price", {
        header: ({ column }) => (
          <Button
            variant='ghost'
            size='sm'
            onClick={() => column.toggleSorting()}
            className='gap-1 px-0 font-medium'
          >
            Price <ArrowUpDown className='w-3.5 h-3.5' />
          </Button>
        ),
        cell: (info) => (
          <span className='font-semibold text-foreground'>
            ₹{Number(info.getValue()).toFixed(2)}
          </span>
        ),
      }),
      columnHelper.accessor("is_active", {
        header: "Status",
        cell: (info) =>
          info.getValue() ? (
            <Badge className='bg-green-500/10 text-green-600 border-green-200 border text-xs'>
              ACTIVE
            </Badge>
          ) : (
            <Badge className='bg-red-500/10 text-red-600 border-red-200 border text-xs'>
              INACTIVE
            </Badge>
          ),
      }),
      ...(canMutate
        ? [
            columnHelper.display({
              id: "actions",
              header: "Actions",
              cell: ({ row }: any) => (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant='ghost' size='icon' className='w-8 h-8'>
                      <MoreHorizontal className='w-4 h-4' />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end'>
                    <DropdownMenuItem onClick={() => openForm(row.original)}>
                      <Pencil className='mr-2 w-4 h-4' />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className='text-destructive focus:text-destructive'
                      onClick={() => {
                        setDeletingProduct(row.original);
                        setDeleteOpen(true);
                      }}
                    >
                      <Trash2 className='mr-2 w-4 h-4' />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ),
            }),
          ]
        : []),
    ],
    [canMutate],
  );

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className='space-y-6'>
      {/* Add form card */}
      {canMutate && !editingProduct && (
        <Card>
          <CardContent className='pt-4'>
            <h3 className='text-base font-semibold text-foreground mb-4'>
              Add New Product
            </h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit(e);
              }}
              className='space-y-4'
            >
              <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 items-end'>
                <div className='space-y-2'>
                  <Label htmlFor='pname'>Product Name</Label>
                  <Input
                    id='pname'
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder='e.g. 65 Biryani'
                    required
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='pprice'>Price</Label>
                  <Input
                    id='pprice'
                    type='number'
                    min='0.01'
                    step='0.01'
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder='0.00'
                    required
                  />
                </div>
                <div className='space-y-2'>
                  <Label>Status</Label>
                  <Select value={isActive} onValueChange={setIsActive}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='true'>Active</SelectItem>
                      <SelectItem value='false'>Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formError && !editingProduct && (
                <p className='text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md'>
                  {formError}
                </p>
              )}

              <div className='flex gap-3'>
                <Button type='submit' disabled={formLoading} className='gap-2'>
                  <Plus className='w-4 h-4' />
                  {formLoading ? "Adding..." : "Add Product"}
                </Button>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => {
                    setName("");
                    setPrice("");
                    setIsActive("true");
                    setFormError("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* List */}
      <div className='space-y-4'>
        <div className='flex items-center justify-between'>
          <h3 className='text-base font-semibold text-foreground'>
            Pre-Booking Products
          </h3>
          <span className='text-sm text-muted-foreground'>
            {products.length} products
          </span>
        </div>

        {/* Search */}
        <div className='relative w-full sm:max-w-xs'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground' />
          <Input
            placeholder='Search products...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='pl-9'
          />
        </div>

        <Card>
          <CardContent className='p-0'>
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((hg) => (
                  <TableRow key={hg.id}>
                    {hg.headers.map((header) => (
                      <TableHead key={header.id}>
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className='text-center py-12 text-muted-foreground'
                    >
                      Loading products...
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className='text-center py-16'
                    >
                      <div className='flex flex-col items-center gap-3 text-muted-foreground'>
                        <Package className='w-10 h-10 opacity-30' />
                        <p className='text-sm'>
                          {search
                            ? "No products found."
                            : "No products added yet."}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} className='hover:bg-muted/50'>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <p className='text-xs text-muted-foreground'>
          Showing {filtered.length} of {products.length} products
        </p>
      </div>

      {/* Edit dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className='sm:max-w-sm'>
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className='space-y-4 py-2'>
            <div className='space-y-2'>
              <Label>Product Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder='e.g. 65 Biryani'
                required
              />
            </div>
            <div className='space-y-2'>
              <Label>Price</Label>
              <Input
                type='number'
                min='0.01'
                step='0.01'
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder='0.00'
                required
              />
            </div>
            <div className='space-y-2'>
              <Label>Status</Label>
              <Select value={isActive} onValueChange={setIsActive}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='true'>Active</SelectItem>
                  <SelectItem value='false'>Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formError && (
              <p className='text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md'>
                {formError}
              </p>
            )}
            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => setFormOpen(false)}
              >
                Cancel
              </Button>
              <Button type='submit' disabled={formLoading}>
                {formLoading ? "Saving..." : "Update"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog
        open={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setDeletingProduct(null);
        }}
        onConfirm={handleDelete}
        title='Delete Product'
        description={`Delete "${deletingProduct?.name}"? This cannot be undone.`}
        loading={deleteLoading}
      />
    </div>
  );
};
