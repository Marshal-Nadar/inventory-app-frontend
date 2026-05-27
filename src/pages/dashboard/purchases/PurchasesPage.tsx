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
  Plus,
  Search,
  MoreHorizontal,
  Trash2,
  Eye,
  ArrowUpDown,
  ShoppingCart,
  Pencil,
} from "lucide-react";
import { purchaseService, type Purchase } from "@/services/purchaseService";
import { DeleteConfirmDialog } from "@/components/common/DeleteConfirmDialog";
import { useAppSelector } from "@/hooks/useAppSelector";
import { toast } from "sonner";
import { type Vendor, vendorService } from "@/services/vendorService";
import { Combobox } from "@/components/common/Combobox";
import { PurchaseEditDialog } from "./PurchaseEditDialog";
import { TablePagination } from "@/components/common/TablePagination";
import { Printer } from "lucide-react";
import { PrintTableLayout } from "@/components/print/PrintTableLayout";
import { usePrintSettings } from "@/hooks/usePrintSettings";
import { triggerPrint } from "@/hooks/usePrint";
import { type PrintSettings } from "@/services/printSettingsService";
import { purchasePrintColumns } from "@/config/printColumns";

const PERMITTED_ROLES = ["admin", "manager", "supervisor"];
const columnHelper = createColumnHelper<Purchase>();

