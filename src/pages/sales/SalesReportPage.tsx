import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
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
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Filter,
  ArrowUpDown,
  TrendingUp,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
} from "lucide-react";
import { Combobox } from "@/components/common/Combobox";
import { DatePicker } from "@/components/ui/date-picker";
import {
  dailySalesService,
  type DailySales,
} from "@/services/dailySalesService";
import { branchService, type Branch } from "@/services/branchService";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteConfirmDialog } from "@/components/common/DeleteConfirmDialog";
import { useAppSelector } from "@/hooks/useAppSelector";

const columnHelper = createColumnHelper<DailySales>();

export const SalesReportPage = () => {
  const navigate = useNavigate();

  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchId, setBranchId] = useState("");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  const [sales, setSales] = useState<DailySales[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([
    { id: "sale_date", desc: true },
  ]);

  const user = useAppSelector((state) => state.auth.user);
  const isAdmin = user?.role === "admin" || user?.is_super_admin;
  const today = new Date().toLocaleDateString("en-CA");

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingRecord, setDeletingRecord] = useState<DailySales | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleDelete = async () => {
    if (!deletingRecord) return;
    setDeleteLoading(true);
    try {
      // add delete to service — see below
      await dailySalesService.delete(deletingRecord.id);
      toast.success("Sales record deleted");
      await fetchData({
        branch_id: branchId || undefined,
        date_from: dateFrom ? format(dateFrom, "yyyy-MM-dd") : undefined,
        date_to: dateTo ? format(dateTo, "yyyy-MM-dd") : undefined,
      });

      setDeleteOpen(false);
      setDeletingRecord(null);
    } catch {
      toast.error("Failed to delete record");
    } finally {
      setDeleteLoading(false);
    }
  };

  useEffect(() => {
    branchService
      .getAll()
      .then((data) => setBranches(data.filter((b) => b.is_active)));
  }, []);

  // auto-load on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async (filters?: {
    branch_id?: string;
    date_from?: string;
    date_to?: string;
  }) => {
    setLoading(true);
    try {
      const data = await dailySalesService.getAll(
        filters || {
          branch_id: !isAdmin ? String(user?.branch_id || "") : undefined,
        },
      );
      setSales(data);
      setSearched(true);
    } catch {
      toast.error("Failed to load sales report");
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = async () => {
    setLoading(true);
    try {
      const data = await fetchData({
        branch_id: branchId || undefined,
        date_from: dateFrom ? format(dateFrom, "yyyy-MM-dd") : undefined,
        date_to: dateTo ? format(dateTo, "yyyy-MM-dd") : undefined,
      });

      setSales(data);
      setSearched(true);
      if (data.length === 0) toast.info("No sales records found");
    } catch {
      toast.error("Failed to load sales report");
    } finally {
      setLoading(false);
    }
  };

  // ─── Stats ────────────────────────────────────────────────────

  const stats = useMemo(
    () => ({
      totalNetSales: sales.reduce((s, r) => s + Number(r.net_sales), 0),
      totalNetCounter: sales.reduce((s, r) => s + Number(r.net_counter), 0),
      totalDifference: sales.reduce((s, r) => s + Number(r.difference), 0),
      totalCash: sales.reduce((s, r) => s + Number(r.cash), 0),
      totalUpi: sales.reduce((s, r) => s + Number(r.upi), 0),
    }),
    [sales],
  );

  // ─── Columns ──────────────────────────────────────────────────

  const columns = useMemo(
    () => [
      columnHelper.accessor("sale_date", {
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
        cell: (info) =>
          format(
            new Date(`${info.getValue().split("T")[0]}T00:00:00`),
            "dd MMM yyyy",
          ),
      }),
      columnHelper.accessor("branch_name", {
        header: "Branch",
        cell: (info) => (
          <span className='font-medium text-foreground'>{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor("petpooja_total", {
        header: "PetPooja",
        cell: (info) => `₹${Number(info.getValue()).toFixed(2)}`,
      }),
      columnHelper.accessor("ns_total", {
        header: "NS Total",
        cell: (info) => `₹${Number(info.getValue()).toFixed(2)}`,
      }),
      columnHelper.accessor("outdoor_catering", {
        header: "Outdoor",
        cell: (info) => `₹${Number(info.getValue()).toFixed(2)}`,
      }),
      columnHelper.accessor("upi", {
        header: "UPI",
        cell: (info) => `₹${Number(info.getValue()).toFixed(2)}`,
      }),
      columnHelper.accessor("cash", {
        header: "Cash",
        cell: (info) => `₹${Number(info.getValue()).toFixed(2)}`,
      }),
      columnHelper.accessor("swiggy", {
        header: "Swiggy",
        cell: (info) => `₹${Number(info.getValue()).toFixed(2)}`,
      }),
      columnHelper.accessor("zomato", {
        header: "Zomato",
        cell: (info) => `₹${Number(info.getValue()).toFixed(2)}`,
      }),
      columnHelper.accessor("net_sales", {
        header: ({ column }) => (
          <Button
            variant='ghost'
            size='sm'
            onClick={() => column.toggleSorting()}
            className='gap-1 px-0 font-medium'
          >
            Net Sales <ArrowUpDown className='w-3.5 h-3.5' />
          </Button>
        ),
        cell: (info) => (
          <span className='font-semibold text-foreground'>
            ₹{Number(info.getValue()).toFixed(2)}
          </span>
        ),
      }),
      columnHelper.accessor("net_counter", {
        header: "Net Counter",
        cell: (info) => (
          <span className='font-semibold text-foreground'>
            ₹{Number(info.getValue()).toFixed(2)}
          </span>
        ),
      }),
      columnHelper.accessor("difference", {
        header: "Difference",
        cell: (info) => {
          const val = Number(info.getValue());
          return (
            <span
              className={cn(
                "font-bold text-sm",
                val === 0
                  ? "text-green-600"
                  : val > 0
                    ? "text-orange-600"
                    : "text-destructive",
              )}
            >
              {val > 0 ? "+" : ""}
              {val.toFixed(2)}
            </span>
          );
        },
      }),
      columnHelper.display({
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const record = row.original;
          const recordDate = record.sale_date.split("T")[0];
          const isToday = recordDate === today;
          const canEdit = isAdmin || isToday;

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='ghost' size='icon' className='w-8 h-8'>
                  <MoreHorizontal className='w-4 h-4' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                {/* View */}
                <DropdownMenuItem
                  onClick={() =>
                    navigate(
                      `/dashboard/sales/add?branch_id=${record.branch_id}&date=${recordDate}`,
                    )
                  }
                >
                  <Eye className='mr-2 w-4 h-4' />
                  View
                </DropdownMenuItem>

                {/* Edit — admin always, branch only today */}
                {canEdit && (
                  <DropdownMenuItem
                    onClick={() =>
                      navigate(
                        `/dashboard/sales/add?branch_id=${record.branch_id}&date=${recordDate}`,
                      )
                    }
                  >
                    <Pencil className='mr-2 w-4 h-4' />
                    Edit
                  </DropdownMenuItem>
                )}

                {/* Delete — admin only */}
                {isAdmin && (
                  <DropdownMenuItem
                    className='text-destructive focus:text-destructive'
                    onClick={() => {
                      setDeletingRecord(record);
                      setDeleteOpen(true);
                    }}
                  >
                    <Trash2 className='mr-2 w-4 h-4' />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      }),
    ],
    [],
  );

  const table = useReactTable({
    data: sales,
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
        <h2 className='text-xl font-bold text-foreground'>Sales Report</h2>
        <p className='text-sm text-muted-foreground mt-1'>
          View daily sales across branches.
        </p>
      </div>

      {/* Filters */}
      <div className='w-full overflow-x-auto'>
        <Card>
          <CardContent className='pt-4'>
            <div className='flex flex-wrap gap-4 items-end'>
              {isAdmin && (
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
                    searchPlaceholder='Search...'
                    emptyText='No branches.'
                  />
                </div>
              )}

              <div className='space-y-2'>
                <Label>From Date</Label>
                <DatePicker
                  date={dateFrom}
                  setDate={setDateFrom}
                  placeholder='Start date'
                />
              </div>

              <div className='space-y-2'>
                <Label>To Date</Label>
                <DatePicker
                  date={dateTo}
                  setDate={setDateTo}
                  placeholder='End date'
                />
              </div>

              <Button
                onClick={handleFilter}
                disabled={loading}
                className='gap-2'
              >
                <Filter className='w-4 h-4' />
                {loading ? "Loading..." : "Filter"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results */}
      {searched && (
        <div className='space-y-4'>
          {/* Stats */}
          <div className='grid grid-cols-2 sm:grid-cols-5 gap-3'>
            <Card>
              <CardContent className='pt-3 space-y-1'>
                <p className='text-xs text-muted-foreground'>Net Sales</p>
                <p className='text-xl font-bold text-foreground'>
                  ₹{stats.totalNetSales.toFixed(2)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className='pt-3 space-y-1'>
                <p className='text-xs text-muted-foreground'>Net Counter</p>
                <p className='text-xl font-bold text-foreground'>
                  ₹{stats.totalNetCounter.toFixed(2)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className='pt-3 space-y-1'>
                <p className='text-xs text-muted-foreground'>Difference</p>
                <p
                  className={cn(
                    "text-xl font-bold",
                    stats.totalDifference === 0
                      ? "text-green-600"
                      : stats.totalDifference > 0
                        ? "text-orange-600"
                        : "text-destructive",
                  )}
                >
                  {stats.totalDifference > 0 ? "+" : ""}
                  {stats.totalDifference.toFixed(2)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className='pt-3 space-y-1'>
                <p className='text-xs text-muted-foreground'>Total Cash</p>
                <p className='text-xl font-bold text-orange-600'>
                  ₹{stats.totalCash.toFixed(2)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className='pt-3 space-y-1'>
                <p className='text-xs text-muted-foreground'>Total UPI</p>
                <p className='text-xl font-bold text-blue-600'>
                  ₹{stats.totalUpi.toFixed(2)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Table */}
          {sales.length === 0 ? (
            <div className='text-center py-12 text-muted-foreground'>
              <TrendingUp className='w-10 h-10 opacity-30 mx-auto mb-3' />
              <p className='text-sm'>No sales records found.</p>
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
              <p className='text-xs text-muted-foreground'>
                {sales.length} record{sales.length !== 1 ? "s" : ""} found
              </p>
            </div>
          )}
        </div>
      )}

      {!searched && (
        <div className='text-center py-16 text-muted-foreground'>
          <TrendingUp className='w-10 h-10 opacity-30 mx-auto mb-3' />
          <p className='text-sm'>
            Select filters and click Filter to view sales report.
          </p>
        </div>
      )}

      <DeleteConfirmDialog
        open={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setDeletingRecord(null);
        }}
        onConfirm={handleDelete}
        title='Delete Sales Record'
        description={`Delete sales record for ${deletingRecord?.branch_name} on ${deletingRecord?.sale_date?.split("T")[0]}? This cannot be undone.`}
        loading={deleteLoading}
      />
    </div>
  );
};
