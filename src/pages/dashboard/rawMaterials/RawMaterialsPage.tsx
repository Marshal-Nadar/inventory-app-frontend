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
import { Badge } from "@/components/ui/badge";
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
  PackageSearch,
} from "lucide-react";
import {
  rawMaterialService,
  type RawMaterial,
  type RawMaterialItem,
} from "@/services/rawMaterialService";
import { RawMaterialFormDialog } from "./RawMaterialFormDialog";
import { DeleteConfirmDialog } from "@/components/common/DeleteConfirmDialog";
import { useAppSelector } from "@/hooks/useAppSelector";
import { toast } from "sonner";

const PERMITTED_ROLES = ["admin", "manager", "supervisor"];

const METRIC_LABELS: Record<string, string> = {
  kg: "kg",
  g: "g",
  l: "l",
  ml: "ml",
  unit: "unit",
};

const columnHelper = createColumnHelper<RawMaterial>();

export const RawMaterialsPage = () => {
  const user = useAppSelector((state) => state.auth.user);
  const canMutate =
    user?.is_super_admin || PERMITTED_ROLES.includes(user?.role || "");

  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);

  const [formOpen, setFormOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<RawMaterial | null>(
    null,
  );
  const [formLoading, setFormLoading] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingMaterial, setDeletingMaterial] = useState<RawMaterial | null>(
    null,
  );
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const data = await rawMaterialService.getAll();
      setMaterials(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  const handleCreate = async (
    items: RawMaterialItem[],
    restaurantId?: number,
  ) => {
    setFormLoading(true);
    try {
      await rawMaterialService.create(items, restaurantId);
      await fetchMaterials();
      setFormOpen(false);
      toast.success(
        `${items.length} raw material${items.length > 1 ? "s" : ""} added`,
      );
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to add raw materials");
      throw err;
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdate = async (id: number, item: RawMaterialItem) => {
    setFormLoading(true);
    try {
      await rawMaterialService.update(id, item);
      await fetchMaterials();
      setFormOpen(false);
      setEditingMaterial(null);
      toast.success("Raw material updated");
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || "Failed to update raw material",
      );
      throw err;
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingMaterial) return;
    setDeleteLoading(true);
    try {
      await rawMaterialService.delete(deletingMaterial.id);
      await fetchMaterials();
      setDeleteOpen(false);
      setDeletingMaterial(null);
      toast.success(`${deletingMaterial.name} removed`);
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || "Failed to delete raw material",
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  // group by category for stats
  const categories = useMemo(
    () => [...new Set(materials.map((m) => m.category))],
    [materials],
  );

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "serial",
        header: "S.No",
        cell: ({ row }) => (
          <span className='text-sm text-muted-foreground'>{row.index + 1}</span>
        ),
      }),
      columnHelper.accessor("category", {
        header: ({ column }) => (
          <Button
            variant='ghost'
            size='sm'
            onClick={() => column.toggleSorting()}
            className='gap-1 px-0 font-medium'
          >
            Category <ArrowUpDown className='w-3.5 h-3.5' />
          </Button>
        ),
        cell: (info) => (
          <Badge variant='outline' className='capitalize'>
            {info.getValue()}
          </Badge>
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
            Name <ArrowUpDown className='w-3.5 h-3.5' />
          </Button>
        ),
        cell: (info) => (
          <span className='font-medium text-foreground'>{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor("metric", {
        header: "Metric",
        cell: (info) => (
          <Badge variant='secondary'>
            {METRIC_LABELS[info.getValue()] || info.getValue()}
          </Badge>
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
                    setEditingMaterial(row.original);
                    setFormOpen(true);
                  }}
                >
                  <Pencil className='mr-2 w-4 h-4' />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  className='text-destructive focus:text-destructive'
                  onClick={() => {
                    setDeletingMaterial(row.original);
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
      materials.filter(
        (m) =>
          m.name.toLowerCase().includes(search.toLowerCase()) ||
          m.category.toLowerCase().includes(search.toLowerCase()) ||
          m.metric.toLowerCase().includes(search.toLowerCase()) ||
          m.restaurant_name?.toLowerCase().includes(search.toLowerCase()),
      ),
    [materials, search],
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
          <h2 className='text-xl font-bold text-foreground'>Raw Materials</h2>
          <p className='text-sm text-muted-foreground mt-1'>
            Master list of raw materials shared across all branches.
          </p>
        </div>
        {canMutate && (
          <Button
            onClick={() => {
              setEditingMaterial(null);
              setFormOpen(true);
            }}
            className='gap-2'
          >
            <Plus className='w-4 h-4' />
            Add Raw Materials
          </Button>
        )}
      </div>

      {/* Search */}
      <div className='relative w-full sm:max-w-xs'>
        <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground' />
        <Input
          placeholder='Search materials...'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className='pl-9'
        />
      </div>

      {/* Stats */}
      <div className='flex gap-4'>
        <div className='text-sm text-muted-foreground'>
          Total:{" "}
          <span className='font-medium text-foreground'>
            {materials.length}
          </span>
        </div>
        <div className='text-sm text-muted-foreground'>
          Categories:{" "}
          <span className='font-medium text-foreground'>
            {categories.length}
          </span>
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
                    Loading raw materials...
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className='text-center py-16'
                  >
                    <div className='flex flex-col items-center gap-3 text-muted-foreground'>
                      <PackageSearch className='w-10 h-10 opacity-30' />
                      <p className='text-sm'>No raw materials found.</p>
                      {canMutate && (
                        <Button
                          size='sm'
                          variant='outline'
                          onClick={() => setFormOpen(true)}
                          className='gap-2'
                        >
                          <Plus className='w-4 h-4' />
                          Add your first item
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
        Showing {filtered.length} of {materials.length} items
      </p>

      {/* Form dialog */}
      <RawMaterialFormDialog
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingMaterial(null);
        }}
        onSubmitCreate={handleCreate}
        onSubmitUpdate={handleUpdate}
        editingMaterial={editingMaterial}
        loading={formLoading}
      />

      {/* Delete dialog */}
      <DeleteConfirmDialog
        open={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setDeletingMaterial(null);
        }}
        onConfirm={handleDelete}
        title='Delete Raw Material'
        description={`Remove "${deletingMaterial?.name}" from the master list? This cannot be undone.`}
        loading={deleteLoading}
      />
    </div>
  );
};
