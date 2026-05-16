import { useState, useMemo } from "react";
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
import { Filter, ArrowUpDown, Clock, AlertCircle } from "lucide-react";
import { Combobox } from "@/components/common/Combobox";
import {
  vendorPaymentService,
  type PendingPayment,
} from "@/services/vendorPaymentService";
import { vendorService, type Vendor } from "@/services/vendorService";
import { useEffect } from "react";
import { toast } from "sonner";

const columnHelper = createColumnHelper<PendingPayment>();

export const PendingPaymentsPage = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [vendorId, setVendorId] = useState("");
  const [pending, setPending] = useState<PendingPayment[]>([]);
  const [totalDue, setTotalDue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([
    { id: "purchase_date", desc: false },
  ]);

  useEffect(() => {
    vendorService.getAll().then(setVendors);
  }, []);

  const handleFilter = async () => {
    setLoading(true);
    try {
      const data = await vendorPaymentService.getPending(vendorId || undefined);
      setPending(data.pending);
      setTotalDue(data.total_due);
      setSearched(true);
      if (data.pending.length === 0) {
        toast.success("No pending payments — all cleared!");
      }
    } catch {
      toast.error("Failed to load pending payments");
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
      columnHelper.accessor("vendor_name", {
        header: ({ column }) => (
          <Button
            variant='ghost'
            size='sm'
            onClick={() => column.toggleSorting()}
            className='gap-1 px-0 font-medium'
          >
            Vendor <ArrowUpDown className='w-3.5 h-3.5' />
          </Button>
        ),
        cell: (info) => (
          <div>
            <p className='font-medium text-foreground'>{info.getValue()}</p>
            <p className='text-xs text-muted-foreground font-mono'>
              {info.row.original.vendor_phone}
            </p>
          </div>
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
      columnHelper.accessor("purchase_date", {
        header: ({ column }) => (
          <Button
            variant='ghost'
            size='sm'
            onClick={() => column.toggleSorting()}
            className='gap-1 px-0 font-medium'
          >
            Purchase Date <ArrowUpDown className='w-3.5 h-3.5' />
          </Button>
        ),
        cell: (info) =>
          new Date(info.getValue()).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }),
      }),
      columnHelper.accessor("purchase_amount", {
        header: "Purchase Amount (₹)",
        cell: (info) => (
          <span className='text-sm text-foreground'>
            ₹{Number(info.getValue()).toFixed(2)}
          </span>
        ),
      }),
      columnHelper.accessor("amount_paid", {
        header: "Amount Paid (₹)",
        cell: (info) => (
          <span className='text-sm text-green-600 font-medium'>
            ₹{Number(info.getValue()).toFixed(2)}
          </span>
        ),
      }),
      columnHelper.accessor("amount_due", {
        header: ({ column }) => (
          <Button
            variant='ghost'
            size='sm'
            onClick={() => column.toggleSorting()}
            className='gap-1 px-0 font-medium'
          >
            Amount Due (₹) <ArrowUpDown className='w-3.5 h-3.5' />
          </Button>
        ),
        cell: (info) => (
          <span className='text-sm font-bold text-destructive'>
            ₹{Number(info.getValue()).toFixed(2)}
          </span>
        ),
      }),
    ],
    [],
  );

  const table = useReactTable({
    data: pending,
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
        <h2 className='text-xl font-bold text-foreground'>Pending Payments</h2>
        <p className='text-sm text-muted-foreground mt-1'>
          View outstanding invoice payments vendor-wise.
        </p>
      </div>

      {/* Filter card */}
      <Card>
        <CardContent className='pt-4'>
          <div className='flex flex-wrap gap-4 items-end'>
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

            <Button onClick={handleFilter} disabled={loading} className='gap-2'>
              <Filter className='w-4 h-4' />
              {loading ? "Loading..." : "Filter"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {searched && (
        <div className='space-y-4'>
          {/* Stats */}
          <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
            <Card>
              <CardContent className='pt-4 space-y-1'>
                <p className='text-xs text-muted-foreground'>
                  Pending Invoices
                </p>
                <p className='text-2xl font-bold text-foreground'>
                  {pending.length}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className='pt-4 space-y-1'>
                <p className='text-xs text-muted-foreground'>Unique Vendors</p>
                <p className='text-2xl font-bold text-foreground'>
                  {new Set(pending.map((p) => p.vendor_name)).size}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className='pt-4 space-y-1'>
                <div className='flex items-center justify-between'>
                  <p className='text-xs text-muted-foreground'>Total Due</p>
                  {totalDue > 0 && (
                    <AlertCircle className='w-4 h-4 text-destructive' />
                  )}
                </div>
                <p className='text-2xl font-bold text-destructive'>
                  ₹{totalDue.toFixed(2)}
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
                  {pending.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className='text-center py-12'
                      >
                        <div className='flex flex-col items-center gap-2 text-green-600'>
                          <Clock className='w-8 h-8 opacity-50' />
                          <p className='text-sm font-medium'>
                            All payments cleared!
                          </p>
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
            </CardContent>
          </Card>

          {pending.length > 0 && (
            <>
              <Separator />
              <div className='flex justify-end gap-4 pr-2'>
                <span className='text-sm font-semibold text-foreground'>
                  Total Due
                </span>
                <span className='text-lg font-bold text-destructive'>
                  ₹{totalDue.toFixed(2)}
                </span>
              </div>
            </>
          )}

          <p className='text-xs text-muted-foreground'>
            {pending.length} pending invoice{pending.length !== 1 ? "s" : ""}
          </p>
        </div>
      )}

      {!searched && (
        <div className='text-center py-16 text-muted-foreground'>
          <Clock className='w-10 h-10 opacity-30 mx-auto mb-3' />
          <p className='text-sm'>
            Select a vendor and click Filter to view pending payments.
          </p>
        </div>
      )}
    </div>
  );
};
