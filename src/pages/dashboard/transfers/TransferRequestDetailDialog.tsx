import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { TransferRequest } from "@/services/transferRequestService";

interface Props {
  open: boolean;
  onClose: () => void;
  request: TransferRequest | null;
}

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

export const TransferRequestDetailDialog = ({
  open,
  onClose,
  request,
}: Props) => {
  if (!request) return null;

  const overallTotal =
    request.items?.reduce((sum, item) => {
      return sum + Number(item.quantity) * Number(item.avg_price || 0);
    }, 0) || 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <div className='flex items-center gap-3'>
            <DialogTitle>Request #{request.id}</DialogTitle>
            <StatusBadge status={request.status} />
          </div>
        </DialogHeader>

        <div className='space-y-4 py-2'>
          {/* Request info */}
          <div className='grid grid-cols-2 sm:grid-cols-3 gap-4'>
            <div className='space-y-1'>
              <p className='text-xs text-muted-foreground'>Branch</p>
              <p className='text-sm font-medium text-foreground'>
                {request.branch_name}
              </p>
            </div>
            <div className='space-y-1'>
              <p className='text-xs text-muted-foreground'>Requested By</p>
              <p className='text-sm font-medium text-foreground'>
                {request.requested_by_name}
              </p>
            </div>
            <div className='space-y-1'>
              <p className='text-xs text-muted-foreground'>Date</p>
              <p className='text-sm font-medium text-foreground'>
                {new Date(request.created_at).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
            {request.notes && (
              <div className='space-y-1 col-span-2 sm:col-span-3'>
                <p className='text-xs text-muted-foreground'>Notes</p>
                <p className='text-sm text-foreground'>{request.notes}</p>
              </div>
            )}
            {request.status === "rejected" && request.rejection_reason && (
              <div className='space-y-1 col-span-2 sm:col-span-3'>
                <p className='text-xs text-muted-foreground'>
                  Rejection Reason
                </p>
                <p className='text-sm text-destructive'>
                  {request.rejection_reason}
                </p>
              </div>
            )}
            {request.actioned_by_name && (
              <div className='space-y-1 col-span-2 sm:col-span-3'>
                <p className='text-xs text-muted-foreground'>
                  {request.status === "approved" ? "Approved" : "Rejected"} By
                </p>
                <p className='text-sm text-foreground'>
                  {request.actioned_by_name}
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* Items table */}
          <div className='space-y-2'>
            <p className='text-sm font-semibold text-foreground'>
              Requested Items
            </p>

            {/* Header */}
            <div className='grid grid-cols-[32px_2fr_1fr_1fr_1fr_1fr] gap-3 px-2'>
              <span className='text-xs text-muted-foreground'>#</span>
              <span className='text-xs text-muted-foreground'>
                Raw Material
              </span>
              <span className='text-xs text-muted-foreground'>Quantity</span>
              <span className='text-xs text-muted-foreground'>Metric</span>
              <span className='text-xs text-muted-foreground'>Price/Unit</span>
              <span className='text-xs text-muted-foreground text-right'>
                Total
              </span>
            </div>

            <Separator />

            {/* Rows */}
            {request.items?.map((item, index) => {
              const rowTotal =
                Number(item.quantity) * Number(item.avg_price || 0);
              return (
                <div
                  key={item.id}
                  className='grid grid-cols-[32px_2fr_1fr_1fr_1fr_1fr] gap-3 px-2 items-center'
                >
                  <span className='text-xs text-muted-foreground'>
                    {index + 1}
                  </span>
                  <div>
                    <p className='text-sm font-medium text-foreground'>
                      {item.raw_material_name}
                    </p>
                    <p className='text-xs text-muted-foreground capitalize'>
                      {item.raw_material_category}
                    </p>
                  </div>
                  <span className='text-sm'>{Number(item.quantity)}</span>
                  <Badge variant='secondary' className='w-fit'>
                    {item.metric}
                  </Badge>
                  <span className='text-sm'>
                    {Number(item.avg_price) > 0
                      ? `₹${Number(item.avg_price).toFixed(2)}`
                      : "—"}
                  </span>
                  <span className='text-sm font-semibold text-right'>
                    {rowTotal > 0 ? `₹${rowTotal.toFixed(2)}` : "—"}
                  </span>
                </div>
              );
            })}

            <Separator />

            {/* Overall total */}
            <div className='flex items-center justify-end gap-4 px-2'>
              <span className='text-sm font-semibold text-foreground'>
                Overall Total
              </span>
              <span className='text-lg font-bold text-foreground'>
                {overallTotal > 0 ? `₹${overallTotal.toFixed(2)}` : "—"}
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
