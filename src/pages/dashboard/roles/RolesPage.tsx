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
  ShieldCheck,
} from "lucide-react";
import { roleService, type Role } from "@/services/roleService";
import { RoleFormDialog } from "./RoleFormDialog";
import { DeleteConfirmDialog } from "@/components/common/DeleteConfirmDialog";
import { useAppSelector } from "@/hooks/useAppSelector";

const columnHelper = createColumnHelper<Role>();

export const RolesPage = () => {
  const user = useAppSelector((state) => state.auth.user);

  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);

  const [formOpen, setFormOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingRole, setDeletingRole] = useState<Role | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const data = await roleService.getAll();
      setRoles(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleCreate = async (data: {
    name: string;
    description: string;
    restaurant_id: number;
  }) => {
    setFormLoading(true);
    try {
      await roleService.create(data);
      await fetchRoles();
      setFormOpen(false);
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdate = async (data: {
    name: string;
    description: string;
    restaurant_id: number;
  }) => {
    if (!editingRole) return;
    setFormLoading(true);
    try {
      await roleService.update(editingRole.id, {
        name: data.name,
        description: data.description,
      });
      await fetchRoles();
      setFormOpen(false);
      setEditingRole(null);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingRole) return;
    setDeleteLoading(true);
    setDeleteError("");
    try {
      await roleService.delete(deletingRole.id);
      await fetchRoles();
      setDeleteOpen(false);
      setDeletingRole(null);
    } catch (err: any) {
      // don't close dialog — show error inside it
      setDeleteError(err.response?.data?.message || "Failed to delete role");
    } finally {
      setDeleteLoading(false);
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
            Role Name <ArrowUpDown className='w-3.5 h-3.5' />
          </Button>
        ),
        cell: (info) => (
          <div className='flex items-center gap-2'>
            <ShieldCheck className='w-4 h-4 text-muted-foreground flex-shrink-0' />
            <span className='font-medium text-foreground capitalize'>
              {info.getValue()}
            </span>
            {info.row.original.is_default && (
              <Badge variant='secondary' className='text-xs'>
                Default
              </Badge>
            )}
          </div>
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
            {info.getValue() || "—"}
          </span>
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
                  setEditingRole(row.original);
                  setFormOpen(true);
                }}
              >
                <Pencil className='mr-2 w-4 h-4' />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className='text-destructive focus:text-destructive'
                onClick={() => {
                  setDeletingRole(row.original);
                  setDeleteError("");
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
    ],
    [],
  );

  const filtered = useMemo(
    () =>
      roles.filter(
        (r) =>
          r.name.toLowerCase().includes(search.toLowerCase()) ||
          r.description?.toLowerCase().includes(search.toLowerCase()) ||
          r.restaurant_name?.toLowerCase().includes(search.toLowerCase()),
      ),
    [roles, search],
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
          <h2 className='text-xl font-bold text-foreground'>Roles</h2>
          <p className='text-sm text-muted-foreground mt-1'>
            Manage roles and permissions for your restaurant.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingRole(null);
            setFormOpen(true);
          }}
          className='gap-2'
        >
          <Plus className='w-4 h-4' />
          Add Role
        </Button>
      </div>

      {/* Search */}
      <div className='relative w-full sm:max-w-xs'>
        <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground' />
        <Input
          placeholder='Search roles...'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className='pl-9'
        />
      </div>

      {/* Stats */}
      <div className='flex gap-4'>
        <div className='text-sm text-muted-foreground'>
          Total:{" "}
          <span className='font-medium text-foreground'>{roles.length}</span>
        </div>
        <div className='text-sm text-muted-foreground'>
          Default:{" "}
          <span className='font-medium text-foreground'>
            {roles.filter((r) => r.is_default).length}
          </span>
        </div>
        <div className='text-sm text-muted-foreground'>
          Custom:{" "}
          <span className='font-medium text-foreground'>
            {roles.filter((r) => !r.is_default).length}
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
                    Loading roles...
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className='text-center py-12 text-muted-foreground'
                  >
                    No roles found.
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
        Showing {filtered.length} of {roles.length} roles
      </p>

      {/* Create / Edit dialog */}
      <RoleFormDialog
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingRole(null);
        }}
        onSubmit={editingRole ? handleUpdate : handleCreate}
        editingRole={editingRole}
        loading={formLoading}
      />

      {/* Delete confirm dialog */}
      <DeleteConfirmDialog
        open={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setDeletingRole(null);
          setDeleteError("");
        }}
        onConfirm={handleDelete}
        title='Delete Role'
        description={
          deletingRole?.is_default
            ? `"${deletingRole?.name}" is a default role. Deleting it may affect users assigned to it. Are you sure?`
            : `Delete role "${deletingRole?.name}"? Users assigned to this role will be affected.`
        }
        loading={deleteLoading}
        error={deleteError}
      />
    </div>
  );
};
