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
import { ArrowUpDown, Search, Package } from "lucide-react";
import { purchaseService } from "@/services/purchaseService";
import { StockBadge } from "@/components/common/StockBadge";
import { toast } from "sonner";

interface StockSummaryRow {
  id: number;
  name: string;
  category: string;
  metric: string;
  current_stock: number;
  min_stock: number;
  restaurant_name: string;
  avg_price_per_unit: number;
  total_qty_purchased: number;
  total_spend: number;
}

const columnHelper = createColumnHelper<StockSummaryRow>();

export const StockSummaryPage = () => {
  const [data, setData] = useState<StockSummaryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);

  useEffect(() => {
    purchaseService
      .getStockSummary()
      .then(setData)
      .catch(() => toast.error("Failed to load stock summary"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () =>
      data.filter(
        (row) =>
          row.name.toLowerCase().includes(search.toLowerCase()) ||
          row.category.toLowerCase().includes(search.toLowerCase()) ||
          row.restaurant_name?.toLowerCase().includes(search.toLowerCase()),
      ),
    [data, search],
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
      columnHelper.accessor("category", {
        header: ({ column }) => (
          <Button
            variant='ghost'
            size='sm'
            onClick={() => column.toggleSorting()}
            className='gap-1 px-0 font-medium'
          >
            Category <ArrowUpDown className='w-3.5 h-3.5' />
          </Button>
        ),
        cell: (info) => (
          <Badge variant='outline' className='capitalize'>
            {info.getValue()}
          </Badge>
        ),
      }),
      columnHelper.accessor("name", {
        header: ({ column }) => (
          <Button
            variant='ghost'
            size='sm'
            onClick={() => column.toggleSorting()}
            className='gap-1 px-0 font-medium'
          >
            Raw Material <ArrowUpDown className='w-3.5 h-3.5' />
          </Button>
        ),
        cell: (info) => (
          <span className='font-medium text-foreground'>{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor("current_stock", {
        header: "Current Stock",
        cell: (info) => (
          <StockBadge
            currentStock={Number(info.getValue())}
            minStock={Number(info.row.original.min_stock)}
            metric={info.row.original.metric}
          />
        ),
      }),
      columnHelper.accessor("total_qty_purchased", {
        header: "Total Purchased",
        cell: (info) => (
          <span className='text-sm text-foreground'>
            {Number(info.getValue())} {info.row.original.metric}
          </span>
        ),
      }),
      columnHelper.accessor("avg_price_per_unit", {
        header: ({ column }) => (
          <Button
            variant='ghost'
            size='sm'
            onClick={() => column.toggleSorting()}
            className='gap-1 px-0 font-medium'
          >
            Avg Price/Unit <ArrowUpDown className='w-3.5 h-3.5' />
          </Button>
        ),
        cell: (info) => (
          <span className='text-sm font-medium text-foreground'>
            {Number(info.getValue()) > 0
              ? `₹${Number(info.getValue()).toFixed(2)}`
              : "—"}
          </span>
        ),
      }),
      columnHelper.accessor("total_spend", {
        header: ({ column }) => (
          <Button
            variant='ghost'
            size='sm'
            onClick={() => column.toggleSorting()}
            className='gap-1 px-0 font-medium'
          >
            Total Spend <ArrowUpDown className='w-3.5 h-3.5' />
          </Button>
        ),
        cell: (info) => (
          <span className='text-sm font-semibold text-foreground'>
            {Number(info.getValue()) > 0
              ? `₹${Number(info.getValue()).toFixed(2)}`
              : "—"}
          </span>
        ),
      }),
      columnHelper.accessor("restaurant_name", {
        header: "Restaurant",
        cell: (info) => (
          <span className='text-sm text-muted-foreground'>
            {info.getValue()}
          </span>
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

  // summary stats
  const totalItems = data.length;
  const lowStockCount = data.filter(
    (r) =>
      Number(r.current_stock) <= Number(r.min_stock) && Number(r.min_stock) > 0,
  ).length;
  const outOfStockCount = data.filter(
    (r) => Number(r.current_stock) === 0,
  ).length;
  const totalSpend = data.reduce((sum, r) => sum + Number(r.total_spend), 0);

  return (
    <div className='space-y-4'>
      {/* Page header */}
      <div>
        <h2 className='text-xl font-bold text-foreground'>Stock Summary</h2>
        <p className='text-sm text-muted-foreground mt-1'>
          Current stock levels with weighted average purchase prices.
        </p>
      </div>

      {/* Stats */}
      <div className='grid grid-cols-2 sm:grid-cols-4 gap-4'>
        <Card>
          <CardContent className='pt-4 space-y-1'>
            <p className='text-xs text-muted-foreground'>Total Items</p>
            <p className='text-2xl font-bold text-foreground'>{totalItems}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='pt-4 space-y-1'>
            <p className='text-xs text-muted-foreground'>Low Stock</p>
            <p className='text-2xl font-bold text-orange-600'>
              {lowStockCount}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='pt-4 space-y-1'>
            <p className='text-xs text-muted-foreground'>Out of Stock</p>
            <p className='text-2xl font-bold text-destructive'>
              {outOfStockCount}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='pt-4 space-y-1'>
            <p className='text-xs text-muted-foreground'>Total Spend</p>
            <p className='text-2xl font-bold text-foreground'>
              ₹{totalSpend.toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className='relative w-full sm:max-w-xs'>
        <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground' />
        <Input
          placeholder='Search materials...'
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
                    Loading stock summary...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className='text-center py-16'
                  >
                    <div className='flex flex-col items-center gap-3 text-muted-foreground'>
                      <Package className='w-10 h-10 opacity-30' />
                      <p className='text-sm'>No raw materials found.</p>
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

      <p className='text-xs text-muted-foreground'>
        Showing {filtered.length} of {data.length} items
      </p>
    </div>
  );
};
