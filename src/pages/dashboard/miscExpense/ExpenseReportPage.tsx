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
import { Separator } from "@/components/ui/separator";
import {
  Filter,
  ArrowUpDown,
  BarChart2,
  Search,
  Eye,
  Pencil,
  Trash2,
  MoreHorizontal,
} from "lucide-react";
import { Combobox } from "@/components/common/Combobox";
import { DatePicker } from "@/components/ui/date-picker";
import {
  miscExpenseService,
  type MiscExpense,
  type MiscExpenseReportStats,
} from "@/services/miscExpenseService";
import { branchService, type Branch } from "@/services/branchService";
import { useAppSelector } from "@/hooks/useAppSelector";
import { toast } from "sonner";
import { format } from "date-fns";

import { MiscExpenseViewDialog } from "./MiscExpenseViewDialog";
import { MiscExpenseEditDialog } from "./MiscExpenseEditDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const columnHelper = createColumnHelper<MiscExpense>();

export const ExpenseReportPage = () => {
  const user = useAppSelector((state) => state.auth.user);

  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchId, setBranchId] = useState("");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [paymentMethod, setPaymentMethod] = useState("");

  const [expenses, setExpenses] = useState<MiscExpense[]>([]);
  const [stats, setStats] = useState<MiscExpenseReportStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [search, setSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([
    { id: "expense_date", desc: true },
  ]);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingExpense, setDeletingExpense] = useState<MiscExpense | null>(
    null,
  );

  const isAdmin = user?.role === "admin" || user?.is_super_admin;

  const [viewOpen, setViewOpen] = useState(false);
  const [viewingExpense, setViewingExpense] = useState<MiscExpense | null>(
    null,
  );

  const [editOpen, setEditOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<MiscExpense | null>(
    null,
  );

  useEffect(() => {
    branchService
      .getAll()
      .then((data) => setBranches(data.filter((b) => b.is_active)));
  }, []);

  const handleFilter = async () => {
    if (!dateFrom || !dateTo) {
      toast.error("Please select both dates");
      return;
    }
    setLoading(true);
    try {
      const data = await miscExpenseService.getReport({
        date_from: format(dateFrom, "yyyy-MM-dd"),
        date_to: format(dateTo, "yyyy-MM-dd"),
        branch_id: branchId || undefined,
        payment_method: paymentMethod || undefined,
      });
      setExpenses(data.expenses);
      setStats(data.stats);
      setSearched(true);
      if (data.expenses.length === 0) {
        toast.info("No expenses found for selected filters");
      }
    } catch {
      toast.error("Failed to load expense report");
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return expenses;
    const q = search.toLowerCase();
    return expenses.filter(
      (e) =>
        e.expense_type_name.toLowerCase().includes(q) ||
        e.subcategory_name?.toLowerCase().includes(q) ||
        e.branch_name.toLowerCase().includes(q) ||
        e.created_by_name?.toLowerCase().includes(q),
    );
  }, [expenses, search]);

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "serial",
        header: "S.No",
        cell: ({ row }) => (
          <span className='text-sm text-muted-foreground'>{row.index + 1}</span>
        ),
      }),
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
        cell: (info) => format(new Date(info.getValue()), "dd MMM yyyy"),
      }),
      columnHelper.accessor("branch_name", {
        header: ({ column }) => (
          <Button
            variant='ghost'
            size='sm'
            onClick={() => column.toggleSorting()}
            className='gap-1 px-0 font-medium'
          >
            Branch <ArrowUpDown className='w-3.5 h-3.5' />
          </Button>
        ),
        cell: (info) => (
          <span className='font-medium text-foreground'>{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor("expense_type_name", {
        header: "Expense Type",
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
    [],
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
      {/* Header */}
      <div>
        <h2 className='text-xl font-bold text-foreground'>Expense Report</h2>
        <p className='text-sm text-muted-foreground mt-1'>
          View miscellaneous expenses across branches by date range.
        </p>
      </div>

      {/* Filter card */}
      <Card>
        <CardContent className='pt-4'>
          <div className='flex flex-wrap gap-4 items-end'>
            {/* From date */}
            <div className='space-y-2'>
              <Label>From Date</Label>
              <DatePicker
                date={dateFrom}
                setDate={setDateFrom}
                placeholder='Start date'
              />
            </div>

            {/* To date */}
            <div className='space-y-2'>
              <Label>To Date</Label>
              <DatePicker
                date={dateTo}
                setDate={setDateTo}
                placeholder='Start date'
              />
            </div>

            {/* Branch */}
            <div className='space-y-2 w-48'>
              <Label>Branch</Label>
              <Combobox
                options={[
                  { value: "", label: "All Branches" },
                  ...branches.map((b) => ({
                    value: String(b.id),
                    label: b.name,
                  })),
                ]}
                value={branchId}
                onChange={setBranchId}
                placeholder='All Branches'
                searchPlaceholder='Search branches...'
                emptyText='No branches found.'
              />
            </div>

            {/* Payment mode */}
            <div className='space-y-2 w-36'>
              <Label>Payment Mode</Label>
              <Combobox
                options={[
                  { value: "", label: "All" },
                  { value: "cash", label: "Cash" },
                  { value: "upi", label: "UPI" },
                ]}
                value={paymentMethod}
                onChange={setPaymentMethod}
                placeholder='All'
                searchPlaceholder=''
                emptyText=''
              />
            </div>

            <Button onClick={handleFilter} disabled={loading} className='gap-2'>
              <Filter className='w-4 h-4' />
              {loading ? "Filtering..." : "Filter"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {searched && (
        <div className='space-y-4'>
          {/* Stats */}
          {stats && (
            <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
              <Card>
                <CardContent className='pt-4 space-y-1'>
                  <p className='text-xs text-muted-foreground'>
                    Total Expenses
                  </p>
                  <p className='text-2xl font-bold text-foreground'>
                    ₹{stats.total.toFixed(2)}
                  </p>
                  <p className='text-xs text-muted-foreground'>
                    {expenses.length} records
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className='pt-4 space-y-1'>
                  <p className='text-xs text-muted-foreground'>Cash</p>
                  <p className='text-2xl font-bold text-orange-600'>
                    ₹{stats.cash.toFixed(2)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className='pt-4 space-y-1'>
                  <p className='text-xs text-muted-foreground'>UPI</p>
                  <p className='text-2xl font-bold text-blue-600'>
                    ₹{stats.upi.toFixed(2)}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Search */}
          <div className='relative w-full sm:max-w-xs'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground' />
            <Input
              placeholder='Search type, subcategory, branch...'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className='pl-9'
            />
          </div>

          {/* Table */}
          {filtered.length === 0 ? (
            <div className='text-center py-12 text-muted-foreground'>
              <BarChart2 className='w-10 h-10 opacity-30 mx-auto mb-3' />
              <p className='text-sm'>No expenses found.</p>
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

              <Separator />
              <div className='flex justify-end gap-6 pr-2'>
                <span className='text-sm text-orange-600'>
                  Cash: ₹{stats?.cash.toFixed(2)}
                </span>
                <span className='text-sm text-blue-600'>
                  UPI: ₹{stats?.upi.toFixed(2)}
                </span>
                <span className='text-sm font-bold text-foreground'>
                  Total: ₹{stats?.total.toFixed(2)}
                </span>
              </div>

              <p className='text-xs text-muted-foreground'>
                Showing {filtered.length} of {expenses.length} records
              </p>
            </div>
          )}
        </div>
      )}

      {!searched && (
        <div className='text-center py-16 text-muted-foreground'>
          <BarChart2 className='w-10 h-10 opacity-30 mx-auto mb-3' />
          <p className='text-sm'>
            Select date range and click Filter to view expense report.
          </p>
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
        onSuccess={handleFilter}
        expense={editingExpense}
      />
    </div>
  );
};
