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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  ArrowUpDown,
  CalendarCheck,
  Trash2,
  Pencil,
} from "lucide-react";
import {
  preBookingService,
  type PreBooking,
} from "@/services/preBookingService";
import { DeleteConfirmDialog } from "@/components/common/DeleteConfirmDialog";
import { useAppSelector } from "@/hooks/useAppSelector";
import { toast } from "sonner";
import { format } from "date-fns";
import { PreBookingViewDialog } from "./PreBookingViewDialog";
import { TablePagination } from "@/components/common/TablePagination";
import { Printer } from "lucide-react";
import { PrintTableLayout } from "@/components/print/PrintTableLayout";
import { usePrintSettings } from "@/hooks/usePrintSettings";
import { triggerPrint } from "@/hooks/usePrint";
import { type PrintSettings } from "@/services/printSettingsService";
import { preBookingPrintColumns } from "@/config/printColumns";

const columnHelper = createColumnHelper<PreBooking>();

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "upi", label: "UPI" },
  { value: "card", label: "Card" },
];

const ORDER_STATUS_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  pending: {
    label: "Pending",
    className: "bg-yellow-500/10 text-yellow-600 border-yellow-200",
  },
  confirmed: {
    label: "Confirmed",
    className: "bg-blue-500/10 text-blue-600 border-blue-200",
  },
  delivered: {
    label: "Delivered",
    className: "bg-green-500/10 text-green-600 border-green-200",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-red-500/10 text-red-600 border-red-200",
  },
};

const PAYMENT_STATUS_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  unpaid: {
    label: "Unpaid",
    className: "bg-red-500/10 text-red-600 border-red-200",
  },
  partial: {
    label: "Partial",
    className: "bg-orange-500/10 text-orange-600 border-orange-200",
  },
  paid: {
    label: "Paid",
    className: "bg-green-500/10 text-green-600 border-green-200",
  },
};

