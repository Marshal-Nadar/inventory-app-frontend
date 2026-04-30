import { useEffect, useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
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
} from "lucide-react";
import {
  userService,
  type User,
  type CreateUserPayload,
  type UpdateUserPayload,
} from "@/services/userService";
import { UserFormDialog } from "./UserFormDialog";
import { DeleteConfirmDialog } from "@/components/common/DeleteConfirmDialog";

const columnHelper = createColumnHelper<User>();

export const UsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);

  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.getAll();
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreate = async (data: CreateUserPayload | UpdateUserPayload) => {
    setFormLoading(true);
    try {
      await userService.create(data as CreateUserPayload);
      await fetchUsers();
      setFormOpen(false);
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdate = async (data: CreateUserPayload | UpdateUserPayload) => {
    if (!editingUser) return;
    setFormLoading(true);
    try {
      await userService.update(editingUser.id, data as UpdateUserPayload);
      await fetchUsers();
      setFormOpen(false);
      setEditingUser(null);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingUser) return;
    setDeleteLoading(true);
    try {
      await userService.delete(deletingUser.id);
      await fetchUsers();
      setDeleteOpen(false);
      setDeletingUser(null);
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
            Name <ArrowUpDown className='w-3.5 h-3.5' />
          </Button>
        ),
        cell: (info) => (
          <div className='font-medium text-foreground'>{info.getValue()}</div>
        ),
      }),
      columnHelper.accessor("email", {
        header: "Email",
        cell: (info) => (
          <span className='text-muted-foreground'>{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor("role_name", {
        header: "Role",
        cell: (info) => (
          <Badge variant='secondary' className='capitalize'>
            {info.getValue()}
          </Badge>
        ),
      }),
      columnHelper.accessor("branch_name", {
        header: "Branch",
        cell: (info) => <span className='text-sm'>{info.getValue()}</span>,
      }),
      columnHelper.accessor("restaurant_name", {
        header: "Restaurant",
        cell: (info) => <span className='text-sm'>{info.getValue()}</span>,
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
        header: "Joined",
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
                  setEditingUser(row.original);
                  setFormOpen(true);
                }}
              >
                <Pencil className='mr-2 w-4 h-4' />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className='text-destructive focus:text-destructive'
                onClick={() => {
                  setDeletingUser(row.original);
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
      users.filter(
        (u) =>
          u.name.toLowerCase().includes(search.toLowerCase()) ||
          u.email.toLowerCase().includes(search.toLowerCase()) ||
          u.role_name.toLowerCase().includes(search.toLowerCase()) ||
          u.branch_name.toLowerCase().includes(search.toLowerCase()),
      ),
    [users, search],
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
          <h2 className='text-xl font-bold text-foreground'>Users</h2>
          <p className='text-sm text-muted-foreground mt-1'>
            Manage users across all branches.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingUser(null);
            setFormOpen(true);
          }}
          className='gap-2'
        >
          <Plus className='w-4 h-4' />
          Add User
        </Button>
      </div>

      {/* Search */}
      <div className='relative w-full sm:max-w-xs'>
        <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground' />
        <Input
          placeholder='Search users...'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className='pl-9'
        />
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
                    Loading users...
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className='text-center py-12 text-muted-foreground'
                  >
                    No users found.
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
        Showing {filtered.length} of {users.length} users
      </p>

      {/* Create / Edit dialog */}
      <UserFormDialog
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingUser(null);
        }}
        onSubmit={editingUser ? handleUpdate : handleCreate}
        editingUser={editingUser}
        loading={formLoading}
      />

      {/* Delete dialog */}
      <DeleteConfirmDialog
        open={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setDeletingUser(null);
        }}
        onConfirm={handleDelete}
        title='Delete User'
        description={`Are you sure you want to delete ${deletingUser?.name}? This action cannot be undone.`}
        loading={deleteLoading}
      />
    </div>
  );
};
