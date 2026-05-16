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
} from "lucide-react";
import {
  miscExpenseService,
  type MiscExpense,
} from "@/services/miscExpenseService";
import { DeleteConfirmDialog } from "@/components/common/DeleteConfirmDialog";
import { useAppSelector } from "@/hooks/useAppSelector";
import { toast } from "sonner";
import { format } from "date-fns";

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

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const data = await miscExpenseService.getAll();

      // non-admin: filter to today only
      if (!isAdmin) {
        setExpenses(data.filter((e) => e.expense_date.startsWith(today)));
      } else {
        setExpenses(data);
      }
    } catch {
      toast.error("Failed to load expenses");
    } finally {
      setLoading(false);
    }
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

  // ─── Group by date for admin ──────────────────────────────────

  const groupedByDate = useMemo(() => {
    if (!isAdmin) return null;
    const map = new Map<string, MiscExpense[]>();
    filtered.forEach((e) => {
      const dateKey = e.expense_date.split("T")[0];
      if (!map.has(dateKey)) map.set(dateKey, []);
      map.get(dateKey)!.push(e);
    });
    // sort dates descending
    return new Map(
      [...map.entries()].sort(
        (a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime(),
      ),
    );
  }, [filtered, isAdmin]);

  // ─── Columns ──────────────────────────────────────────────────

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "serial",
        header: "S.No",
        cell: ({ row }) => (
          <span className='text-sm text-muted-foreground'>{row.index + 1}</span>
        ),
      }),
      ...(isAdmin
        ? [
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
                ? "text-orange-600 border-orange-200 text-xs"
                : "text-blue-600 border-blue-200 text-xs"
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
      ...(isAdmin
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
                  </DropdownMenuContent>
                </DropdownMenu>
              ),
            }),
          ]
        : []),
    ],
    [isAdmin],
  );

  const table = useReactTable({
    data: isAdmin ? [] : filtered, // admin uses grouped rendering
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
            ? "View all branch expenses grouped by date."
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
              <p className='text-xs text-muted-foreground'>
                {filtered.length} expenses
              </p>
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
          <p className='text-sm'>
            {isAdmin ? "No expenses found." : "No expenses recorded today."}
          </p>
        </div>
      ) : isAdmin ? (
        // ─── Admin: grouped by date ──────────────────────────────
        <div className='space-y-6'>
          {Array.from(groupedByDate!.entries()).map(
            ([dateKey, dayExpenses]) => {
              const dayTotal = dayExpenses.reduce(
                (sum, e) => sum + Number(e.amount),
                0,
              );
              const dayCash = dayExpenses
                .filter((e) => e.payment_method === "cash")
                .reduce((sum, e) => sum + Number(e.amount), 0);
              const dayUpi = dayExpenses
                .filter((e) => e.payment_method === "upi")
                .reduce((sum, e) => sum + Number(e.amount), 0);

              const isToday = dateKey === today;

              return (
                <div key={dateKey} className='space-y-2'>
                  {/* Date header */}
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-3'>
                      <h3 className='text-sm font-semibold text-foreground'>
                        {isToday
                          ? "Today"
                          : format(new Date(dateKey), "dd MMM yyyy")}
                      </h3>
                      {isToday && (
                        <Badge className='text-xs bg-green-500/10 text-green-600 border-green-200 border'>
                          Today
                        </Badge>
                      )}
                      <span className='text-xs text-muted-foreground'>
                        {dayExpenses.length} expense
                        {dayExpenses.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className='flex items-center gap-4 text-sm'>
                      <span className='text-orange-600'>
                        Cash: ₹{dayCash.toFixed(2)}
                      </span>
                      <span className='text-blue-600'>
                        UPI: ₹{dayUpi.toFixed(2)}
                      </span>
                      <span className='font-semibold text-foreground'>
                        Total: ₹{dayTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <Card>
                    <CardContent className='p-0'>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className='w-12'>S.No</TableHead>
                            <TableHead>Branch</TableHead>
                            <TableHead>Expense Type</TableHead>
                            <TableHead>Subcategory</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Payment</TableHead>
                            <TableHead>Added By</TableHead>
                            <TableHead>Notes</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {dayExpenses.map((expense, index) => (
                            <TableRow
                              key={expense.id}
                              className='hover:bg-muted/50'
                            >
                              <TableCell className='text-sm text-muted-foreground'>
                                {index + 1}
                              </TableCell>
                              <TableCell className='font-medium text-foreground'>
                                {expense.branch_name}
                              </TableCell>
                              <TableCell className='font-medium text-foreground'>
                                {expense.expense_type_name}
                              </TableCell>
                              <TableCell>
                                {expense.subcategory_name ? (
                                  <Badge variant='outline' className='text-xs'>
                                    {expense.subcategory_name}
                                  </Badge>
                                ) : (
                                  <span className='text-muted-foreground text-xs'>
                                    —
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className='font-semibold text-foreground'>
                                ₹{Number(expense.amount).toFixed(2)}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant='outline'
                                  className={
                                    expense.payment_method === "cash"
                                      ? "text-orange-600 border-orange-200 text-xs"
                                      : "text-blue-600 border-blue-200 text-xs"
                                  }
                                >
                                  {expense.payment_method === "cash"
                                    ? "Cash"
                                    : "UPI"}
                                </Badge>
                              </TableCell>
                              <TableCell className='text-sm text-muted-foreground'>
                                {expense.created_by_name || "—"}
                              </TableCell>
                              <TableCell className='text-sm text-muted-foreground'>
                                {expense.notes || "—"}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant='ghost'
                                  size='icon'
                                  className='w-8 h-8 text-destructive hover:text-destructive'
                                  onClick={() => {
                                    setDeletingExpense(expense);
                                    setDeleteOpen(true);
                                  }}
                                >
                                  <Trash2 className='w-4 h-4' />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
              );
            },
          )}

          {/* Overall total */}
          <Separator />
          <div className='flex justify-end gap-6 pr-2'>
            <span className='text-sm text-orange-600'>
              Total Cash: ₹{cashTotal.toFixed(2)}
            </span>
            <span className='text-sm text-blue-600'>
              Total UPI: ₹{upiTotal.toFixed(2)}
            </span>
            <span className='text-sm font-bold text-foreground'>
              Grand Total: ₹{totalAmount.toFixed(2)}
            </span>
          </div>
        </div>
      ) : (
        // ─── Non-admin: simple table for today ──────────────────
        <div className='space-y-3'>
          <Card>
            <CardHeader className='pb-2'>
              <CardTitle className='text-sm text-muted-foreground'>
                {format(new Date(), "dd MMM yyyy")} — {user?.branch}
              </CardTitle>
            </CardHeader>
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

          <Separator />
          <div className='flex justify-end gap-6 pr-2'>
            <span className='text-sm text-orange-600'>
              Cash: ₹{cashTotal.toFixed(2)}
            </span>
            <span className='text-sm text-blue-600'>
              UPI: ₹{upiTotal.toFixed(2)}
            </span>
            <span className='text-sm font-bold text-foreground'>
              Total: ₹{totalAmount.toFixed(2)}
            </span>
          </div>
        </div>
      )}

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
