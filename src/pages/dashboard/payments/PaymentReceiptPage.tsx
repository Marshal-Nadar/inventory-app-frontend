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
import { Filter, ArrowUpDown, Receipt } from "lucide-react";
import { Combobox } from "@/components/common/Combobox";
import {
  vendorPaymentService,
  type PaymentReceipt,
} from "@/services/vendorPaymentService";
import { vendorService, type Vendor } from "@/services/vendorService";
import { toast } from "sonner";
import { DatePicker } from "@/components/ui/date-picker";

const columnHelper = createColumnHelper<PaymentReceipt>();

const MODE_LABEL: Record<string, string> = {
  cash: "Cash",
  upi: "UPI",
  bank_transfer: "Bank Transfer",
  cheque: "Cheque",
};

const MODE_TYPE: Record<string, string> = {
  cash: "Cash",
  upi: "Online",
  bank_transfer: "Online",
  cheque: "Online",
};

export const PaymentReceiptPage = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [vendorId, setVendorId] = useState("");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [paymentMode, setPaymentMode] = useState("");
  const [receipts, setReceipts] = useState<PaymentReceipt[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);

  useEffect(() => {
    vendorService.getAll().then(setVendors);
  }, []);

  const handleFilter = async () => {
    setLoading(true);
    try {
      const data = await vendorPaymentService.getReceipts({
        vendor_id: vendorId || undefined,
        date_from: dateFrom ? dateFrom.toISOString().split("T")[0] : undefined,
        date_to: dateTo ? dateTo.toISOString().split("T")[0] : undefined,
        payment_mode: paymentMode || undefined,
      });
      setReceipts(data.receipts);
      setTotalAmount(data.total_amount);
      setSearched(true);
      if (data.receipts.length === 0) {
        toast.info("No receipts found for the selected filters");
      }
    } catch {
      toast.error("Failed to load receipts");
    } finally {
      setLoading(false);
    }
  };

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "serial",
        header: "S.No",
        cell: ({ row }) => (
          <span className='text-sm text-muted-foreground'>{row.index + 1}</span>
        ),
      }),
      columnHelper.accessor("payment_date", {
        header: ({ column }) => (
          <Button
            variant='ghost'
            size='sm'
            onClick={() => column.toggleSorting()}
            className='gap-1 px-0 font-medium'
          >
            Payment Date <ArrowUpDown className='w-3.5 h-3.5' />
          </Button>
        ),
        cell: (info) =>
          new Date(info.getValue()).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }),
      }),
      columnHelper.accessor("vendor_name", {
        header: "Vendor",
        cell: (info) => (
          <span className='font-medium text-foreground'>{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor("invoice_number", {
        header: "Invoice No",
        cell: (info) => (
          <code className='text-xs bg-muted px-2 py-1 rounded'>
            {info.getValue()}
          </code>
        ),
      }),
      columnHelper.accessor("invoice_amount", {
        header: "Invoice Amount",
        cell: (info) => (
          <span className='text-sm text-muted-foreground'>
            ₹{Number(info.getValue()).toFixed(2)}
          </span>
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
            Amount Paid <ArrowUpDown className='w-3.5 h-3.5' />
          </Button>
        ),
        cell: (info) => (
          <span className='text-sm font-semibold text-green-600'>
            ₹{Number(info.getValue()).toFixed(2)}
          </span>
        ),
      }),
      columnHelper.accessor("payment_mode", {
        header: "Mode",
        cell: (info) => {
          const mode = info.getValue();
          const isOnline = MODE_TYPE[mode] === "Online";
          return (
            <div className='flex items-center gap-1.5'>
              <span className='text-sm'>{MODE_LABEL[mode] || mode}</span>
              <Badge
                variant='outline'
                className={
                  isOnline
                    ? "text-blue-600 border-blue-200 text-xs"
                    : "text-orange-600 border-orange-200 text-xs"
                }
              >
                {MODE_TYPE[mode]}
              </Badge>
            </div>
          );
        },
      }),
      columnHelper.accessor("recorded_by", {
        header: "Recorded By",
        cell: (info) => (
          <span className='text-sm text-muted-foreground'>
            {info.getValue() || "—"}
          </span>
        ),
      }),
    ],
    [],
  );

  const table = useReactTable({
    data: receipts,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const cashTotal = useMemo(
    () =>
      receipts
        .filter((r) => r.payment_mode === "cash")
        .reduce((sum, r) => sum + Number(r.amount), 0),
    [receipts],
  );

  const onlineTotal = useMemo(
    () =>
      receipts
        .filter((r) => r.payment_mode !== "cash")
        .reduce((sum, r) => sum + Number(r.amount), 0),
    [receipts],
  );

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div>
        <h2 className='text-xl font-bold text-foreground'>Payment Receipt</h2>
        <p className='text-sm text-muted-foreground mt-1'>
          View payment history filtered by vendor, date and payment mode.
        </p>
      </div>

      {/* Filter card */}
      <Card>
        <CardContent className='pt-4'>
          <div className='flex flex-wrap gap-4 items-end'>
            {/* Vendor */}
            <div className='space-y-2 w-52'>
              <Label>Vendor</Label>
              <Combobox
                options={[
                  { value: "", label: "All Vendors" },
                  ...vendors.map((v) => ({
                    value: String(v.id),
                    label: v.name,
                  })),
                ]}
                value={vendorId}
                onChange={setVendorId}
                placeholder='All Vendors'
                searchPlaceholder='Search vendors...'
                emptyText='No vendors found.'
              />
            </div>

            {/* From date */}
            <div className='space-y-2'>
              <Label>From Date</Label>
              {/* <input
                type='date'
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className='flex h-9 w-40 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
              /> */}
              <DatePicker
                date={dateFrom}
                setDate={setDateFrom}
                placeholder='Start date'
              />
            </div>

            {/* To date */}
            <div className='space-y-2'>
              <Label>To Date</Label>
              {/* <input
                type='date'
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className='flex h-9 w-40 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
              />{" "} */}
              <DatePicker
                date={dateTo}
                setDate={setDateTo}
                placeholder='Start date'
              />
            </div>

            {/* Payment mode */}
            <div className='space-y-2 w-40'>
              <Label>Payment Mode</Label>
              <Combobox
                options={[
                  { value: "", label: "All" },
                  { value: "cash", label: "Cash" },
                  { value: "online", label: "Online (UPI / Bank / Cheque)" },
                ]}
                value={paymentMode}
                onChange={setPaymentMode}
                placeholder='All'
                searchPlaceholder='Search mode...'
                emptyText='No options.'
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
          {/* Summary cards */}
          <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
            <Card>
              <CardContent className='pt-4 space-y-1'>
                <p className='text-xs text-muted-foreground'>Total Payments</p>
                <p className='text-2xl font-bold text-foreground'>
                  ₹{totalAmount.toFixed(2)}
                </p>
                <p className='text-xs text-muted-foreground'>
                  {receipts.length} transactions
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className='pt-4 space-y-1'>
                <p className='text-xs text-muted-foreground'>Cash Payments</p>
                <p className='text-2xl font-bold text-orange-600'>
                  ₹{cashTotal.toFixed(2)}
                </p>
                <p className='text-xs text-muted-foreground'>
                  {receipts.filter((r) => r.payment_mode === "cash").length}{" "}
                  transactions
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className='pt-4 space-y-1'>
                <p className='text-xs text-muted-foreground'>Online Payments</p>
                <p className='text-2xl font-bold text-blue-600'>
                  ₹{onlineTotal.toFixed(2)}
                </p>
                <p className='text-xs text-muted-foreground'>
                  {receipts.filter((r) => r.payment_mode !== "cash").length}{" "}
                  transactions
                </p>
              </CardContent>
            </Card>
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
                  {receipts.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className='text-center py-12 text-muted-foreground'
                      >
                        No receipts found.
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

          {receipts.length > 0 && (
            <>
              <Separator />
              <div className='flex justify-end gap-4 pr-2'>
                <span className='text-sm font-semibold text-foreground'>
                  Total
                </span>
                <span className='text-lg font-bold text-foreground'>
                  ₹{totalAmount.toFixed(2)}
                </span>
              </div>
            </>
          )}

          <p className='text-xs text-muted-foreground'>
            Showing {receipts.length} transactions
          </p>
        </div>
      )}

      {!searched && (
        <div className='text-center py-16 text-muted-foreground'>
          <Receipt className='w-10 h-10 opacity-30 mx-auto mb-3' />
          <p className='text-sm'>
            Select filters and click Filter to view payment receipts.
          </p>
        </div>
      )}
    </div>
  );
};
