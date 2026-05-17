import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type PreBooking } from "@/services/preBookingService";
import { format } from "date-fns";

interface Props {
  open: boolean;
  onClose: () => void;
  order: PreBooking | null;
}

const ORDER_STATUS_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  pending: {
    label: "Pending",
    className: "bg-yellow-500/10 text-yellow-600 border-yellow-200",
  },
  confirmed: {
    label: "Confirmed",
    className: "bg-blue-500/10 text-blue-600 border-blue-200",
  },
  delivered: {
    label: "Delivered",
    className: "bg-green-500/10 text-green-600 border-green-200",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-red-500/10 text-red-600 border-red-200",
  },
};

const PAYMENT_STATUS_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  unpaid: {
    label: "Unpaid",
    className: "bg-red-500/10 text-red-600 border-red-200",
  },
  partial: {
    label: "Partial",
    className: "bg-orange-500/10 text-orange-600 border-orange-200",
  },
  paid: {
    label: "Paid",
    className: "bg-green-500/10 text-green-600 border-green-200",
  },
};

export const PreBookingViewDialog = ({ open, onClose, order }: Props) => {
  if (!order) return null;

  const orderConfig = ORDER_STATUS_CONFIG[order.order_status];
  const paymentConfig = PAYMENT_STATUS_CONFIG[order.payment_status];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <div className='flex items-center gap-3'>
            <DialogTitle>{order.order_id}</DialogTitle>
            <Badge
              variant='outline'
              className={`text-xs border ${orderConfig?.className}`}
            >
              {orderConfig?.label}
            </Badge>
            <Badge
              variant='outline'
              className={`text-xs border ${paymentConfig?.className}`}
            >
              {paymentConfig?.label}
            </Badge>
          </div>
        </DialogHeader>

        <div className='space-y-4 py-2'>
          {/* Customer info */}
          <div className='grid grid-cols-2 sm:grid-cols-3 gap-4'>
            <div className='space-y-1'>
              <p className='text-xs text-muted-foreground'>Customer</p>
              <p className='text-sm font-medium text-foreground'>
                {order.customer_name}
              </p>
            </div>
            <div className='space-y-1'>
              <p className='text-xs text-muted-foreground'>Mobile</p>
              <p className='text-sm font-medium text-foreground font-mono'>
                {order.mobile}
              </p>
            </div>
            {order.email && (
              <div className='space-y-1'>
                <p className='text-xs text-muted-foreground'>Email</p>
                <p className='text-sm font-medium text-foreground'>
                  {order.email}
                </p>
              </div>
            )}
            <div className='space-y-1'>
              <p className='text-xs text-muted-foreground'>Branch</p>
              <p className='text-sm font-medium text-foreground'>
                {order.branch_name}
              </p>
            </div>
            <div className='space-y-1 col-span-2'>
              <p className='text-xs text-muted-foreground'>Delivery Address</p>
              <p className='text-sm font-medium text-foreground'>
                {order.delivery_address}
              </p>
            </div>
          </div>

          <Separator />

          {/* Items */}
          <div className='space-y-2'>
            <p className='text-sm font-semibold text-foreground'>Order Items</p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead className='text-right'>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items?.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className='font-medium'>
                      {item.product_name}
                    </TableCell>
                    <TableCell>₹{Number(item.unit_price).toFixed(2)}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>
                      ₹{Number(item.product_discount).toFixed(2)}
                    </TableCell>
                    <TableCell className='text-right font-semibold'>
                      ₹{Number(item.item_total).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <Separator />

          {/* Pricing */}
          <div className='flex justify-end'>
            <div className='space-y-1.5 w-60'>
              <div className='flex justify-between text-sm'>
                <span className='text-muted-foreground'>Subtotal</span>
                <span>₹{Number(order.subtotal).toFixed(2)}</span>
              </div>
              <div className='flex justify-between text-sm'>
                <span className='text-muted-foreground'>Product Discounts</span>
                <span className='text-orange-600'>
                  − ₹{Number(order.product_discount_total).toFixed(2)}
                </span>
              </div>
              <div className='flex justify-between text-sm'>
                <span className='text-muted-foreground'>Overall Discount</span>
                <span className='text-orange-600'>
                  − ₹{Number(order.overall_discount).toFixed(2)}
                </span>
              </div>
              <Separator />
              <div className='flex justify-between font-bold'>
                <span>Final Amount</span>
                <span>₹{Number(order.final_amount).toFixed(2)}</span>
              </div>
              <div className='flex justify-between text-sm text-green-600'>
                <span>Amount Paid</span>
                <span>₹{Number(order.amount_paid).toFixed(2)}</span>
              </div>
              <div className='flex justify-between text-sm font-semibold text-destructive'>
                <span>Pending Balance</span>
                <span>₹{Number(order.pending_balance).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Delivery */}
          <div className='grid grid-cols-2 sm:grid-cols-3 gap-4'>
            <div className='space-y-1'>
              <p className='text-xs text-muted-foreground'>Delivery Date</p>
              <p className='text-sm font-medium text-foreground'>
                {format(
                  new Date(`${order.delivery_date.split("T")[0]}T00:00:00`),
                  "dd MMM yyyy",
                )}
              </p>
            </div>
            <div className='space-y-1'>
              <p className='text-xs text-muted-foreground'>Delivery Time</p>
              <p className='text-sm font-medium text-foreground'>
                {order.delivery_time?.slice(0, 5)}
              </p>
            </div>
            <div className='space-y-1'>
              <p className='text-xs text-muted-foreground'>Payment Method</p>
              <p className='text-sm font-medium text-foreground capitalize'>
                {order.payment_method || "—"}
              </p>
            </div>
            {order.remarks && (
              <div className='space-y-1 col-span-2 sm:col-span-3'>
                <p className='text-xs text-muted-foreground'>Remarks</p>
                <p className='text-sm text-foreground'>{order.remarks}</p>
              </div>
            )}
            {order.notes && (
              <div className='space-y-1 col-span-2 sm:col-span-3'>
                <p className='text-xs text-muted-foreground'>Notes</p>
                <p className='text-sm text-foreground'>{order.notes}</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
