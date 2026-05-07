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
import { toast } from "sonner";
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
  PowerOff,
  Power,
  ArrowUpDown,
} from "lucide-react";
import {
  restaurantService,
  type Restaurant,
} from "@/services/restaurantService";
import { RestaurantFormDialog } from "./RestaurantFormDialog";
import { DeleteConfirmDialog } from "@/components/common/DeleteConfirmDialog";

const columnHelper = createColumnHelper<Restaurant>();

export const RestaurantsPage = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);

  const [formOpen, setFormOpen] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(
    null,
  );
  const [formLoading, setFormLoading] = useState(false);

  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [deactivatingRestaurant, setDeactivatingRestaurant] =
    useState<Restaurant | null>(null);
  const [deactivateLoading, setDeactivateLoading] = useState(false);

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      const data = await restaurantService.getAll();
      setRestaurants(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const handleCreate = async (data: {
    name: string;
    slug: string;
    timezone: string;
  }) => {
    setFormLoading(true);
    try {
      await restaurantService.create(data);
      await fetchRestaurants();
      setFormOpen(false);
      toast.success("Restaurant created successfully");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create restaurant");
      throw err;
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdate = async (data: {
    name: string;
    slug: string;
    timezone: string;
  }) => {
    if (!editingRestaurant) return;
    setFormLoading(true);
    try {
      await restaurantService.update(editingRestaurant.id, data);
      await fetchRestaurants();
      setFormOpen(false);
      setEditingRestaurant(null);
      toast.success("Restaurant updated successfully");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update restaurant");
      throw err;
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeactivate = async () => {
    if (!deactivatingRestaurant) return;
    setDeactivateLoading(true);
    try {
      if (deactivatingRestaurant.is_active) {
        await restaurantService.delete(deactivatingRestaurant.id);
        toast.success(`${deactivatingRestaurant.name} deactivated`);
      } else {
        await restaurantService.activate(deactivatingRestaurant.id);
        toast.success(`${deactivatingRestaurant.name} activated`);
      }
      await fetchRestaurants();
      setDeactivateOpen(false);
      setDeactivatingRestaurant(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Operation failed");
    } finally {
      setDeactivateLoading(false);
    }
  };

  const columns = useMemo(
    () => [
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
          <div className='font-medium text-foreground'>{info.getValue()}</div>
        ),
      }),
      columnHelper.accessor("slug", {
        header: "Slug",
        cell: (info) => (
          <code className='text-xs bg-muted px-2 py-1 rounded'>
            {info.getValue()}
          </code>
        ),
      }),
      columnHelper.accessor("timezone", {
        header: "Timezone",
        cell: (info) => (
          <span className='text-sm text-muted-foreground'>
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor("is_active", {
        header: "Status",
        cell: (info) =>
          info.getValue() ? (
            <Badge className='bg-green-500/10 text-green-600 hover:bg-green-500/20 border-0'>
              Active
            </Badge>
          ) : (
            <Badge variant='destructive'>Inactive</Badge>
          ),
      }),
      columnHelper.accessor("created_at", {
        header: ({ column }) => (
          <Button
            variant='ghost'
            size='sm'
            onClick={() => column.toggleSorting()}
            className='gap-1 px-0 font-medium'
          >
            Created <ArrowUpDown className='w-3.5 h-3.5' />
          </Button>
        ),
        cell: (info) =>
          new Date(info.getValue()).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }),
      }),
      columnHelper.display({
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' size='icon' className='w-8 h-8'>
                <MoreHorizontal className='w-4 h-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuItem
                onClick={() => {
                  setEditingRestaurant(row.original);
                  setFormOpen(true);
                }}
              >
                <Pencil className='mr-2 w-4 h-4' />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className={
                  row.original.is_active
                    ? "text-destructive focus:text-destructive"
                    : "text-green-600 focus:text-green-600"
                }
                onClick={() => {
                  setDeactivatingRestaurant(row.original);
                  setDeactivateOpen(true);
                }}
              >
                {row.original.is_active ? (
                  <>
                    <PowerOff className='mr-2 w-4 h-4' />
                    Deactivate
                  </>
                ) : (
                  <>
                    <Power className='mr-2 w-4 h-4' />
                    Activate
                  </>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      }),
    ],
    [],
  );

  const filtered = useMemo(
    () =>
      restaurants.filter(
        (r) =>
          r.name.toLowerCase().includes(search.toLowerCase()) ||
          r.slug.toLowerCase().includes(search.toLowerCase()),
      ),
    [restaurants, search],
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
          <h2 className='text-xl font-bold text-foreground'>Restaurants</h2>
          <p className='text-sm text-muted-foreground mt-1'>
            Manage all restaurants on the platform.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingRestaurant(null);
            setFormOpen(true);
          }}
          className='gap-2'
        >
          <Plus className='w-4 h-4' />
          Add Restaurant
        </Button>
      </div>

      {/* Search */}
      <div className='relative w-full sm:max-w-xs'>
        <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground' />
        <Input
          placeholder='Search restaurants...'
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
            {restaurants.length}
          </span>
        </div>
        <div className='text-sm text-muted-foreground'>
          Active:{" "}
          <span className='font-medium text-green-600'>
            {restaurants.filter((r) => r.is_active).length}
          </span>
        </div>
        <div className='text-sm text-muted-foreground'>
          Inactive:{" "}
          <span className='font-medium text-destructive'>
            {restaurants.filter((r) => !r.is_active).length}
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
                    Loading restaurants...
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className='text-center py-12 text-muted-foreground'
                  >
                    No restaurants found.
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
        Showing {filtered.length} of {restaurants.length} restaurants
      </p>

      {/* Create / Edit dialog */}
      <RestaurantFormDialog
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingRestaurant(null);
        }}
        onSubmit={editingRestaurant ? handleUpdate : handleCreate}
        editingRestaurant={editingRestaurant}
        loading={formLoading}
      />

      {/* Deactivate confirm dialog */}
      <DeleteConfirmDialog
        open={deactivateOpen}
        onClose={() => {
          setDeactivateOpen(false);
          setDeactivatingRestaurant(null);
        }}
        onConfirm={handleDeactivate}
        title={
          deactivatingRestaurant?.is_active
            ? "Deactivate Restaurant"
            : "Activate Restaurant"
        }
        description={
          deactivatingRestaurant?.is_active
            ? `Are you sure you want to deactivate ${deactivatingRestaurant?.name}? This will affect all branches and users.`
            : `Reactivate ${deactivatingRestaurant?.name}?`
        }
        loading={deactivateLoading}
      />
    </div>
  );
};