export const PreBookingOrdersPage = () => {
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const isAdmin =
    user?.role === "admin" ||
    user?.role === "storekeeper" ||
    user?.is_super_admin;

  const [orders, setOrders] = useState<PreBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sorting, setSorting] = useState<SortingState>([]);

  // update payment dialog
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentOrder, setPaymentOrder] = useState<PreBooking | null>(null);
  const [additionalPayment, setAdditionalPayment] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentRemarks, setPaymentRemarks] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  // delete
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingOrder, setDeletingOrder] = useState<PreBooking | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewingOrder, setViewingOrder] = useState<PreBooking | null>(null);
  const [viewLoading, setViewLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [allStats, setAllStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    delivered: 0,
    unpaid: 0,
    partial: 0,
  });

  const { getPrintSettings } = usePrintSettings();
  const [printSettings, setPrintSettings] = useState<PrintSettings | null>(
    null,
  );

  const handlePrint = () => {
    const settings = getPrintSettings();
    if (!settings) return;
    setPrintSettings(settings);
    // small delay to let React render the PrintTableLayout
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const fetchOrders = async (overrides?: {
    page?: number;
    limit?: number;
    status?: string;
    forceStatus?: string | null; // null = explicitly "all"
  }) => {
    try {
      setLoading(true);

      let statusToSend: string | undefined;
      if (overrides?.forceStatus === null) {
        statusToSend = undefined; // "all" — no filter
      } else if (overrides?.forceStatus !== undefined) {
        statusToSend = overrides.forceStatus;
      } else {
        statusToSend = statusFilter !== "all" ? statusFilter : undefined;
      }

      const result = await preBookingService.getAll({
        status: statusToSend,
        page: overrides?.page ?? page,
        limit: overrides?.limit ?? limit,
      });
      setOrders(result.data);
      setTotal(result.pagination.total);
      setTotalPages(result.pagination.totalPages);
    } catch {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // fetch all without status filter to get true counts
      const result = await preBookingService.getAll({ page: 1, limit: 1000 });
      const data = result.data;
      setAllStats({
        total: result.pagination.total,
        pending: data.filter((o) => o.order_status === "pending").length,
        confirmed: data.filter((o) => o.order_status === "confirmed").length,
        delivered: data.filter((o) => o.order_status === "delivered").length,
        unpaid: data.filter((o) => o.payment_status === "unpaid").length,
        partial: data.filter((o) => o.payment_status === "partial").length,
      });
    } catch {
      console.error("Failed to fetch stats");
    }
  };

  const handleView = async (order: PreBooking) => {
    setViewLoading(true);
    try {
      const full = await preBookingService.getById(order.id);
      setViewingOrder(full);
      setViewOpen(true);
    } catch {
      toast.error("Failed to load order details");
    } finally {
      setViewLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchStats();
  }, []);

  // ─── Handlers ─────────────────────────────────────────────────

  const handlePaymentUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError("");

    if (!additionalPayment || Number(additionalPayment) <= 0) {
      setPaymentError("Amount must be greater than 0");
      return;
    }
    if (!paymentMethod) {
      setPaymentError("Please select a payment method");
      return;
    }

    setPaymentLoading(true);
    try {
      await preBookingService.updatePayment(paymentOrder!.id, {
        additional_payment: Number(additionalPayment),
        payment_method: paymentMethod,
        remarks: paymentRemarks,
      });
      toast.success("Payment updated successfully");
      await fetchOrders();
      setPaymentOpen(false);
      setPaymentOrder(null);
      setAdditionalPayment("");
      setPaymentMethod("");
      setPaymentRemarks("");
    } catch (err: any) {
      setPaymentError(
        err.response?.data?.message || "Failed to update payment",
      );
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingOrder) return;
    setDeleteLoading(true);
    try {
      await preBookingService.delete(deletingOrder.id);
      toast.success("Order deleted");
      await fetchOrders();
      setDeleteOpen(false);
      setDeletingOrder(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete order");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchOrders({ page: newPage });
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
    fetchOrders({ page: 1, limit: newLimit });
  };

  // ─── Filter ───────────────────────────────────────────────────

  const filtered = useMemo(() => {
    if (!search) return orders;
    return orders.filter(
      (o) =>
        o.order_id.toLowerCase().includes(search.toLowerCase()) ||
        o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
        o.mobile.includes(search) ||
        o.branch_name?.toLowerCase().includes(search.toLowerCase()),
    );
  }, [orders, search]);

  // ─── Stats ────────────────────────────────────────────────────

  const stats = useMemo(
    () => ({
      total: orders.length,
      pending: orders.filter((o) => o.order_status === "pending").length,
      confirmed: orders.filter((o) => o.order_status === "confirmed").length,
      delivered: orders.filter((o) => o.order_status === "delivered").length,
      unpaid: orders.filter((o) => o.payment_status === "unpaid").length,
      partial: orders.filter((o) => o.payment_status === "partial").length,
    }),
    [orders],
  );

  // ─── Columns ──────────────────────────────────────────────────

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "serial",
        header: "#",
        cell: ({ row }) => (
          <span className='text-sm text-muted-foreground'>{row.index + 1}</span>
        ),
      }),
      columnHelper.accessor("order_id", {
        header: "Order ID",
        cell: (info) => (
          <code className='text-xs bg-muted px-2 py-1 rounded font-mono'>
            {info.getValue()}
          </code>
        ),
      }),
      columnHelper.accessor("customer_name", {
        header: ({ column }) => (
          <Button
            variant='ghost'
            size='sm'
            onClick={() => column.toggleSorting()}
            className='gap-1 px-0 font-medium'
          >
            Customer <ArrowUpDown className='w-3.5 h-3.5' />
          </Button>
        ),
        cell: (info) => (
          <div>
            <p className='font-medium text-foreground'>{info.getValue()}</p>
            <p className='text-xs text-muted-foreground font-mono'>
              {info.row.original.mobile}
            </p>
          </div>
        ),
      }),
      columnHelper.accessor("branch_name", {
        header: "Branch",
        cell: (info) => (
          <span className='text-sm text-muted-foreground'>
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor("delivery_date", {
        header: ({ column }) => (
          <Button
            variant='ghost'
            size='sm'
            onClick={() => column.toggleSorting()}
            className='gap-1 px-0 font-medium'
          >
            Delivery <ArrowUpDown className='w-3.5 h-3.5' />
          </Button>
        ),
        cell: (info) => (
          <div>
            <p className='text-sm text-foreground'>
              {format(
                new Date(`${info.getValue().split("T")[0]}T00:00:00`),
                "dd MMM yyyy",
              )}
            </p>
            <p className='text-xs text-muted-foreground'>
              {info.row.original.delivery_time?.slice(0, 5)}
            </p>
          </div>
        ),
      }),
      columnHelper.accessor("final_amount", {
        header: "Final Amount",
        cell: (info) => (
          <span className='font-semibold text-foreground'>
            ₹{Number(info.getValue()).toFixed(2)}
          </span>
        ),
      }),
      columnHelper.accessor("pending_balance", {
        header: "Pending",
        cell: (info) => {
          const val = Number(info.getValue());
          return val > 0 ? (
            <span className='text-sm font-semibold text-destructive'>
              ₹{val.toFixed(2)}
            </span>
          ) : (
            <span className='text-sm font-semibold text-green-600'>
              Cleared
            </span>
          );
        },
      }),
      columnHelper.accessor("payment_status", {
        header: "Payment",
        cell: (info) => {
          const config =
            PAYMENT_STATUS_CONFIG[info.getValue()] ||
            PAYMENT_STATUS_CONFIG.unpaid;
          return (
            <Badge
              variant='outline'
              className={`text-xs border ${config.className}`}
            >
              {config.label}
            </Badge>
          );
        },
      }),
      columnHelper.accessor("order_status", {
        header: "Status",
        cell: (info) => {
          const config =
            ORDER_STATUS_CONFIG[info.getValue()] || ORDER_STATUS_CONFIG.pending;
          return (
            <Badge
              variant='outline'
              className={`text-xs border ${config.className}`}
            >
              {config.label}
            </Badge>
          );
        },
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
              {/* View */}
              <DropdownMenuItem onClick={() => handleView(row?.original)}>
                <Eye className='mr-2 w-4 h-4' />
                {viewLoading ? "Loading..." : "View"}
              </DropdownMenuItem>

              {/* Edit */}
              <DropdownMenuItem
                onClick={() =>
                  navigate(`/dashboard/prebooking/orders/${row.original.id}`)
                }
              >
                <Pencil className='mr-2 w-4 h-4' />
                Edit
              </DropdownMenuItem>

              {/* Delete — admin only */}
              {isAdmin && (
                <DropdownMenuItem
                  className='text-destructive focus:text-destructive'
                  onClick={() => {
                    setDeletingOrder(row.original);
                    setDeleteOpen(true);
                  }}
                >
                  <Trash2 className='mr-2 w-4 h-4' />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      }),
    ],
    [isAdmin, navigate],
  );

  const table = useReactTable({
    data: filtered, // ← was orders, change to filtered
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  // ─── Render ───────────────────────────────────────────────────

  return (
    <div className='space-y-4'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-xl font-bold text-foreground'>
            Pre-Booking Orders
          </h2>
          <p className='text-sm text-muted-foreground mt-1'>
            Manage all pre-booking orders.
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            onClick={handlePrint}
            disabled={orders.length === 0}
            className='gap-2'
          >
            <Printer className='w-4 h-4' />
            Print
          </Button>
          <Button
            onClick={() => navigate("/dashboard/prebooking/new")}
            className='gap-2'
          >
            <Plus className='w-4 h-4' />
            New Order
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
        <Card>
          <CardContent className='pt-3 space-y-1'>
            <p className='text-xs text-muted-foreground'>Total Orders</p>
            <p className='text-2xl font-bold text-foreground'>
              {allStats.total}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='pt-3 space-y-1'>
            <p className='text-xs text-muted-foreground'>Pending</p>
            <p className='text-2xl font-bold text-yellow-600'>
              {allStats.pending}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='pt-3 space-y-1'>
            <p className='text-xs text-muted-foreground'>Unpaid</p>
            <p className='text-2xl font-bold text-destructive'>
              {allStats.unpaid}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='pt-3 space-y-1'>
            <p className='text-xs text-muted-foreground'>Partial</p>
            <p className='text-2xl font-bold text-orange-600'>
              {allStats.partial}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search + Status filter */}
      <div className='flex flex-wrap gap-3 items-center'>
        <div className='relative w-full sm:max-w-xs'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground' />
          <Input
            placeholder='Search by order ID, customer, mobile...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='pl-9'
          />
        </div>

        <div className='flex gap-2 flex-wrap'>
          {["all", "pending", "confirmed", "delivered", "cancelled"].map(
            (s) => (
              <Button
                key={s}
                size='sm'
                variant={statusFilter === s ? "default" : "outline"}
                onClick={() => {
                  setStatusFilter(s);
                  setPage(1);
                  fetchOrders({
                    page: 1,
                    forceStatus: s === "all" ? null : s,
                  });
                }}
                className='capitalize'
              >
                {s}
                {s === "pending" && allStats.pending > 0 && (
                  <Badge className='ml-1.5 h-4 w-4 p-0 flex items-center justify-center text-xs bg-yellow-500 text-white'>
                    {allStats.pending}
                  </Badge>
                )}
              </Button>
            ),
          )}
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
                    Loading orders...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className='text-center py-16'
                  >
                    <div className='flex flex-col items-center gap-3 text-muted-foreground'>
                      <CalendarCheck className='w-10 h-10 opacity-30' />
                      <p className='text-sm'>No orders found.</p>
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() => navigate("/dashboard/prebooking/new")}
                        className='gap-2'
                      >
                        <Plus className='w-4 h-4' />
                        Create first order
                      </Button>
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
          <TablePagination
            page={page}
            totalPages={totalPages}
            total={total}
            limit={limit}
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
          />
        </CardContent>
      </Card>

      <p className='text-xs text-muted-foreground'>
        Showing {filtered.length} of {orders.length} orders
      </p>

      {/* Update Payment Dialog */}
      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent className='sm:max-w-sm'>
          <DialogHeader>
            <DialogTitle>
              Update Payment
              {paymentOrder && (
                <span className='text-muted-foreground font-normal text-sm ml-2'>
                  — {paymentOrder.order_id}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePaymentUpdate} className='space-y-4 py-2'>
            {/* Summary */}
            {paymentOrder && (
              <div className='grid grid-cols-3 gap-3 p-3 rounded-md bg-muted text-center'>
                <div>
                  <p className='text-xs text-muted-foreground'>Final</p>
                  <p className='text-sm font-semibold'>
                    ₹{Number(paymentOrder.final_amount).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className='text-xs text-muted-foreground'>Paid</p>
                  <p className='text-sm font-semibold text-green-600'>
                    ₹{Number(paymentOrder.amount_paid).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className='text-xs text-muted-foreground'>Balance</p>
                  <p className='text-sm font-semibold text-destructive'>
                    ₹{Number(paymentOrder.pending_balance).toFixed(2)}
                  </p>
                </div>
              </div>
            )}

            <div className='space-y-2'>
              <p className='text-xs text-muted-foreground'>
                Max payable: ₹
                {Number(paymentOrder?.pending_balance || 0).toFixed(2)}
              </p>
              <Input
                type='number'
                min='0.01'
                step='0.01'
                max={Number(paymentOrder?.pending_balance || 0)}
                placeholder='Enter amount'
                value={additionalPayment}
                onChange={(e) => setAdditionalPayment(e.target.value)}
                required
              />
            </div>

            <div className='space-y-2'>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder='Payment method' />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Input
                placeholder='Remarks (optional)'
                value={paymentRemarks}
                onChange={(e) => setPaymentRemarks(e.target.value)}
              />
            </div>

            {paymentError && (
              <p className='text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md'>
                {paymentError}
              </p>
            )}

            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => setPaymentOpen(false)}
              >
                Cancel
              </Button>
              <Button type='submit' disabled={paymentLoading}>
                {paymentLoading ? "Saving..." : "Record Payment"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <PreBookingViewDialog
        open={viewOpen}
        onClose={() => {
          setViewOpen(false);
          setViewingOrder(null);
        }}
        order={viewingOrder}
      />

      {/* Delete */}
      <DeleteConfirmDialog
        open={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setDeletingOrder(null);
        }}
        onConfirm={handleDelete}
        title='Delete Order'
        description={`Delete order "${deletingOrder?.order_id}" for ${deletingOrder?.customer_name}? This cannot be undone.`}
        loading={deleteLoading}
      />

      {printSettings && (
        <PrintTableLayout
          settings={
            printSettings || {
              id: 0,
              name: "Restaurant",
              print_company_name: "",
              print_address: null,
              print_contact: null,
              print_footer_note: null,
            }
          }
          title='Pre-Booking Orders'
          columns={preBookingPrintColumns}
          data={orders}
          summary={[
            { label: "Total Orders:", value: String(total) },
            {
              label: "Total Amount:",
              value: `₹${orders.reduce((s, o) => s + Number(o.final_amount), 0).toFixed(2)}`,
            },
            {
              label: "Total Paid:",
              value: `₹${orders.reduce((s, o) => s + Number(o.amount_paid), 0).toFixed(2)}`,
            },
          ]}
        />
      )}
    </div>
  );
};
