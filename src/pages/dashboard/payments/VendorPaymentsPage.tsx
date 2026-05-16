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
import { Card, CardContent } from "@/components/ui/card";
import {
  Search,
  ArrowUpDown,
  CreditCard,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import {
  vendorPaymentService,
  type VendorPaymentSummary,
} from "@/services/vendorPaymentService";
import { VendorPaymentDialog } from "./VendorPaymentDialog";
import { toast } from "sonner";

const columnHelper = createColumnHelper<VendorPaymentSummary>();

export const VendorPaymentsPage = () => {
  const [vendors, setVendors] = useState<VendorPaymentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([
    { id: "outstanding_balance", desc: true },
  ]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] =
    useState<VendorPaymentSummary | null>(null);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const data = await vendorPaymentService.getSummary();
      setVendors(data);
    } catch {
      toast.error("Failed to load vendor payments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const filtered = useMemo(
    () =>
      vendors.filter((v) =>
        v.vendor_name.toLowerCase().includes(search.toLowerCase()),
      ),
    [vendors, search],
  );

  const totalOutstanding = useMemo(
    () => vendors.reduce((sum, v) => sum + Number(v.outstanding_balance), 0),
    [vendors],
  );

  const totalPaid = useMemo(
    () => vendors.reduce((sum, v) => sum + Number(v.amount_paid), 0),
    [vendors],
  );

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
            Vendor Name <ArrowUpDown className='w-3.5 h-3.5' />
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
      columnHelper.accessor("total_invoices", {
        header: "Invoices",
        cell: (info) => <Badge variant='secondary'>{info.getValue()}</Badge>,
      }),
      columnHelper.accessor("total_purchases", {
        header: ({ column }) => (
          <Button
            variant='ghost'
            size='sm'
            onClick={() => column.toggleSorting()}
            className='gap-1 px-0 font-medium'
          >
            Total Purchases <ArrowUpDown className='w-3.5 h-3.5' />
          </Button>
        ),
        cell: (info) => (
          <span className='text-sm font-medium text-foreground'>
            ₹{Number(info.getValue()).toFixed(2)}
          </span>
        ),
      }),
      columnHelper.accessor("amount_paid", {
        header: "Amount Paid",
        cell: (info) => (
          <span className='text-sm font-medium text-green-600'>
            ₹{Number(info.getValue()).toFixed(2)}
          </span>
        ),
      }),
      columnHelper.accessor("outstanding_balance", {
        header: ({ column }) => (
          <Button
            variant='ghost'
            size='sm'
            onClick={() => column.toggleSorting()}
            className='gap-1 px-0 font-medium'
          >
            Outstanding <ArrowUpDown className='w-3.5 h-3.5' />
          </Button>
        ),
        cell: (info) => {
          const val = Number(info.getValue());
          return val > 0 ? (
            <span className='text-sm font-bold text-destructive'>
              ₹{val.toFixed(2)}
            </span>
          ) : (
            <div className='flex items-center gap-1 text-green-600'>
              <CheckCircle2 className='w-3.5 h-3.5' />
              <span className='text-sm font-medium'>Cleared</span>
            </div>
          );
        },
      }),
      columnHelper.display({
        id: "actions",
        header: "Action",
        cell: ({ row }) => {
          const hasBalance = Number(row.original.outstanding_balance) > 0;
          return hasBalance ? (
            <Button
              size='sm'
              className='gap-2 h-8'
              onClick={() => {
                setSelectedVendor(row.original);
                setDialogOpen(true);
              }}
            >
              <CreditCard className='w-3.5 h-3.5' />
              Pay
            </Button>
          ) : (
            <Badge
              variant='outline'
              className='text-green-600 border-green-200'
            >
              Paid
            </Badge>
          );
        },
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
    <div className='space-y-4'>
      {/* Header */}
      <div>
        <h2 className='text-xl font-bold text-foreground'>Vendor Payments</h2>
        <p className='text-sm text-muted-foreground mt-1'>
          Track and record payments to vendors against purchases.
        </p>
      </div>

      {/* Summary cards */}
      <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
        <Card>
          <CardContent className='pt-4 space-y-1'>
            <p className='text-xs text-muted-foreground'>Total Purchases</p>
            <p className='text-2xl font-bold text-foreground'>
              ₹{(totalPaid + totalOutstanding).toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='pt-4 space-y-1'>
            <p className='text-xs text-muted-foreground'>Total Paid</p>
            <p className='text-2xl font-bold text-green-600'>
              ₹{totalPaid.toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='pt-4 space-y-1'>
            <div className='flex items-center justify-between'>
              <p className='text-xs text-muted-foreground'>Total Outstanding</p>
              {totalOutstanding > 0 && (
                <AlertCircle className='w-4 h-4 text-destructive' />
              )}
            </div>
            <p
              className={`text-2xl font-bold ${
                totalOutstanding > 0 ? "text-destructive" : "text-green-600"
              }`}
            >
              ₹{totalOutstanding.toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className='relative w-full sm:max-w-xs'>
        <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground' />
        <Input
          placeholder='Search vendors...'
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
                    Loading vendor payments...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className='text-center py-12 text-muted-foreground'
                  >
                    No vendors with purchases found.
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

      <p className='text-xs text-muted-foreground'>
        Showing {filtered.length} of {vendors.length} vendors
      </p>

      {/* Payment dialog */}
      <VendorPaymentDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setSelectedVendor(null);
        }}
        onSuccess={fetchSummary}
        vendor={selectedVendor}
      />
    </div>
  );
};
