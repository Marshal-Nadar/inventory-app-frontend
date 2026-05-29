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
import { ArrowUpDown, Search, BookOpen } from "lucide-react";
import {
  stockLedgerService,
  type StockLedgerEntry,
} from "@/services/stockLedgerService";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const columnHelper = createColumnHelper<StockLedgerEntry>();

const ENTRY_TYPE_CONFIG: Record<string, { label: string; className: string }> =
  {
    purchase_in: {
      label: "Purchase In",
      className: "bg-green-500/10 text-green-600 border-green-200",
    },
    transfer_out: {
      label: "Transfer Out",
      className: "bg-orange-500/10 text-orange-600 border-orange-200",
    },
    adjustment: {
      label: "Adjustment",
      className: "bg-purple-500/10 text-purple-600 border-purple-200",
    },
  };

export const StockLedgerPage = () => {
  const [entries, setEntries] = useState<StockLedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([
    { id: "created_at", desc: true },
  ]);
  const [entryTypeFilter, setEntryTypeFilter] = useState("all");

  useEffect(() => {
    stockLedgerService
      .getAll()
      .then(setEntries)
      .catch(() => toast.error("Failed to load stock ledger"))
      .finally(() => setLoading(false));
  }, []);

  // ─── Stats ────────────────────────────────────────────────────

  const stats = useMemo(
    () => ({
      total: entries.length,
      purchase_in: entries.filter((e) => e.entry_type === "purchase_in").length,
      transfer_out: entries.filter((e) => e.entry_type === "transfer_out")
        .length,
      adjustment: entries.filter((e) => e.entry_type === "adjustment").length,
    }),
    [entries],
  );

  // ─── Filter ───────────────────────────────────────────────────

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      const matchSearch =
        !search ||
        e.raw_material_name.toLowerCase().includes(search.toLowerCase()) ||
        e.category?.toLowerCase().includes(search.toLowerCase()) ||
        e.created_by_name?.toLowerCase().includes(search.toLowerCase()) ||
        e.notes?.toLowerCase().includes(search.toLowerCase());

      const matchType =
        entryTypeFilter === "all" || e.entry_type === entryTypeFilter;

      return matchSearch && matchType;
    });
  }, [entries, search, entryTypeFilter]);

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
          <div>
            <p className='font-medium text-foreground'>{info.getValue()}</p>
            <p className='text-xs text-muted-foreground'>
              {info.row.original.category}
            </p>
          </div>
        ),
      }),
      columnHelper.accessor("entry_type", {
        header: "Type",
        cell: (info) => {
          const config =
            ENTRY_TYPE_CONFIG[info.getValue()] || ENTRY_TYPE_CONFIG.adjustment;
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
      columnHelper.accessor("quantity", {
        header: ({ column }) => (
          <Button
            variant='ghost'
            size='sm'
            onClick={() => column.toggleSorting()}
            className='gap-1 px-0 font-medium'
          >
            Quantity <ArrowUpDown className='w-3.5 h-3.5' />
          </Button>
        ),
        cell: (info) => {
          const entry = info.row.original;
          const isOut = entry.entry_type === "transfer_out";
          return (
            <span
              className={cn(
                "font-semibold",
                isOut ? "text-destructive" : "text-green-600",
              )}
            >
              {isOut ? "−" : "+"}
              {Number(info.getValue()).toFixed(3)} {entry.metric}
            </span>
          );
        },
      }),
      columnHelper.accessor("reference_type", {
        header: "Reference",
        cell: (info) => {
          const entry = info.row.original;
          if (!info.getValue() && !entry.reference_id)
            return <span className='text-muted-foreground text-xs'>—</span>;
          return (
            <div className='text-xs'>
              <p className='text-muted-foreground capitalize'>
                {info.getValue()?.replace("_", " ") || "—"}
              </p>
              {entry.reference_id && (
                <p className='font-mono text-foreground'>
                  #{entry.reference_id}
                </p>
              )}
            </div>
          );
        },
      }),
      columnHelper.accessor("notes", {
        header: "Notes",
        cell: (info) => (
          <span className='text-sm text-muted-foreground'>
            {info.getValue() || "—"}
          </span>
        ),
      }),
      columnHelper.accessor("created_by_name", {
        header: "By",
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
        <h2 className='text-xl font-bold text-foreground'>Stock Ledger</h2>
        <p className='text-sm text-muted-foreground mt-1'>
          View all stock movements — purchases, transfers and adjustments.
        </p>
      </div>

      {/* Stats */}
      <div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
        <Card>
          <CardContent className='pt-3 space-y-1'>
            <p className='text-xs text-muted-foreground'>Total Entries</p>
            <p className='text-2xl font-bold text-foreground'>{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='pt-3 space-y-1'>
            <p className='text-xs text-muted-foreground'>Purchase In</p>
            <p className='text-2xl font-bold text-green-600'>
              {stats.purchase_in}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='pt-3 space-y-1'>
            <p className='text-xs text-muted-foreground'>Transfers Out</p>
            <p className='text-2xl font-bold text-orange-600'>
              {stats.transfer_out}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='pt-3 space-y-1'>
            <p className='text-xs text-muted-foreground'>Adjustments</p>
            <p className='text-2xl font-bold text-purple-600'>
              {stats.adjustment}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search + Filter */}
      <div className='flex flex-wrap gap-3 items-center'>
        <div className='relative w-full sm:max-w-xs'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground' />
          <Input
            placeholder='Search material, category, notes...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='pl-9'
          />
        </div>

        <div className='flex gap-2 flex-wrap'>
          {[
            { value: "all", label: "All" },
            { value: "purchase_in", label: "Purchase In" },
            { value: "transfer_out", label: "Transfer Out" },
            { value: "adjustment", label: "Adjustment" },
          ].map((f) => (
            <Button
              key={f.value}
              size='sm'
              variant={entryTypeFilter === f.value ? "default" : "outline"}
              onClick={() => setEntryTypeFilter(f.value)}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className='w-full overflow-x-auto'>
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
                      Loading ledger...
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className='text-center py-16'
                    >
                      <div className='flex flex-col items-center gap-3 text-muted-foreground'>
                        <BookOpen className='w-10 h-10 opacity-30' />
                        <p className='text-sm'>No ledger entries found.</p>
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
      </div>

      <p className='text-xs text-muted-foreground'>
        Showing {filtered.length} of {entries.length} entries
        {entries.length >= 100 && (
          <span className='ml-1 text-orange-600'>
            (limited to 100 most recent)
          </span>
        )}
      </p>
    </div>
  );
};
