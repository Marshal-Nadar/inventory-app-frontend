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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  ArrowUpDown,
  Trash2,
  MoreHorizontal,
  Receipt,
  Eye,
  Pencil,
} from "lucide-react";
import {
  miscExpenseService,
  type MiscExpense,
} from "@/services/miscExpenseService";
import { DeleteConfirmDialog } from "@/components/common/DeleteConfirmDialog";
import { useAppSelector } from "@/hooks/useAppSelector";
import { toast } from "sonner";
import { format } from "date-fns";

import { MiscExpenseViewDialog } from "./MiscExpenseViewDialog";
import { MiscExpenseEditDialog } from "./MiscExpenseEditDialog";

import { TablePagination } from "@/components/common/TablePagination";

const columnHelper = createColumnHelper<MiscExpense>();

const today = format(new Date(), "yyyy-MM-dd");

export const ExpenseListPage = () => {
  const user = useAppSelector((state) => state.auth.user);
  const isAdmin = user?.role === "admin" || user?.is_super_admin;

  const [expenses, setExpenses] = useState<MiscExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([
    { id: "expense_date", desc: true },
  ]);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingExpense, setDeletingExpense] = useState<MiscExpense | null>(
    null,
  );
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewingExpense, setViewingExpense] = useState<MiscExpense | null>(
    null,
  );

  const [editOpen, setEditOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<MiscExpense | null>(
    null,
  );

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchExpenses = async (overrides?: {
    page?: number;
    limit?: number;
  }) => {
    try {
      setLoading(true);
      const result = await miscExpenseService.getAll({
        date: today,
        page: overrides?.page ?? page,
        limit: overrides?.limit ?? limit,
      });
      setExpenses(result.data);
      setTotal(result.pagination.total);
      setTotalPages(result.pagination.totalPages);
    } catch {
      toast.error("Failed to load expenses");
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchExpenses({ page: newPage });
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
    fetchExpenses({ page: 1, limit: newLimit });
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleDelete = async () => {
    if (!deletingExpense) return;
    setDeleteLoading(true);
    try {
      await miscExpenseService.delete(deletingExpense.id);
      toast.success("Expense deleted");
      await fetchExpenses();
      setDeleteOpen(false);
      setDeletingExpense(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete");
    } finally {
      setDeleteLoading(false);
    }
  };

  // ─── Search filter ────────────────────────────────────────────

  const filtered = useMemo(() => {
    if (!search.trim()) return expenses;
    const q = search.toLowerCase();
    return expenses.filter(
      (e) =>
        e.expense_type_name.toLowerCase().includes(q) ||
        e.subcategory_name?.toLowerCase().includes(q) ||
        e.branch_name.toLowerCase().includes(q) ||
        e.created_by_name?.toLowerCase().includes(q) ||
        e.notes?.toLowerCase().includes(q),
    );
  }, [expenses, search]);

  // ─── Columns ──────────────────────────────────────────────────

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "serial",
        header: "S.No",
        cell: ({ row }) => (
          <span className='text-sm text-muted-foreground'>
            {(page - 1) * limit + row.index + 1}
          </span>
        ),
      }),
      ...(isAdmin
        ? [
            columnHelper.accessor("expense_date", {
              header: ({ column }) => (
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => column.toggleSorting()}
                  className='gap-1 px-0 font-medium'
                >
                  Date <ArrowUpDown className='w-3.5 h-3.5' />
                </Button>
              ),
              cell: (info) => (
                <span className='text-sm text-muted-foreground'>
                  {format(new Date(info.getValue()), "dd MMM yyyy")}
                </span>
              ),
            }),
            columnHelper.accessor("branch_name" as any, {
              header: ({ column }: any) => (
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => column.toggleSorting()}
                  className='gap-1 px-0 font-medium'
                >
                  Branch <ArrowUpDown className='w-3.5 h-3.5' />
                </Button>
              ),
              cell: (info: any) => (
                <span className='font-medium text-foreground'>
                  {info.getValue()}
                </span>
              ),
            }),
          ]
        : []),
      columnHelper.accessor("expense_type_name", {
        header: ({ column }) => (
          <Button
            variant='ghost'
            size='sm'
            onClick={() => column.toggleSorting()}
            className='gap-1 px-0 font-medium'
          >
            Expense Type <ArrowUpDown className='w-3.5 h-3.5' />
          </Button>
        ),
        cell: (info) => (
          <span className='font-medium text-foreground'>{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor("subcategory_name", {
        header: "Subcategory",
        cell: (info) =>
          info.getValue() ? (
            <Badge variant='outline' className='text-xs'>
              {info.getValue()}
            </Badge>
          ) : (
            <span className='text-muted-foreground text-xs'>—</span>
          ),
      }),
      columnHelper.accessor("amount", {
        header: ({ column }) => (
          <Button
            variant='ghost'
            size='sm'
            onClick={() => column.toggleSorting()}
            className='gap-1 px-0 font-medium'
          >
            Amount <ArrowUpDown className='w-3.5 h-3.5' />
          </Button>
        ),
        cell: (info) => (
          <span className='font-semibold text-foreground'>
            ₹{Number(info.getValue()).toFixed(2)}
          </span>
        ),
      }),
      columnHelper.accessor("payment_method", {
        header: "Payment",
        cell: (info) => (
          <Badge
            variant='outline'
            className={
              info.getValue() === "cash"
                ? "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800 text-xs"
                : "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800 text-xs"
            }
          >
            {info.getValue() === "cash" ? "Cash" : "UPI"}
          </Badge>
        ),
      }),
      columnHelper.accessor("created_by_name", {
        header: "Added By",
        cell: (info) => (
          <span className='text-sm text-muted-foreground'>
            {info.getValue() || "—"}
          </span>
        ),
      }),
      columnHelper.accessor("notes", {
        header: "Notes",
        cell: (info) => (
          <span className='text-sm text-muted-foreground'>
            {info.getValue() || "—"}
          </span>
        ),
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
              {/* View — everyone */}
              <DropdownMenuItem
                onClick={() => {
                  setViewingExpense(row.original);
                  setViewOpen(true);
                }}
              >
                <Eye className='mr-2 w-4 h-4' />
                View
              </DropdownMenuItem>

              {/* Edit + Delete — admin only */}
              {isAdmin && (
                <>
                  <DropdownMenuItem
                    onClick={() => {
                      setEditingExpense(row.original);
                      setEditOpen(true);
                    }}
                  >
                    <Pencil className='mr-2 w-4 h-4' />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className='text-destructive focus:text-destructive'
                    onClick={() => {
                      setDeletingExpense(row.original);
                      setDeleteOpen(true);
                    }}
                  >
                    <Trash2 className='mr-2 w-4 h-4' />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      }),
    ],
    [isAdmin],
  );

  const table = useReactTable({
    data: filtered, // same for everyone now
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  // ─── Totals ───────────────────────────────────────────────────

  const totalAmount = useMemo(
    () => filtered.reduce((sum, e) => sum + Number(e.amount), 0),
    [filtered],
  );

  const cashTotal = useMemo(
    () =>
      filtered
        .filter((e) => e.payment_method === "cash")
        .reduce((sum, e) => sum + Number(e.amount), 0),
    [filtered],
  );

  const upiTotal = useMemo(
    () =>
      filtered
        .filter((e) => e.payment_method === "upi")
        .reduce((sum, e) => sum + Number(e.amount), 0),
    [filtered],
  );

  // ─── Render ───────────────────────────────────────────────────

  return (
    <div className='space-y-4'>
      {/* Header */}
      <div>
        <h2 className='text-xl font-bold text-foreground'>
          {isAdmin ? "All Expenses" : `Today's Expenses`}
        </h2>
        <p className='text-sm text-muted-foreground mt-1'>
          {isAdmin
            ? "Showing today's expenses from all branches."
            : `Showing expenses for ${format(new Date(), "dd MMM yyyy")}.`}
        </p>
      </div>

      {/* Summary cards */}
      {filtered.length > 0 && (
        <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
          <Card>
            <CardContent className='pt-4 space-y-1'>
              <p className='text-xs text-muted-foreground'>Total</p>
              <p className='text-2xl font-bold text-foreground'>
                ₹{totalAmount.toFixed(2)}
              </p>
              <p className='text-xs text-muted-foreground'>{total} expenses</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className='pt-4 space-y-1'>
              <p className='text-xs text-muted-foreground'>Cash</p>
              <p className='text-2xl font-bold text-orange-600'>
                ₹{cashTotal.toFixed(2)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className='pt-4 space-y-1'>
              <p className='text-xs text-muted-foreground'>UPI</p>
              <p className='text-2xl font-bold text-blue-600'>
                ₹{upiTotal.toFixed(2)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search */}
      <div className='relative w-full sm:max-w-xs'>
        <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground' />
        <Input
          placeholder='Search by type, subcategory, branch...'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className='pl-9'
        />
      </div>

      {/* Loading */}
      {loading ? (
        <p className='text-sm text-muted-foreground py-8 text-center'>
          Loading expenses...
        </p>
      ) : filtered.length === 0 ? (
        <div className='text-center py-16 text-muted-foreground'>
          <Receipt className='w-10 h-10 opacity-30 mx-auto mb-3' />
          <p className='text-sm'>No expenses recorded today.</p>
        </div>
      ) : (
        <div className='space-y-3'>
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
                  {table.getRowModel().rows.map((row) => (
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
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <TablePagination
            page={page}
            totalPages={totalPages}
            total={total}
            limit={limit}
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
          />
          <p className='text-xs text-muted-foreground'>
            Showing {filtered.length} of {total} expenses
          </p>

          <Separator />
          <div className='flex justify-end gap-6 pr-2'>
            <span className='text-sm text-muted-foreground'>
              Cash:{" "}
              <span className='font-semibold text-foreground'>
                ₹{cashTotal.toFixed(2)}
              </span>
            </span>
            <span className='text-sm text-muted-foreground'>
              UPI:{" "}
              <span className='font-semibold text-foreground'>
                ₹{upiTotal.toFixed(2)}
              </span>
            </span>
            <span className='text-sm font-bold text-foreground'>
              Total: ₹{totalAmount.toFixed(2)}
            </span>
          </div>
        </div>
      )}

      <MiscExpenseViewDialog
        open={viewOpen}
        onClose={() => {
          setViewOpen(false);
          setViewingExpense(null);
        }}
        expense={viewingExpense}
      />

      <MiscExpenseEditDialog
        open={editOpen}
        onClose={() => {
          setEditOpen(false);
          setEditingExpense(null);
        }}
        onSuccess={fetchExpenses} // or fetchReport for ExpenseReportPage
        expense={editingExpense}
      />

      <DeleteConfirmDialog
        open={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setDeletingExpense(null);
        }}
        onConfirm={handleDelete}
        title='Delete Expense'
        description={`Delete this ₹${Number(deletingExpense?.amount).toFixed(2)} expense? This cannot be undone.`}
        loading={deleteLoading}
      />
    </div>
  );
};