export const PurchasesPage = () => {
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const canMutate =
    user?.is_super_admin || PERMITTED_ROLES.includes(user?.role || "");

  // data
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [stats, setStats] = useState({ total_count: 0, total_spend: 0 });
  const [loading, setLoading] = useState(true);
  const [vendors, setVendors] = useState<Vendor[]>([]);

  // filters
  const [search, setSearch] = useState("");
  const [filterVendor, setFilterVendor] = useState("");
  const [filterInvoice, setFilterInvoice] = useState("");
  const [invoiceOptions, setInvoiceOptions] = useState<
    Array<{ value: string; label: string; date?: string }>
  >([]);
  const [selectedInvoiceDate, setSelectedInvoiceDate] = useState("");

  // table
  const [sorting, setSorting] = useState<SortingState>([]);

  // edit
  const [editOpen, setEditOpen] = useState(false);
  const [editingPurchaseId, setEditingPurchaseId] = useState<number | null>(
    null,
  );

  // delete
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingPurchase, setDeletingPurchase] = useState<Purchase | null>(
    null,
  );
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const { getPrintSettings } = usePrintSettings();
  const [printSettings, setPrintSettings] = useState<PrintSettings | null>(
    null,
  );

  const handlePrint = () => {
    const settings = getPrintSettings();
    if (!settings) return;
    setPrintSettings(settings);
    setTimeout(() => triggerPrint(), 150);
  };

  // ─── Fetch ──────────────────────────────────────────────────────

  const fetchPurchases = async (overrides?: {
    page?: number;
    limit?: number;
    vendor_id?: string;
    invoice_number?: string;
  }) => {
    try {
      setLoading(true);
      const result = await purchaseService.getAll({
        vendor_id: overrides?.vendor_id ?? (filterVendor || undefined),
        invoice_number:
          overrides?.invoice_number ?? (filterInvoice || undefined),
        page: overrides?.page ?? page,
        limit: overrides?.limit ?? limit,
      });
      setPurchases(result.data);
      setTotal(result.pagination.total);
      setTotalPages(result.pagination.totalPages);
    } catch {
      toast.error("Failed to load purchases");
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => {
    setPage(1);
    fetchPurchases({ page: 1 });
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchPurchases({ page: newPage });
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
    fetchPurchases({ page: 1, limit: newLimit });
  };

  const fetchVendorInvoices = async (vendorId: string) => {
    if (!vendorId) {
      setInvoiceOptions([]);
      setFilterInvoice("");
      setSelectedInvoiceDate("");
      return;
    }
    try {
      const result = await purchaseService.getAll({
        vendor_id: vendorId,
        page: 1,
        limit: 100,
      });
      const invoices = [
        ...new Map(result.data.map((p) => [p.invoice_number, p])).values(),
      ].map((p) => ({
        value: p.invoice_number,
        label: p.invoice_number,
        date: p.purchase_date,
      }));
      setInvoiceOptions(invoices);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPurchases();
    vendorService.getAll().then(setVendors);
  }, []);

  useEffect(() => {
    fetchPurchases({
      vendor_id: filterVendor || undefined,
      invoice_number: filterInvoice || undefined,
    });
  }, [filterVendor, filterInvoice]);

  // ─── Delete ─────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!deletingPurchase) return;
    setDeleteLoading(true);
    try {
      await purchaseService.delete(deletingPurchase.id);
      await fetchPurchases({
        vendor_id: filterVendor || undefined,
        invoice_number: filterInvoice || undefined,
      });
      setDeleteOpen(false);
      setDeletingPurchase(null);
      toast.success("Purchase deleted");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete purchase");
    } finally {
      setDeleteLoading(false);
    }
  };

  console.log("editOpeneditOpen", editOpen);
  // ─── Search filter (client side on already-fetched data) ─────────

  const filtered = useMemo(
    () =>
      purchases.filter(
        (p) =>
          p.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
          p.vendor_name?.toLowerCase().includes(search.toLowerCase()) ||
          p.restaurant_name?.toLowerCase().includes(search.toLowerCase()),
      ),
    [purchases, search],
  );

  // ─── Columns ────────────────────────────────────────────────────

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
      columnHelper.accessor("purchase_date", {
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
          new Date(info.getValue()).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }),
      }),
      columnHelper.accessor("invoice_number", {
        header: "Invoice No",
        cell: (info) => (
          <code className='text-xs bg-muted px-2 py-1 rounded'>
            {info.getValue()}
          </code>
        ),
      }),
      columnHelper.accessor("vendor_name", {
        header: "Vendor",
        cell: (info) => (
          <span className='font-medium text-foreground'>{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor("storage_room_name", {
        header: "Storage Room",
        cell: (info) => <Badge variant='outline'>{info.getValue()}</Badge>,
      }),
      columnHelper.accessor("restaurant_name", {
        header: "Restaurant",
        cell: (info) => (
          <span className='text-sm text-muted-foreground'>
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor("total_cost", {
        header: ({ column }) => (
          <Button
            variant='ghost'
            size='sm'
            onClick={() => column.toggleSorting()}
            className='gap-1 px-0 font-medium'
          >
            Total (₹) <ArrowUpDown className='w-3.5 h-3.5' />
          </Button>
        ),
        cell: (info) => (
          <span className='font-semibold text-foreground'>
            ₹{Number(info.getValue()).toFixed(2)}
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
              <DropdownMenuItem
                onClick={() =>
                  navigate(`/dashboard/purchases/${row.original.id}`)
                }
              >
                <Eye className='mr-2 w-4 h-4' />
                View
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  console.log("firstsdsdsd", row.original.id, editOpen);
                  setEditingPurchaseId(row.original.id);
                  setEditOpen(true);
                }}
              >
                <Pencil className='mr-2 w-4 h-4' />
                Edit
              </DropdownMenuItem>

              {canMutate && (
                <DropdownMenuItem
                  className='text-destructive focus:text-destructive'
                  onClick={() => {
                    setDeletingPurchase(row.original);
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
    [canMutate],
  );

  // ─── Table ──────────────────────────────────────────────────────

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  // ─── Render ─────────────────────────────────────────────────────

  return (
    <div className='space-y-4'>
      {/* Page header */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-xl font-bold text-foreground'>Purchases</h2>
          <p className='text-sm text-muted-foreground mt-1'>
            Track all purchases from vendors.
          </p>
        </div>

        {purchases.length > 0 && (
          <Button variant='outline' onClick={handlePrint} className='gap-2'>
            <Printer className='w-4 h-4' />
            Print
          </Button>
        )}

        {canMutate && (
          <Button
            onClick={() => navigate("/dashboard/purchases/new")}
            className='gap-2'
          >
            <Plus className='w-4 h-4' />
            New Purchase
          </Button>
        )}
      </div>

      {/* Search + Filters */}
      <div className='space-y-3'>
        {/* Search */}
        <div className='relative w-full sm:max-w-xs'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground' />
          <Input
            placeholder='Search purchases...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='pl-9'
          />
        </div>

        {/* Filter row */}
        <div className='flex flex-wrap gap-3 items-end'>
          {/* Vendor filter */}
          <div className='space-y-1 w-48'>
            <label className='text-xs text-muted-foreground'>Vendor</label>
            <Combobox
              options={[
                { value: "", label: "All Vendors" },
                ...vendors.map((v) => ({
                  value: String(v.id),
                  label: v.name,
                })),
              ]}
              value={filterVendor}
              onChange={(val) => {
                setFilterVendor(val);
                fetchVendorInvoices(val);
                fetchPurchases({
                  page: 1,
                  vendor_id: val || undefined,
                  invoice_number: undefined,
                });
                setFilterInvoice("");
              }}
              placeholder='All Vendors'
              searchPlaceholder='Search vendors...'
              emptyText='No vendors found.'
            />
          </div>

          {/* Invoice filter — only when vendor selected */}
          {filterVendor && (
            <div className='space-y-1 w-52'>
              <label className='text-xs text-muted-foreground'>
                Invoice Number
              </label>
              <Combobox
                options={[
                  { value: "", label: "All Invoices" },
                  ...invoiceOptions,
                ]}
                value={filterInvoice}
                onChange={(val) => {
                  setFilterInvoice(val);
                  const found = invoiceOptions.find((o) => o.value === val);
                  setSelectedInvoiceDate(found?.date || "");
                  fetchPurchases({
                    page: 1,
                    vendor_id: filterVendor || undefined,
                    invoice_number: val || undefined,
                  });
                }}
                placeholder='All Invoices'
                searchPlaceholder='Search invoices...'
                emptyText='No invoices found for this vendor.'
              />
            </div>
          )}

          {/* Purchase date — shown when invoice selected */}
          {filterInvoice && selectedInvoiceDate && (
            <div className='space-y-1'>
              <label className='text-xs text-muted-foreground'>
                Purchase Date
              </label>
              <div className='h-9 px-3 flex items-center rounded-md border bg-muted text-sm text-muted-foreground'>
                {new Date(selectedInvoiceDate).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </div>
            </div>
          )}

          {/* Clear filters */}
          {(filterVendor || filterInvoice) && (
            <Button
              variant='ghost'
              size='sm'
              onClick={() => {
                setFilterVendor("");
                setFilterInvoice("");
                setSelectedInvoiceDate("");
                setInvoiceOptions([]);
                fetchPurchases();
              }}
              className='text-muted-foreground hover:text-foreground'
            >
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* Stats — from server, reflects filters */}
      <div className='flex gap-4'>
        <div className='text-sm text-muted-foreground'>
          Total Purchases:{" "}
          <span className='font-medium text-foreground'>
            {stats.total_count}
          </span>
        </div>
        <div className='text-sm text-muted-foreground'>
          Total Spend:{" "}
          <span className='font-medium text-foreground'>
            ₹{Number(stats.total_spend).toFixed(2)}
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
                    Loading purchases...
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className='text-center py-16'
                  >
                    <div className='flex flex-col items-center gap-3 text-muted-foreground'>
                      <ShoppingCart className='w-10 h-10 opacity-30' />
                      <p className='text-sm'>No purchases recorded yet.</p>
                      {canMutate && (
                        <Button
                          size='sm'
                          variant='outline'
                          onClick={() => navigate("/dashboard/purchases/new")}
                          className='gap-2'
                        >
                          <Plus className='w-4 h-4' />
                          Record first purchase
                        </Button>
                      )}
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

      {/* Count */}
      <p className='text-xs text-muted-foreground'>
        Showing {filtered.length} of {stats.total_count} purchases
      </p>

      <DeleteConfirmDialog
        open={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setDeletingPurchase(null);
        }}
        onConfirm={handleDelete}
        title='Delete Purchase'
        description={`Delete invoice "${deletingPurchase?.invoice_number}"? All line items will be removed too.`}
        loading={deleteLoading}
      />

      <PurchaseEditDialog
        open={editOpen}
        onClose={() => {
          setEditOpen(false);
          setEditingPurchaseId(null);
        }}
        onSuccess={() => {
          toast.success("Purchase updated successfully");

          fetchPurchases({
            vendor_id: filterVendor || undefined,
            invoice_number: filterInvoice || undefined,
          });
        }}
        purchaseId={editingPurchaseId}
      />

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
        title='Purchases'
        columns={purchasePrintColumns}
        data={purchases}
        summary={[
          { label: "Total Purchases:", value: String(total) },
          {
            label: "Total Spend:",
            value: `₹${purchases.reduce((s, p) => s + Number(p.total_cost), 0).toFixed(2)}`,
          },
        ]}
      />
    </div>
  );
};
