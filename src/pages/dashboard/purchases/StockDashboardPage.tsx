import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from "@tanstack/react-table";
import {
  AlertTriangle,
  PackageX,
  TrendingDown,
  CheckCircle2,
  ShoppingCart,
  Search,
  ArrowUpDown,
  RefreshCw,
} from "lucide-react";
import { purchaseService } from "@/services/purchaseService";
import { StockBadge } from "@/components/common/StockBadge";
import { toast } from "sonner";

interface StockRow {
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

type StockStatus = "out" | "low" | "medium" | "sufficient";

const getStatus = (current: number, min: number): StockStatus => {
  if (current === 0) return "out";
  if (min === 0) return "sufficient";
  if (current <= min) return "low";
  if (current <= min * 1.5) return "medium";
  return "sufficient";
};

const columnHelper = createColumnHelper<StockRow>();

export const StockDashboardPage = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<StockRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sorting, setSorting] = useState<SortingState>([
    { id: "current_stock", desc: false },
  ]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const result = await purchaseService.getStockSummary();
      setData(result);
    } catch {
      toast.error("Failed to load stock data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ─── Stats ──────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const out = data.filter(
      (r) => getStatus(Number(r.current_stock), Number(r.min_stock)) === "out",
    );
    const low = data.filter(
      (r) => getStatus(Number(r.current_stock), Number(r.min_stock)) === "low",
    );
    const medium = data.filter(
      (r) =>
        getStatus(Number(r.current_stock), Number(r.min_stock)) === "medium",
    );
    const sufficient = data.filter(
      (r) =>
        getStatus(Number(r.current_stock), Number(r.min_stock)) ===
        "sufficient",
    );
    return { out, low, medium, sufficient };
  }, [data]);

  // ─── Filtered data ───────────────────────────────────────────────

  const filtered = useMemo(() => {
    return data.filter((r) => {
      const matchSearch =
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.category.toLowerCase().includes(search.toLowerCase());

      const matchStatus =
        statusFilter === "all"
          ? true
          : getStatus(Number(r.current_stock), Number(r.min_stock)) ===
            statusFilter;

      return matchSearch && matchStatus;
    });
  }, [data, search, statusFilter]);

  // ─── Columns ────────────────────────────────────────────────────

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
        header: "Category",
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
        header: ({ column }) => (
          <Button
            variant='ghost'
            size='sm'
            onClick={() => column.toggleSorting()}
            className='gap-1 px-0 font-medium'
          >
            Current Stock <ArrowUpDown className='w-3.5 h-3.5' />
          </Button>
        ),
        cell: (info) => (
          <StockBadge
            currentStock={Number(info.getValue())}
            minStock={Number(info.row.original.min_stock)}
            metric={info.row.original.metric}
          />
        ),
      }),
      columnHelper.accessor("min_stock", {
        header: "Min Stock",
        cell: (info) => (
          <span className='text-sm text-muted-foreground'>
            {Number(info.getValue())} {info.row.original.metric}
          </span>
        ),
      }),
      columnHelper.accessor("avg_price_per_unit", {
        header: "Avg Price/Unit",
        cell: (info) => (
          <span className='text-sm font-medium text-foreground'>
            {Number(info.getValue()) > 0
              ? `₹${Number(info.getValue()).toFixed(2)}`
              : "—"}
          </span>
        ),
      }),
      columnHelper.display({
        id: "reorder",
        header: "Action",
        cell: ({ row }) => {
          const status = getStatus(
            Number(row.original.current_stock),
            Number(row.original.min_stock),
          );
          if (status === "out" || status === "low") {
            return (
              <Button
                size='sm'
                variant='outline'
                className='gap-1 h-7 text-xs text-orange-600 border-orange-200 hover:bg-orange-50'
                onClick={() => navigate("/dashboard/purchases/new")}
              >
                <ShoppingCart className='w-3 h-3' />
                Reorder
              </Button>
            );
          }
          return null;
        },
      }),
    ],
    [navigate],
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
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-xl font-bold text-foreground'>Stock Dashboard</h2>
          <p className='text-sm text-muted-foreground mt-1'>
            Real-time stock levels and alerts across all raw materials.
          </p>
        </div>
        <Button
          variant='outline'
          size='sm'
          onClick={fetchData}
          className='gap-2'
        >
          <RefreshCw className='w-4 h-4' />
          Refresh
        </Button>
      </div>

      {/* Alert Cards */}
      <div className='grid grid-cols-2 sm:grid-cols-4 gap-4'>
        <Card
          className='cursor-pointer hover:shadow-md transition-shadow border-red-100'
          onClick={() =>
            setStatusFilter(statusFilter === "out" ? "all" : "out")
          }
        >
          <CardContent className='pt-4 space-y-2'>
            <div className='flex items-center justify-between'>
              <p className='text-xs text-muted-foreground'>Out of Stock</p>
              <PackageX className='w-4 h-4 text-destructive' />
            </div>
            <p className='text-3xl font-bold text-destructive'>
              {stats.out.length}
            </p>
            {stats.out.length > 0 && (
              <p className='text-xs text-destructive'>
                Needs immediate reorder
              </p>
            )}
          </CardContent>
        </Card>

        <Card
          className='cursor-pointer hover:shadow-md transition-shadow border-orange-100'
          onClick={() =>
            setStatusFilter(statusFilter === "low" ? "all" : "low")
          }
        >
          <CardContent className='pt-4 space-y-2'>
            <div className='flex items-center justify-between'>
              <p className='text-xs text-muted-foreground'>Low Stock</p>
              <AlertTriangle className='w-4 h-4 text-orange-600' />
            </div>
            <p className='text-3xl font-bold text-orange-600'>
              {stats.low.length}
            </p>
            {stats.low.length > 0 && (
              <p className='text-xs text-orange-600'>Below minimum level</p>
            )}
          </CardContent>
        </Card>

        <Card
          className='cursor-pointer hover:shadow-md transition-shadow border-yellow-100'
          onClick={() =>
            setStatusFilter(statusFilter === "medium" ? "all" : "medium")
          }
        >
          <CardContent className='pt-4 space-y-2'>
            <div className='flex items-center justify-between'>
              <p className='text-xs text-muted-foreground'>Medium</p>
              <TrendingDown className='w-4 h-4 text-yellow-600' />
            </div>
            <p className='text-3xl font-bold text-yellow-600'>
              {stats.medium.length}
            </p>
            {stats.medium.length > 0 && (
              <p className='text-xs text-yellow-600'>Monitor closely</p>
            )}
          </CardContent>
        </Card>

        <Card
          className='cursor-pointer hover:shadow-md transition-shadow border-green-100'
          onClick={() =>
            setStatusFilter(
              statusFilter === "sufficient" ? "all" : "sufficient",
            )
          }
        >
          <CardContent className='pt-4 space-y-2'>
            <div className='flex items-center justify-between'>
              <p className='text-xs text-muted-foreground'>Sufficient</p>
              <CheckCircle2 className='w-4 h-4 text-green-600' />
            </div>
            <p className='text-3xl font-bold text-green-600'>
              {stats.sufficient.length}
            </p>
            {stats.sufficient.length > 0 && (
              <p className='text-xs text-green-600'>Well stocked</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Critical items — out of stock or low */}
      {(stats.out.length > 0 || stats.low.length > 0) && (
        <Card className='border-orange-100'>
          <CardHeader className='pb-3'>
            <div className='flex items-center justify-between'>
              <CardTitle className='text-base flex items-center gap-2'>
                <AlertTriangle className='w-4 h-4 text-orange-600' />
                Needs Attention
                <Badge className='bg-orange-500/10 text-orange-600 border-orange-200 border text-xs'>
                  {stats.out.length + stats.low.length} items
                </Badge>
              </CardTitle>
              <Button
                size='sm'
                className='gap-2 h-8'
                onClick={() => navigate("/dashboard/purchases/new")}
              >
                <ShoppingCart className='w-3.5 h-3.5' />
                Create Purchase
              </Button>
            </div>
          </CardHeader>
          <CardContent className='p-0'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Raw Material</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Current Stock</TableHead>
                  <TableHead>Min Stock</TableHead>
                  <TableHead>Avg Price</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...stats.out, ...stats.low].map((item) => (
                  <TableRow key={item.id} className='hover:bg-muted/50'>
                    <TableCell className='font-medium text-foreground'>
                      {item.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant='outline' className='capitalize'>
                        {item.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <StockBadge
                        currentStock={Number(item.current_stock)}
                        minStock={Number(item.min_stock)}
                        metric={item.metric}
                      />
                    </TableCell>
                    <TableCell className='text-muted-foreground text-sm'>
                      {Number(item.min_stock)} {item.metric}
                    </TableCell>
                    <TableCell className='text-sm font-medium'>
                      {Number(item.avg_price_per_unit) > 0
                        ? `₹${Number(item.avg_price_per_unit).toFixed(2)}`
                        : "—"}
                    </TableCell>
                    <TableCell>
                      {getStatus(
                        Number(item.current_stock),
                        Number(item.min_stock),
                      ) === "out" ? (
                        <Badge className='bg-red-500/10 text-red-600 border-red-200 border-0 text-xs'>
                          Out of Stock
                        </Badge>
                      ) : (
                        <Badge className='bg-orange-500/10 text-orange-600 border-orange-200 border-0 text-xs'>
                          Low
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Full stock table */}
      <div className='space-y-3'>
        <div className='flex flex-wrap gap-3 items-center justify-between'>
          <div className='relative w-full sm:max-w-xs'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground' />
            <Input
              placeholder='Search materials...'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className='pl-9'
            />
          </div>

          {/* Status filter pills */}
          <div className='flex gap-2 flex-wrap'>
            {[
              { key: "all", label: "All", count: data.length },
              { key: "out", label: "Out", count: stats.out.length },
              { key: "low", label: "Low", count: stats.low.length },
              { key: "medium", label: "Medium", count: stats.medium.length },
              {
                key: "sufficient",
                label: "Sufficient",
                count: stats.sufficient.length,
              },
            ].map((f) => (
              <Button
                key={f.key}
                size='sm'
                variant={statusFilter === f.key ? "default" : "outline"}
                onClick={() => setStatusFilter(f.key)}
                className='gap-1.5'
              >
                {f.label}
                <Badge variant='secondary' className='h-4 px-1 text-xs ml-0.5'>
                  {f.count}
                </Badge>
              </Button>
            ))}
          </div>
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
                      Loading stock data...
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className='text-center py-12 text-muted-foreground'
                    >
                      No items found.
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
    </div>
  );
};
