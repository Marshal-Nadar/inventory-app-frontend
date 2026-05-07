import { useEffect, useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
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
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  ArrowUpDown,
  Truck,
} from "lucide-react";
import {
  vendorService,
  type Vendor,
  type VendorPayload,
} from "@/services/vendorService";
import { VendorFormDialog } from "./VendorFormDialog";
import { DeleteConfirmDialog } from "@/components/common/DeleteConfirmDialog";
import { useAppSelector } from "@/hooks/useAppSelector";
import { toast } from "sonner";

const PERMITTED_ROLES = ["admin", "manager", "supervisor"];

const columnHelper = createColumnHelper<Vendor>();

export const VendorsPage = () => {
  const user = useAppSelector((state) => state.auth.user);
  const canMutate =
    user?.is_super_admin || PERMITTED_ROLES.includes(user?.role || "");

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);

  const [formOpen, setFormOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingVendor, setDeletingVendor] = useState<Vendor | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const data = await vendorService.getAll();
      setVendors(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const handleCreate = async (data: VendorPayload) => {
    setFormLoading(true);
    try {
      await vendorService.create(data);
      await fetchVendors();
      setFormOpen(false);
      toast.success("Vendor added successfully");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to add vendor");
      throw err;
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdate = async (data: VendorPayload) => {
    if (!editingVendor) return;
    setFormLoading(true);
    try {
      await vendorService.update(editingVendor.id, data);
      await fetchVendors();
      setFormOpen(false);
      setEditingVendor(null);
      toast.success("Vendor updated successfully");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update vendor");
      throw err;
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingVendor) return;
    setDeleteLoading(true);
    try {
      await vendorService.delete(deletingVendor.id);
      await fetchVendors();
      setDeleteOpen(false);
      setDeletingVendor(null);
      toast.success(`${deletingVendor.name} removed`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete vendor");
    } finally {
      setDeleteLoading(false);
    }
  };

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "serial",
        header: "S.No",
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
            Vendor Name <ArrowUpDown className='w-3.5 h-3.5' />
          </Button>
        ),
        cell: (info) => (
          <span className='font-medium text-foreground'>{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor("phone", {
        header: "Phone",
        cell: (info) => (
          <span className='text-sm font-mono'>{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor("address", {
        header: "Address",
        cell: (info) => (
          <span className='text-sm text-muted-foreground'>
            {info.getValue() || "—"}
          </span>
        ),
      }),
      columnHelper.accessor("description", {
        header: "Description",
        cell: (info) => (
          <span className='text-sm text-muted-foreground'>
            {info.getValue() || "—"}
          </span>
        ),
      }),
      columnHelper.accessor("restaurant_name", {
        header: "Restaurant",
        cell: (info) => (
          <span className='text-sm text-muted-foreground'>
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.display({
        id: "actions",
        header: "Actions",
        cell: ({ row }) =>
          canMutate ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='ghost' size='icon' className='w-8 h-8'>
                  <MoreHorizontal className='w-4 h-4' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                <DropdownMenuItem
                  onClick={() => {
                    setEditingVendor(row.original);
                    setFormOpen(true);
                  }}
                >
                  <Pencil className='mr-2 w-4 h-4' />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  className='text-destructive focus:text-destructive'
                  onClick={() => {
                    setDeletingVendor(row.original);
                    setDeleteOpen(true);
                  }}
                >
                  <Trash2 className='mr-2 w-4 h-4' />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <span className='text-xs text-muted-foreground'>View only</span>
          ),
      }),
    ],
    [canMutate],
  );

  const filtered = useMemo(
    () =>
      vendors.filter(
        (v) =>
          v.name.toLowerCase().includes(search.toLowerCase()) ||
          v.phone.includes(search) ||
          v.address?.toLowerCase().includes(search.toLowerCase()) ||
          v.restaurant_name?.toLowerCase().includes(search.toLowerCase()),
      ),
    [vendors, search],
  );

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className='space-y-4'>
      {/* Page header */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-xl font-bold text-foreground'>Vendors</h2>
          <p className='text-sm text-muted-foreground mt-1'>
            Manage your restaurant's suppliers and vendors.
          </p>
        </div>
        {canMutate && (
          <Button
            onClick={() => {
              setEditingVendor(null);
              setFormOpen(true);
            }}
            className='gap-2'
          >
            <Plus className='w-4 h-4' />
            Add Vendor
          </Button>
        )}
      </div>

      {/* Search */}
      <div className='relative w-full sm:max-w-xs'>
        <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground' />
        <Input
          placeholder='Search vendors...'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className='pl-9'
        />
      </div>

      {/* Stats */}
      <div className='flex gap-4'>
        <div className='text-sm text-muted-foreground'>
          Total:{" "}
          <span className='font-medium text-foreground'>{vendors.length}</span>
        </div>
      </div>

      {/* Table */}
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
                    Loading vendors...
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className='text-center py-16'
                  >
                    <div className='flex flex-col items-center gap-3 text-muted-foreground'>
                      <Truck className='w-10 h-10 opacity-30' />
                      <p className='text-sm'>No vendors found.</p>
                      {canMutate && (
                        <Button
                          size='sm'
                          variant='outline'
                          onClick={() => setFormOpen(true)}
                          className='gap-2'
                        >
                          <Plus className='w-4 h-4' />
                          Add your first vendor
                        </Button>
                      )}
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

      {/* Count */}
      <p className='text-xs text-muted-foreground'>
        Showing {filtered.length} of {vendors.length} vendors
      </p>

      {/* Form dialog */}
      <VendorFormDialog
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingVendor(null);
        }}
        onSubmit={editingVendor ? handleUpdate : handleCreate}
        editingVendor={editingVendor}
        loading={formLoading}
      />

      {/* Delete dialog */}
      <DeleteConfirmDialog
        open={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setDeletingVendor(null);
        }}
        onConfirm={handleDelete}
        title='Delete Vendor'
        description={`Remove "${deletingVendor?.name}"? This cannot be undone.`}
        loading={deleteLoading}
      />
    </div>
  );
};
