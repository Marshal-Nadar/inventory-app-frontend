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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  ArrowUpDown,
  ArrowLeftRight,
  Clock,
} from "lucide-react";
import {
  transferRequestService,
  type TransferRequest,
} from "@/services/transferRequestService";
import { RejectDialog } from "./RejectDialog";
import { useAppSelector } from "@/hooks/useAppSelector";
import { toast } from "sonner";
import { DeleteConfirmDialog } from "@/components/common/DeleteConfirmDialog";
import { TransferRequestDetailDialog } from "./TransferRequestDetailDialog";

const columnHelper = createColumnHelper<TransferRequest>();

const StatusBadge = ({ status }: { status: string }) => {
  const config = {
    pending: {
      label: "Pending",
      className: "bg-yellow-500/10 text-yellow-600 border-yellow-200",
    },
    approved: {
      label: "Approved",
      className: "bg-green-500/10 text-green-600 border-green-200",
    },
    rejected: {
      label: "Rejected",
      className: "bg-red-500/10 text-red-600 border-red-200",
    },
  }[status] || { label: status, className: "" };

  return (
    <Badge variant='outline' className={`text-xs border ${config.className}`}>
      {config.label}
    </Badge>
  );
};

export const TransferRequestsPage = () => {
  const user = useAppSelector((state) => state.auth.user);
  const canManageStore = user?.can_manage_store || user?.is_super_admin;

  const [requests, setRequests] = useState<TransferRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [approveOpen, setApproveOpen] = useState(false);
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [approveLoading, setApproveLoading] = useState(false);

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectLoading, setRejectLoading] = useState(false);

  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] =
    useState<TransferRequest | null>(null);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const data = await transferRequestService.getAll();
      setRequests(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async () => {
    if (!approvingId) return;
    setApproveLoading(true);
    try {
      await transferRequestService.approve(approvingId);
      await fetchRequests();
      setApproveOpen(false);
      setApprovingId(null);
      toast.success("Transfer request approved — stock updated");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to approve request");
    } finally {
      setApproveLoading(false);
    }
  };

  const handleReject = async (reason: string) => {
    if (!rejectingId) return;
    setRejectLoading(true);
    try {
      await transferRequestService.reject(rejectingId, reason);
      await fetchRequests();
      setRejectOpen(false);
      setRejectingId(null);
      toast.success("Transfer request rejected");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to reject request");
    } finally {
      setRejectLoading(false);
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
      columnHelper.accessor("created_at", {
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
      columnHelper.accessor("branch_name", {
        header: "Branch",
        cell: (info) => (
          <span className='font-medium text-foreground'>{info.getValue()}</span>
        ),
      }),
      columnHelper.display({
        id: "items",
        header: "Raw Materials",
        cell: ({ row }) => (
          <div className='space-y-1'>
            {row.original.items?.slice(0, 2).map((item, i) => (
              <div key={i} className='flex items-center gap-2'>
                <span className='text-sm text-foreground'>
                  {item.raw_material_name}
                </span>
                <Badge variant='secondary' className='text-xs'>
                  {Number(item.quantity)} {item.metric}
                </Badge>
              </div>
            ))}
            {row.original.items?.length > 2 && (
              <span className='text-xs text-muted-foreground'>
                +{row.original.items.length - 2} more
              </span>
            )}
            <Button
              variant='ghost'
              size='sm'
              className='h-7 text-xs gap-1 px-2'
              onClick={() => {
                setSelectedRequest(row.original);
                setDetailOpen(true);
              }}
            >
              View Details
            </Button>
          </div>
        ),
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: (info) => <StatusBadge status={info.getValue()} />,
      }),
      columnHelper.accessor("requested_by_name", {
        header: "Requested By",
        cell: (info) => (
          <span className='text-sm text-muted-foreground'>
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor("notes", {
        header: "Notes",
        cell: (info) => (
          <span className='text-sm text-muted-foreground'>
            {info.getValue() || "—"}
          </span>
        ),
      }),
      columnHelper.display({
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const isPending = row.original.status === "pending";
          const isRejected = row.original.status === "rejected";

          return (
            <div className='flex items-center gap-2'>
              {/* Store manager actions */}
              {canManageStore && isPending && (
                <>
                  <Button
                    size='sm'
                    variant='outline'
                    className='gap-1 text-green-600 border-green-200 hover:bg-green-50 h-8'
                    onClick={() => {
                      setApprovingId(row.original.id);
                      setApproveOpen(true);
                    }}
                  >
                    <CheckCircle className='w-3.5 h-3.5' />
                    Approve
                  </Button>
                  <Button
                    size='sm'
                    variant='outline'
                    className='gap-1 text-destructive border-red-200 hover:bg-red-50 h-8'
                    onClick={() => {
                      setRejectingId(row.original.id);
                      setRejectOpen(true);
                    }}
                  >
                    <XCircle className='w-3.5 h-3.5' />
                    Reject
                  </Button>
                </>
              )}

              {/* Show rejection reason */}
              {isRejected && row.original.rejection_reason && (
                <span className='text-xs text-muted-foreground max-w-32 truncate'>
                  {row.original.rejection_reason}
                </span>
              )}

              {/* Actioned by info */}
              {!isPending && row.original.actioned_by_name && (
                <span className='text-xs text-muted-foreground'>
                  by {row.original.actioned_by_name}
                </span>
              )}
            </div>
          );
        },
      }),
    ],
    [canManageStore],
  );

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      const matchSearch =
        r.branch_name?.toLowerCase().includes(search.toLowerCase()) ||
        r.requested_by_name?.toLowerCase().includes(search.toLowerCase()) ||
        r.items?.some((item) =>
          item.raw_material_name?.toLowerCase().includes(search.toLowerCase()),
        );

      const matchStatus =
        statusFilter === "all" ? true : r.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [requests, search, statusFilter]);

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  return (
    <div className='space-y-4'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-xl font-bold text-foreground'>
            Transfer Requests
          </h2>
          <p className='text-sm text-muted-foreground mt-1'>
            {canManageStore
              ? "Review and action raw material requests from branches."
              : "Track your branch's raw material requests."}
          </p>
        </div>
        {pendingCount > 0 && canManageStore && (
          <Badge className='bg-yellow-500/10 text-yellow-600 border border-yellow-200 gap-1'>
            <Clock className='w-3.5 h-3.5' />
            {pendingCount} pending
          </Badge>
        )}
      </div>

      {/* Search + Status filter */}
      <div className='flex flex-wrap gap-3 items-center'>
        <div className='relative w-full sm:max-w-xs'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground' />
          <Input
            placeholder='Search requests...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='pl-9'
          />
        </div>

        {/* Status filter buttons */}
        <div className='flex gap-2'>
          {["all", "pending", "approved", "rejected"].map((s) => (
            <Button
              key={s}
              size='sm'
              variant={statusFilter === s ? "default" : "outline"}
              onClick={() => setStatusFilter(s)}
              className='capitalize'
            >
              {s}
              {s === "pending" && pendingCount > 0 && (
                <Badge className='ml-1.5 h-4 w-4 p-0 flex items-center justify-center text-xs bg-yellow-500 text-white'>
                  {pendingCount}
                </Badge>
              )}
            </Button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className='flex gap-4'>
        <div className='text-sm text-muted-foreground'>
          Total:{" "}
          <span className='font-medium text-foreground'>{requests.length}</span>
        </div>
        <div className='text-sm text-muted-foreground'>
          Pending:{" "}
          <span className='font-medium text-yellow-600'>{pendingCount}</span>
        </div>
        <div className='text-sm text-muted-foreground'>
          Approved:{" "}
          <span className='font-medium text-green-600'>
            {requests.filter((r) => r.status === "approved").length}
          </span>
        </div>
        <div className='text-sm text-muted-foreground'>
          Rejected:{" "}
          <span className='font-medium text-destructive'>
            {requests.filter((r) => r.status === "rejected").length}
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
                    Loading requests...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className='text-center py-16'
                  >
                    <div className='flex flex-col items-center gap-3 text-muted-foreground'>
                      <ArrowLeftRight className='w-10 h-10 opacity-30' />
                      <p className='text-sm'>No transfer requests found.</p>
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
        Showing {filtered.length} of {requests.length} requests
      </p>

      {/* Approve confirm dialog */}
      <DeleteConfirmDialog
        open={approveOpen}
        onClose={() => {
          setApproveOpen(false);
          setApprovingId(null);
        }}
        onConfirm={handleApprove}
        title='Approve Transfer Request'
        description='Stock will be deducted from the store and transferred to the branch. This cannot be undone.'
        loading={approveLoading}
        confirmLabel='Approve'
        confirmVariant='default'
      />

      {/* Reject dialog */}
      <RejectDialog
        open={rejectOpen}
        onClose={() => {
          setRejectOpen(false);
          setRejectingId(null);
        }}
        onConfirm={handleReject}
        loading={rejectLoading}
      />

      <TransferRequestDetailDialog
        open={detailOpen}
        onClose={() => {
          setDetailOpen(false);
          setSelectedRequest(null);
        }}
        request={selectedRequest}
      />
    </div>
  );
};
