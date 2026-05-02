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
  PowerOff,
  Power,
  ArrowUpDown,
} from "lucide-react";
import { branchService, type Branch } from "@/services/branchService";
import { BranchFormDialog } from "./BranchFormDialog";
import { DeleteConfirmDialog } from "@/components/common/DeleteConfirmDialog";
import { useAppSelector } from "@/hooks/useAppSelector";

const columnHelper = createColumnHelper<Branch>();

export const BranchesPage = () => {
  const user = useAppSelector((state) => state.auth.user);
  const isAdmin = user?.role === "admin";

  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);

  const [formOpen, setFormOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [deactivatingBranch, setDeactivatingBranch] = useState<Branch | null>(
    null,
  );
  const [deactivateLoading, setDeactivateLoading] = useState(false);

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const data = await branchService.getAll();
      setBranches(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleCreate = async (data: {
    name: string;
    address: string;
    phone: string;
  }) => {
    console.log("restaurant_id from user:", user?.restaurant_id);
    console.log("full user object:", user);
    setFormLoading(true);
    try {
      await branchService.create({
        restaurant_id: user!.restaurant_id,
        ...data,
      });
      await fetchBranches();
      setFormOpen(false);
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdate = async (data: {
    name: string;
    address: string;
    phone: string;
  }) => {
    if (!editingBranch) return;
    setFormLoading(true);
    try {
      await branchService.update(editingBranch.id, data);
      await fetchBranches();
      setFormOpen(false);
      setEditingBranch(null);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeactivate = async () => {
    if (!deactivatingBranch) return;
    setDeactivateLoading(true);
    try {
      if (deactivatingBranch.is_active) {
        await branchService.delete(deactivatingBranch.id);
      } else {
        await branchService.activate(deactivatingBranch.id);
      }
      await fetchBranches();
      setDeactivateOpen(false);
      setDeactivatingBranch(null);
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
            Branch Name <ArrowUpDown className='w-3.5 h-3.5' />
          </Button>
        ),
        cell: (info) => (
          <div className='font-medium text-foreground'>{info.getValue()}</div>
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
      columnHelper.accessor("address", {
        header: "Address",
        cell: (info) => (
          <span className='text-sm text-muted-foreground'>
            {info.getValue() || "—"}
          </span>
        ),
      }),
      columnHelper.accessor("phone", {
        header: "Phone",
        cell: (info) => (
          <span className='text-sm'>{info.getValue() || "—"}</span>
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
        cell: ({ row }) =>
          isAdmin ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='ghost' size='icon' className='w-8 h-8'>
                  <MoreHorizontal className='w-4 h-4' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                <DropdownMenuItem
                  onClick={() => {
                    setEditingBranch(row.original);
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
                    setDeactivatingBranch(row.original);
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
          ) : (
            <span className='text-xs text-muted-foreground'>View only</span>
          ),
      }),
    ],
    [isAdmin],
  );

  const filtered = useMemo(
    () =>
      branches.filter(
        (b) =>
          b.name.toLowerCase().includes(search.toLowerCase()) ||
          b.restaurant_name?.toLowerCase().includes(search.toLowerCase()) ||
          b.address?.toLowerCase().includes(search.toLowerCase()),
      ),
    [branches, search],
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
          <h2 className='text-xl font-bold text-foreground'>Branches</h2>
          <p className='text-sm text-muted-foreground mt-1'>
            Manage branches for your restaurant.
          </p>
        </div>
        {isAdmin && (
          <Button
            onClick={() => {
              setEditingBranch(null);
              setFormOpen(true);
            }}
            className='gap-2'
          >
            <Plus className='w-4 h-4' />
            Add Branch
          </Button>
        )}
      </div>

      {/* Search */}
      <div className='relative w-full sm:max-w-xs'>
        <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground' />
        <Input
          placeholder='Search branches...'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className='pl-9'
        />
      </div>

      {/* Stats */}
      <div className='flex gap-4'>
        <div className='text-sm text-muted-foreground'>
          Total:{" "}
          <span className='font-medium text-foreground'>{branches.length}</span>
        </div>
        <div className='text-sm text-muted-foreground'>
          Active:{" "}
          <span className='font-medium text-green-600'>
            {branches.filter((b) => b.is_active).length}
          </span>
        </div>
        <div className='text-sm text-muted-foreground'>
          Inactive:{" "}
          <span className='font-medium text-destructive'>
            {branches.filter((b) => !b.is_active).length}
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
                    Loading branches...
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className='text-center py-12 text-muted-foreground'
                  >
                    No branches found.
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
        Showing {filtered.length} of {branches.length} branches
      </p>

      {/* Create / Edit dialog */}
      <BranchFormDialog
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingBranch(null);
        }}
        onSubmit={editingBranch ? handleUpdate : handleCreate}
        editingBranch={editingBranch}
        loading={formLoading}
      />

      {/* Deactivate confirm dialog */}
      <DeleteConfirmDialog
        open={deactivateOpen}
        onClose={() => {
          setDeactivateOpen(false);
          setDeactivatingBranch(null);
        }}
        onConfirm={handleDeactivate}
        title={
          deactivatingBranch?.is_active
            ? "Deactivate Branch"
            : "Activate Branch"
        }
        description={
          deactivatingBranch?.is_active
            ? `Deactivate ${deactivatingBranch?.name}? Users in this branch will lose access.`
            : `Reactivate ${deactivatingBranch?.name}?`
        }
        loading={deactivateLoading}
      />
    </div>
  );
};
