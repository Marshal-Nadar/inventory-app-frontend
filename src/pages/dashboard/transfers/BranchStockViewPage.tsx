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
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowUpDown, Filter, Search } from "lucide-react";
import {
  branchStockService,
  type BranchStockRow,
} from "@/services/branchStockService";
import { branchService, type Branch } from "@/services/branchService";
import { Combobox } from "@/components/common/Combobox";
import { useAppSelector } from "@/hooks/useAppSelector";
import { toast } from "sonner";

const columnHelper = createColumnHelper<BranchStockRow>();

export const BranchStockViewPage = () => {
  const user = useAppSelector((state) => state.auth.user);
  const isAdmin = user?.role === "admin" || user?.is_super_admin;

  // filters
  const [dateFrom, setDateFrom] = useState(
    new Date(new Date().setDate(1)).toISOString().split("T")[0],
  );
  const [dateTo, setDateTo] = useState(new Date().toISOString().split("T")[0]);
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [branches, setBranches] = useState<Branch[]>([]);

  // data
  const [rows, setRows] = useState<BranchStockRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [search, setSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);

  // selected transfer for drill down
  const [selectedTransferId, setSelectedTransferId] = useState<number | null>(
    null,
  );

  useEffect(() => {
    if (isAdmin) {
      branchService
        .getAll()
        .then((data) => setBranches(data.filter((b) => b.is_active)));
    }
  }, []);

  const handleFilter = async () => {
    if (!dateFrom || !dateTo) {
      toast.error("Please select both dates");
      return;
    }
    if (new Date(dateFrom) > new Date(dateTo)) {
      toast.error("From date cannot be after To date");
      return;
    }
    setLoading(true);
    setSelectedTransferId(null);
    try {
      const data = await branchStockService.getView(
        dateFrom,
        dateTo,
        selectedBranchId || undefined,
      );
      setRows(data);
      setSearched(true);
      if (data.length === 0) {
        toast.info("No transfers found for the selected filters");
      }
    } catch {
      toast.error("Failed to fetch branch stock data");
    } finally {
      setLoading(false);
    }
  };

  // unique transfer IDs for filter
  const transferIds = useMemo(
    () => [...new Set(rows.map((r) => r.transfer_id))],
    [rows],
  );

  // filtered rows — by transfer ID if selected, else all
  const filtered = useMemo(() => {
    let result = selectedTransferId
      ? rows.filter((r) => r.transfer_id === selectedTransferId)
      : rows;

    if (search) {
      result = result.filter(
        (r) =>
          r.raw_material_name.toLowerCase().includes(search.toLowerCase()) ||
          r.category.toLowerCase().includes(search.toLowerCase()) ||
          r.branch_name.toLowerCase().includes(search.toLowerCase()),
      );
    }
    return result;
  }, [rows, selectedTransferId, search]);

  // stats for filtered
  const totalQtyByMaterial = useMemo(() => {
    const map: Record<string, { qty: number; metric: string; total: number }> =
      {};
    filtered.forEach((r) => {
      const key = r.raw_material_name;
      if (!map[key]) map[key] = { qty: 0, metric: r.metric, total: 0 };
      map[key].qty += Number(r.quantity);
      map[key].total += Number(r.quantity) * Number(r.avg_price);
    });
    return map;
  }, [filtered]);

  const columns = useMemo(
    () => [
      columnHelper.accessor("transfer_id", {
        header: "Transfer ID",
        cell: (info) => (
          <code className='text-xs bg-muted px-2 py-1 rounded'>
            TRF-{String(info.getValue()).padStart(4, "0")}
          </code>
        ),
      }),
      columnHelper.accessor("branch_name", {
        header: "Branch",
        cell: (info) => (
          <span className='text-sm font-medium text-foreground'>
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor("raw_material_name", {
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
      columnHelper.accessor("category", {
        header: "Category",
        cell: (info) => (
          <Badge variant='outline' className='capitalize'>
            {info.getValue()}
          </Badge>
        ),
      }),
      columnHelper.accessor("quantity", {
        header: "Quantity",
        cell: (info) => (
          <span className='text-sm text-foreground'>
            {Number(info.getValue())}
          </span>
        ),
      }),
      columnHelper.accessor("metric", {
        header: "Metric",
        cell: (info) => <Badge variant='secondary'>{info.getValue()}</Badge>,
      }),
      columnHelper.accessor("avg_price", {
        header: "Avg Price",
        cell: (info) => (
          <span className='text-sm text-foreground'>
            {Number(info.getValue()) > 0
              ? `₹${Number(info.getValue()).toFixed(2)}`
              : "—"}
          </span>
        ),
      }),
      columnHelper.display({
        id: "total_value",
        header: "Total Value",
        cell: ({ row }) => {
          const total =
            Number(row.original.quantity) * Number(row.original.avg_price);
          return (
            <span className='text-sm font-semibold text-foreground'>
              {total > 0 ? `₹${total.toFixed(2)}` : "—"}
            </span>
          );
        },
      }),
      columnHelper.accessor("transfer_time", {
        header: ({ column }) => (
          <Button
            variant='ghost'
            size='sm'
            onClick={() => column.toggleSorting()}
            className='gap-1 px-0 font-medium'
          >
            Transfer Time <ArrowUpDown className='w-3.5 h-3.5' />
          </Button>
        ),
        cell: (info) =>
          new Date(info.getValue()).toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
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

  const overallTotal = filtered.reduce(
    (sum, r) => sum + Number(r.quantity) * Number(r.avg_price),
    0,
  );

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div>
        <h2 className='text-xl font-bold text-foreground'>Branch Stock View</h2>
        <p className='text-sm text-muted-foreground mt-1'>
          View approved stock transfers to branches by date range.
        </p>
      </div>

      {/* Filter card */}
      <Card>
        <CardContent className='pt-4'>
          <div className='flex flex-wrap gap-4 items-end'>
            {/* Restaurant — disabled, auto */}
            <div className='space-y-2'>
              <Label>Restaurant</Label>
              <Input
                value={
                  user?.is_super_admin ? "All Restaurants" : "Max Restaurant"
                }
                readOnly
                className='w-44 bg-muted text-muted-foreground cursor-not-allowed'
              />
            </div>

            {/* Branch — dropdown for admin, disabled for others */}
            <div className='space-y-2 w-48'>
              <Label>Branch</Label>
              {isAdmin ? (
                <Combobox
                  options={[
                    { value: "", label: "All Branches" },
                    ...branches.map((b) => ({
                      value: String(b.id),
                      label: b.name,
                    })),
                  ]}
                  value={selectedBranchId}
                  onChange={setSelectedBranchId}
                  placeholder='All Branches'
                  searchPlaceholder='Search branches...'
                  emptyText='No branches found.'
                />
              ) : (
                <Input
                  value={user?.branch || ""}
                  readOnly
                  className='bg-muted text-muted-foreground cursor-not-allowed'
                />
              )}
            </div>

            {/* From date */}
            <div className='space-y-2'>
              <Label>From Date</Label>
              <input
                type='date'
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className='flex h-9 w-40 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
              />
            </div>

            {/* To date */}
            <div className='space-y-2'>
              <Label>To Date</Label>
              <input
                type='date'
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className='flex h-9 w-40 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
              />
            </div>

            {/* Filter button */}
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
          {/* Transfer ID filter */}
          {transferIds.length > 0 && (
            <div className='space-y-2'>
              <Label className='text-sm font-medium text-foreground'>
                Filter by Transfer ID
              </Label>
              <div className='flex flex-wrap gap-2'>
                <Button
                  size='sm'
                  variant={selectedTransferId === null ? "default" : "outline"}
                  onClick={() => setSelectedTransferId(null)}
                >
                  All Transfers
                  <Badge variant='secondary' className='ml-1.5 text-xs'>
                    {transferIds.length}
                  </Badge>
                </Button>
                {transferIds.map((id) => (
                  <Button
                    key={id}
                    size='sm'
                    variant={selectedTransferId === id ? "default" : "outline"}
                    onClick={() =>
                      setSelectedTransferId(
                        selectedTransferId === id ? null : id,
                      )
                    }
                  >
                    TRF-{String(id).padStart(4, "0")}
                    <Badge variant='secondary' className='ml-1.5 text-xs'>
                      {rows.filter((r) => r.transfer_id === id).length} items
                    </Badge>
                  </Button>
                ))}
              </div>
            </div>
          )}

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

          {/* Stats */}
          <div className='flex flex-wrap gap-4'>
            <div className='text-sm text-muted-foreground'>
              Showing:{" "}
              <span className='font-medium text-foreground'>
                {filtered.length} items
              </span>
            </div>
            <div className='text-sm text-muted-foreground'>
              Transfers:{" "}
              <span className='font-medium text-foreground'>
                {selectedTransferId ? 1 : transferIds.length}
              </span>
            </div>
            {overallTotal > 0 && (
              <div className='text-sm text-muted-foreground'>
                Total Value:{" "}
                <span className='font-medium text-foreground'>
                  ₹{overallTotal.toFixed(2)}
                </span>
              </div>
            )}
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
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className='text-center py-12 text-muted-foreground'
                      >
                        No transfers found.
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

          {/* Overall total */}
          {overallTotal > 0 && (
            <>
              <Separator />
              <div className='flex justify-end gap-4 pr-2'>
                <span className='text-sm font-semibold text-foreground'>
                  Overall Total Value
                </span>
                <span className='text-lg font-bold text-foreground'>
                  ₹{overallTotal.toFixed(2)}
                </span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Empty state before search */}
      {!searched && (
        <div className='text-center py-16 text-muted-foreground'>
          <Filter className='w-10 h-10 opacity-30 mx-auto mb-3' />
          <p className='text-sm'>
            Select filters and click Filter to view branch stock transfers.
          </p>
        </div>
      )}
    </div>
  );
};
