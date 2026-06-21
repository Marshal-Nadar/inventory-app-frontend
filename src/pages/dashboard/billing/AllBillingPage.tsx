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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { Eye, Receipt, ArrowUpDown, Filter } from "lucide-react";
import { billingService, type Bill } from "@/services/billingService";
import { useAppSelector } from "@/hooks/useAppSelector";
import { toast } from "sonner";
import { format } from "date-fns";
import { TablePagination } from "@/components/common/TablePagination";

const columnHelper = createColumnHelper<Bill>();

export const AllBillingPage = () => {
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const isAdmin = user?.role === "admin" || user?.is_super_admin;

  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([
    { id: "created_at", desc: true },
  ]);

  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchBills = async (overrides?: { page?: number; limit?: number }) => {
    try {
      setLoading(true);
      const result = await billingService.getAll({
        date_from: dateFrom ? format(dateFrom, "yyyy-MM-dd") : undefined,
        date_to: dateTo ? format(dateTo, "yyyy-MM-dd") : undefined,
        page: overrides?.page ?? page,
        limit: overrides?.limit ?? limit,
      });
      setBills(result.data);
      setTotal(result.pagination.total);
      setTotalPages(result.pagination.totalPages);
    } catch {
      toast.error("Failed to load bills");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchBills({ page: newPage });
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
    fetchBills({ page: 1, limit: newLimit });
  };

  const handleFilter = () => {
    setPage(1);
    fetchBills({ page: 1 });
  };

  const totalAmount = useMemo(
    () => bills.reduce((sum, b) => sum + Number(b.total_amount), 0),
    [bills],
  );

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
      columnHelper.accessor("bill_number", {
        header: "Bill No",
        cell: (info) => (
          <code className='text-xs bg-muted px-2 py-1 rounded font-mono'>
            {info.getValue()}
          </code>
        ),
      }),
      columnHelper.accessor("created_at", {
        header: ({ column }) => (
          <Button
            variant='ghost'
            size='sm'
            onClick={() => column.toggleSorting()}
            className='gap-1 px-0 font-medium'
          >
            Date & Time <ArrowUpDown className='w-3.5 h-3.5' />
          </Button>
        ),
        cell: (info) =>
          format(new Date(info.getValue()), "dd MMM yyyy, hh:mm a"),
      }),
      columnHelper.accessor("branch_name", {
        header: "Branch",
        cell: (info) => (
          <span className='text-sm text-foreground'>{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor("billed_by_name", {
        header: "Billed By",
        cell: (info) => (
          <span className='text-sm text-muted-foreground'>
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor("payment_method", {
        header: "Payment",
        cell: (info) => (
          <Badge variant='outline' className='uppercase text-xs'>
            {info.getValue()}
          </Badge>
        ),
      }),
      columnHelper.accessor("total_amount", {
        header: ({ column }) => (
          <Button
            variant='ghost'
            size='sm'
            onClick={() => column.toggleSorting()}
            className='gap-1 px-0 font-medium'
          >
            Total <ArrowUpDown className='w-3.5 h-3.5' />
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
          <Button
            variant='ghost'
            size='icon'
            className='w-8 h-8'
            onClick={() => navigate(`/dashboard/billing/${row.original.id}`)}
          >
            <Eye className='w-4 h-4' />
          </Button>
        ),
      }),
    ],
    [page, limit],
  );

  const table = useReactTable({
    data: bills,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className='space-y-4'>
      <div>
        <h2 className='text-xl font-bold text-foreground'>
          {isAdmin ? "All Billing History" : "Today's Billing"}
        </h2>
        <p className='text-sm text-muted-foreground mt-1'>
          {isAdmin
            ? "View complete billing history across all dates."
            : "View bills created today."}
        </p>
      </div>

      {isAdmin && (
        <Card>
          <CardContent className='pt-4'>
            <div className='flex flex-wrap gap-4 items-end'>
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
              <Button onClick={handleFilter} className='gap-2'>
                <Filter className='w-4 h-4' />
                Filter
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className='grid grid-cols-2 sm:grid-cols-3 gap-3'>
        <Card>
          <CardContent className='pt-3 space-y-1'>
            <p className='text-xs text-muted-foreground'>Total Bills</p>
            <p className='text-xl font-bold text-foreground'>{total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='pt-3 space-y-1'>
            <p className='text-xs text-muted-foreground'>Page Total</p>
            <p className='text-xl font-bold text-foreground'>
              ₹{totalAmount.toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

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
                    Loading bills...
                  </TableCell>
                </TableRow>
              ) : bills.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className='text-center py-16'
                  >
                    <div className='flex flex-col items-center gap-3 text-muted-foreground'>
                      <Receipt className='w-10 h-10 opacity-30' />
                      <p className='text-sm'>No bills found.</p>
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
    </div>
  );
};
