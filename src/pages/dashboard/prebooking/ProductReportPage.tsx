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
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Filter, ArrowUpDown, BarChart2, Eye } from "lucide-react";
import { Combobox } from "@/components/common/Combobox";
import { DatePicker } from "@/components/ui/date-picker";
import {
  type ProductReportRow,
  type ProductReportStats,
} from "@/services/preBookingService";
import { productService, type Product } from "@/services/productService";
import { branchService, type Branch } from "@/services/branchService";
import { toast } from "sonner";
import { format } from "date-fns";
import { PreBookingViewDialog } from "./PreBookingViewDialog";
import {
  preBookingService,
  type PreBooking,
} from "@/services/preBookingService";

const columnHelper = createColumnHelper<ProductReportRow>();

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

export const ProductReportPage = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [branchId, setBranchId] = useState("");
  const [productId, setProductId] = useState("");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  const [rows, setRows] = useState<ProductReportRow[]>([]);
  const [stats, setStats] = useState<ProductReportStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewingOrder, setViewingOrder] = useState<PreBooking | null>(null);
  const [viewLoading, setViewLoading] = useState(false);

  const handleView = async (bookingId: number) => {
    setViewLoading(true);
    try {
      const data = await preBookingService.getById(bookingId);
      setViewingOrder(data);
      setViewOpen(true);
    } catch {
      toast.error("Failed to load order details");
    } finally {
      setViewLoading(false);
    }
  };

  useEffect(() => {
    branchService
      .getAll()
      .then((data) => setBranches(data.filter((b) => b.is_active)));
    productService
      .getAll()
      .then((data) => setProducts(data.filter((p) => p.is_active)));
  }, []);

  const handleFilter = async () => {
    if (!productId) {
      toast.error("Please select a product");
      return;
    }
    if (!dateFrom || !dateTo) {
      toast.error("Please select both dates");
      return;
    }
    if (dateFrom > dateTo) {
      toast.error("From date cannot be after To date");
      return;
    }

    setLoading(true);
    try {
      const data = await preBookingService.getProductReport({
        branch_id: branchId || undefined,
        product_id: productId,
        date_from: format(dateFrom, "yyyy-MM-dd"),
        date_to: format(dateTo, "yyyy-MM-dd"),
      });
      setRows(data.rows);
      setStats(data.stats);
      setSearched(true);
      if (data.rows.length === 0) {
        toast.info("No orders found for selected filters");
      }
    } catch {
      toast.error("Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor("order_id", {
        header: "Order #",
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
          <span className='font-medium text-foreground'>{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor("mobile", {
        header: "Mobile",
        cell: (info) => (
          <span className='text-sm font-mono text-muted-foreground'>
            {info.getValue()}
          </span>
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
            Delivery Date <ArrowUpDown className='w-3.5 h-3.5' />
          </Button>
        ),
        cell: (info) =>
          format(new Date(`${info.getValue()}T00:00:00`), "dd MMM yyyy"),
      }),
      columnHelper.accessor("product_name", {
        header: "Product",
        cell: (info) => (
          <span className='font-medium text-foreground'>{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor("quantity", {
        header: "Qty",
        cell: (info) => (
          <span className='text-sm font-semibold text-foreground'>
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor("unit_price", {
        header: "Unit Price",
        cell: (info) => (
          <span className='text-sm text-foreground'>
            ₹{Number(info.getValue()).toFixed(2)}
          </span>
        ),
      }),
      columnHelper.accessor("product_discount", {
        header: "Disc",
        cell: (info) => (
          <span className='text-sm text-orange-600'>
            {Number(info.getValue()) > 0
              ? `₹${Number(info.getValue()).toFixed(2)}`
              : "—"}
          </span>
        ),
      }),
      columnHelper.accessor("item_total", {
        header: "Item Total",
        cell: (info) => (
          <span className='text-sm font-semibold text-foreground'>
            ₹{Number(info.getValue()).toFixed(2)}
          </span>
        ),
      }),
      columnHelper.accessor("order_total", {
        header: "Order Total",
        cell: (info) => (
          <span className='text-sm text-muted-foreground'>
            ₹{Number(info.getValue()).toFixed(2)}
          </span>
        ),
      }),
      columnHelper.accessor("amount_paid", {
        header: "Paid",
        cell: (info) => (
          <span className='text-sm font-medium text-green-600'>
            ₹{Number(info.getValue()).toFixed(2)}
          </span>
        ),
      }),
      columnHelper.accessor("payment_status", {
        header: "Payment Status",
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
      columnHelper.display({
        id: "view",
        header: "",
        cell: ({ row }) => (
          <Button
            variant='ghost'
            size='icon'
            className='w-8 h-8'
            onClick={() => handleView(row.original.booking_id)}
            disabled={viewLoading}
          >
            <Eye className='w-4 h-4' />
          </Button>
        ),
      }),
    ],
    [],
  );

  const table = useReactTable({
    data: rows,
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
        <h2 className='text-xl font-bold text-foreground'>
          Product-Wise Pre-Booking Report
        </h2>
        <p className='text-sm text-muted-foreground mt-1'>
          View pre-booking orders filtered by product and date range.
        </p>
      </div>

      {/* Filter card */}
      <Card>
        <CardContent className='pt-4'>
          <div className='flex flex-wrap gap-4 items-end'>
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

            {/* Product */}
            <div className='space-y-2 w-56'>
              <Label>
                Product <span className='text-destructive'>*</span>
              </Label>
              <Combobox
                options={products.map((p) => ({
                  value: String(p.id),
                  label: p.name,
                }))}
                value={productId}
                onChange={setProductId}
                placeholder='Select product'
                searchPlaceholder='Search products...'
                emptyText='No products found.'
              />
            </div>

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
                placeholder='End date'
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
      {searched && stats && (
        <div className='space-y-4'>
          {/* Stats */}
          <div className='grid grid-cols-2 sm:grid-cols-4 gap-4'>
            <Card>
              <CardContent className='pt-4 space-y-1'>
                <p className='text-xs text-muted-foreground'>Total Orders</p>
                <p className='text-2xl font-bold text-foreground'>
                  {stats.total_orders}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className='pt-4 space-y-1'>
                <p className='text-xs text-muted-foreground'>Total Qty</p>
                <p className='text-2xl font-bold text-foreground'>
                  {stats.total_qty}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className='pt-4 space-y-1'>
                <p className='text-xs text-muted-foreground'>
                  Total Item Value
                </p>
                <p className='text-2xl font-bold text-foreground'>
                  ₹{stats.total_item_value.toFixed(2)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className='pt-4 space-y-1'>
                <p className='text-xs text-muted-foreground'>Total Paid</p>
                <p className='text-2xl font-bold text-green-600'>
                  ₹{stats.total_paid.toFixed(2)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Table */}
          {rows.length === 0 ? (
            <div className='text-center py-12 text-muted-foreground'>
              <BarChart2 className='w-10 h-10 opacity-30 mx-auto mb-3' />
              <p className='text-sm'>No orders found.</p>
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
                <span className='text-sm text-muted-foreground'>
                  Total Qty:{" "}
                  <span className='font-semibold text-foreground'>
                    {stats.total_qty}
                  </span>
                </span>
                <span className='text-sm text-muted-foreground'>
                  Item Value:{" "}
                  <span className='font-semibold text-foreground'>
                    ₹{stats.total_item_value.toFixed(2)}
                  </span>
                </span>
                <span className='text-sm text-muted-foreground'>
                  Total Paid:{" "}
                  <span className='font-semibold text-green-600'>
                    ₹{stats.total_paid.toFixed(2)}
                  </span>
                </span>
              </div>

              <p className='text-xs text-muted-foreground'>
                {rows.length} order{rows.length !== 1 ? "s" : ""} found
              </p>
            </div>
          )}
        </div>
      )}

      {!searched && (
        <div className='text-center py-16 text-muted-foreground'>
          <BarChart2 className='w-10 h-10 opacity-30 mx-auto mb-3' />
          <p className='text-sm'>
            Select product and date range, then click Filter.
          </p>
        </div>
      )}

      <PreBookingViewDialog
        open={viewOpen}
        onClose={() => {
          setViewOpen(false);
          setViewingOrder(null);
        }}
        order={viewingOrder}
      />
    </div>
  );
};
