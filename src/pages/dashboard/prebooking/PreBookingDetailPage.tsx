import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Plus, Trash2, Save, CreditCard } from "lucide-react";
import { Combobox } from "@/components/common/Combobox";
import { DatePicker } from "@/components/ui/date-picker";
import {
  preBookingService,
  type PreBooking,
} from "@/services/preBookingService";
import { productService, type Product } from "@/services/productService";
import { useAppSelector } from "@/hooks/useAppSelector";
import { toast } from "sonner";
import { format } from "date-fns";

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "upi", label: "UPI" },
  { value: "card", label: "Card" },
];

const ORDER_STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

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

interface EditableItem {
  product_id: number;
  product_name: string;
  unit_price: number;
  quantity: number;
  product_discount: number;
  item_total: number;
  isNew?: boolean;
}

export const PreBookingDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const isAdmin =
    user?.role === "admin" ||
    user?.role === "storekeeper" ||
    user?.is_super_admin;

  const [order, setOrder] = useState<PreBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // editable
  const [customerName, setCustomerName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [orderStatus, setOrderStatus] = useState("");
  const [deliveryDate, setDeliveryDate] = useState<Date | undefined>();
  const [deliveryTime, setDeliveryTime] = useState("");
  const [notes, setNotes] = useState("");
  const [overallDiscount, setOverallDiscount] = useState("0");

  // items
  const [items, setItems] = useState<EditableItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");

  // payment modal
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentRemarks, setPaymentRemarks] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  // status update
  const [statusLoading, setStatusLoading] = useState(false);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const data = await preBookingService.getById(Number(id));
      setOrder(data);
      populateForm(data);
    } catch {
      toast.error("Failed to load order");
    } finally {
      setLoading(false);
    }
  };

  const populateForm = (data: PreBooking) => {
    setCustomerName(data.customer_name);
    setMobile(data.mobile);
    setEmail(data.email || "");
    setDeliveryAddress(data.delivery_address);
    setOrderStatus(data.order_status);
    setDeliveryDate(new Date(`${data.delivery_date.split("T")[0]}T00:00:00`));
    setDeliveryTime(data.delivery_time?.slice(0, 5) || "");
    setNotes(data.notes || "");
    setOverallDiscount(String(data.overall_discount || 0));
    setItems(
      (data.items || []).map((item) => ({
        product_id: item.product_id,
        product_name: item.product_name,
        unit_price: Number(item.unit_price),
        quantity: Number(item.quantity),
        product_discount: Number(item.product_discount),
        item_total: Number(item.item_total),
      })),
    );
  };

  useEffect(() => {
    fetchOrder();
    productService
      .getAll()
      .then((data) => setProducts(data.filter((p) => p.is_active)));
  }, [id]);

  // ─── Computed ─────────────────────────────────────────────────

  const subtotal = items.reduce(
    (sum, item) => sum + item.unit_price * item.quantity,
    0,
  );
  const productDiscountTotal = items.reduce(
    (sum, item) => sum + Number(item.product_discount),
    0,
  );
  const totalAmount = subtotal - productDiscountTotal;
  const overallDiscountNum = parseFloat(overallDiscount) || 0;
  const finalAmount = Math.max(0, totalAmount - overallDiscountNum);
  const currentPaid = Number(order?.amount_paid || 0);
  const pendingBalance = Math.max(0, finalAmount - currentPaid);

  // ─── Items ────────────────────────────────────────────────────

  const handleAddProduct = () => {
    if (!selectedProductId) return;
    const existing = items.find(
      (item) => String(item.product_id) === selectedProductId,
    );
    if (existing) {
      toast.error("Product already in order");
      return;
    }
    const product = products.find((p) => String(p.id) === selectedProductId);
    if (!product) return;
    setItems((prev) => [
      ...prev,
      {
        product_id: product.id,
        product_name: product.name,
        unit_price: Number(product.price),
        quantity: 1,
        product_discount: 0,
        item_total: Number(product.price),
        isNew: true,
      },
    ]);
    setSelectedProductId("");
  };

  const updateQty = (index: number, delta: number) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const newQty = Math.max(1, item.quantity + delta);
        return {
          ...item,
          quantity: newQty,
          item_total: newQty * item.unit_price - item.product_discount,
        };
      }),
    );
  };

  const updateDiscount = (index: number, value: string) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const discount = parseFloat(value) || 0;
        return {
          ...item,
          product_discount: discount,
          item_total: item.quantity * item.unit_price - discount,
        };
      }),
    );
  };

  const removeItem = (index: number) => {
    if (items.length === 1) {
      toast.error("At least one item required");
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // ─── Save order details ───────────────────────────────────────

  const handleSave = async () => {
    setError("");
    if (!customerName.trim() || !mobile.trim() || !deliveryAddress.trim()) {
      setError("Customer name, mobile and address are required");
      return;
    }
    if (!deliveryDate || !deliveryTime) {
      setError("Delivery date and time are required");
      return;
    }
    setSaving(true);
    try {
      await preBookingService.update(Number(id), {
        customer_name: customerName.trim(),
        mobile: mobile.trim(),
        email: email.trim(),
        delivery_address: deliveryAddress.trim(),
        items: items.map((item) => ({
          product_id: item.product_id,
          product_name: item.product_name,
          unit_price: item.unit_price,
          quantity: item.quantity,
          product_discount: item.product_discount,
          item_total: item.item_total,
        })),
        subtotal,
        product_discount_total: productDiscountTotal,
        overall_discount: overallDiscountNum,
        final_amount: finalAmount,
        additional_payment: 0,
        order_status: orderStatus,
        delivery_date: format(deliveryDate, "yyyy-MM-dd"),
        delivery_time: deliveryTime,
        remarks: order?.remarks || "",
        notes: notes.trim(),
      });
      toast.success("Order updated");
      await fetchOrder();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  // ─── Add payment ──────────────────────────────────────────────

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError("");
    if (!paymentAmount || Number(paymentAmount) <= 0) {
      setPaymentError("Amount must be greater than 0");
      return;
    }
    if (!paymentMethod) {
      setPaymentError("Please select payment method");
      return;
    }
    setPaymentLoading(true);
    try {
      await preBookingService.updatePayment(Number(id), {
        additional_payment: Number(paymentAmount),
        payment_method: paymentMethod,
        remarks: paymentRemarks,
      });
      toast.success("Payment recorded");
      await fetchOrder();
      setPaymentOpen(false);
      setPaymentAmount("");
      setPaymentMethod("");
      setPaymentRemarks("");
    } catch (err: any) {
      setPaymentError(
        err.response?.data?.message || "Failed to record payment",
      );
    } finally {
      setPaymentLoading(false);
    }
  };

  if (loading) {
    return (
      <div className='text-center py-12 text-muted-foreground'>
        Loading order...
      </div>
    );
  }

  if (!order) {
    return (
      <div className='text-center py-12 text-muted-foreground'>
        Order not found.
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      {/* Header */}
      <div className='flex items-center gap-4'>
        <Button
          variant='ghost'
          size='icon'
          onClick={() => navigate("/dashboard/prebooking/orders")}
        >
          <ArrowLeft className='w-4 h-4' />
        </Button>
        <div className='flex-1'>
          <div className='flex items-center gap-3 flex-wrap'>
            <h2 className='text-xl font-bold text-foreground'>
              Pre-Booking Details — {order.order_id}
            </h2>
            <Badge
              variant='outline'
              className={`text-xs border ${ORDER_STATUS_CONFIG[order.order_status]?.className}`}
            >
              {ORDER_STATUS_CONFIG[order.order_status]?.label}
            </Badge>
            <Badge
              variant='outline'
              className={`text-xs border ${PAYMENT_STATUS_CONFIG[order.payment_status]?.className}`}
            >
              {PAYMENT_STATUS_CONFIG[order.payment_status]?.label}
            </Badge>
          </div>
          <p className='text-sm text-muted-foreground mt-0.5'>
            Created by {order.created_by_name} ·{" "}
            {format(new Date(order.created_at), "dd MMM yyyy, hh:mm a")}
          </p>
        </div>
      </div>

      {/* Two column layout */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Left — main content */}
        <div className='lg:col-span-2 space-y-6'>
          {/* Order Information */}
          <Card>
            <CardHeader className='pb-3'>
              <CardTitle className='text-base'>Order Information</CardTitle>
            </CardHeader>
            <CardContent className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label>Customer Name</Label>
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>

              <div className='space-y-2'>
                <Label>Mobile</Label>
                <Input
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  maxLength={10}
                />
              </div>

              <div className='space-y-2'>
                <Label>Email</Label>
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder='optional'
                />
              </div>

              <div className='space-y-2'>
                <Label>Branch</Label>
                <Input
                  value={order.branch_name}
                  readOnly
                  className='bg-muted text-muted-foreground cursor-not-allowed'
                />
              </div>

              <div className='space-y-2'>
                <Label>Delivery Date</Label>
                <DatePicker
                  date={deliveryDate}
                  setDate={setDeliveryDate}
                  placeholder='Select date'
                />
              </div>

              <div className='space-y-2'>
                <Label>Delivery Time</Label>
                <Input
                  type='time'
                  value={deliveryTime}
                  onChange={(e) => setDeliveryTime(e.target.value)}
                />
              </div>

              <div className='space-y-2 sm:col-span-2'>
                <Label>Delivery Address</Label>
                <Input
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                />
              </div>

              <div className='space-y-2 sm:col-span-2'>
                <Label>Additional Notes</Label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder='Special instructions...'
                />
              </div>
            </CardContent>
          </Card>

          {/* Product Details */}
          <Card>
            <CardHeader className='pb-3'>
              <CardTitle className='text-base'>Product Details</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              {/* Add product */}
              <div className='flex gap-3 items-end'>
                <div className='flex-1 space-y-2'>
                  <Label>Add Product</Label>
                  <Combobox
                    options={products
                      .filter(
                        (p) => !items.find((item) => item.product_id === p.id),
                      )
                      .map((p) => ({
                        value: String(p.id),
                        label: `${p.name} — ₹${Number(p.price).toFixed(2)}`,
                      }))}
                    value={selectedProductId}
                    onChange={setSelectedProductId}
                    placeholder='Select product'
                    searchPlaceholder='Search products...'
                    emptyText='No products available.'
                  />
                </div>
                <Button
                  type='button'
                  variant='outline'
                  onClick={handleAddProduct}
                  className='gap-2'
                >
                  <Plus className='w-4 h-4' />
                  Add
                </Button>
              </div>

              {/* Items table */}
              <div className='border rounded-md overflow-hidden'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Product Discount</TableHead>
                      <TableHead>Item Total</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className='font-medium'>
                          <div className='flex items-center gap-2'>
                            {item.product_name}
                            {item.isNew && (
                              <Badge variant='secondary' className='text-xs'>
                                New
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>₹{item.unit_price.toFixed(2)}</TableCell>
                        <TableCell>
                          <div className='flex items-center gap-2'>
                            <Button
                              type='button'
                              variant='outline'
                              size='icon'
                              className='w-7 h-7'
                              onClick={() => updateQty(index, -1)}
                            >
                              −
                            </Button>
                            <span className='w-8 text-center text-sm font-medium'>
                              {item.quantity}
                            </span>
                            <Button
                              type='button'
                              variant='outline'
                              size='icon'
                              className='w-7 h-7'
                              onClick={() => updateQty(index, 1)}
                            >
                              +
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Input
                            type='number'
                            min='0'
                            step='0.01'
                            value={item.product_discount}
                            onChange={(e) =>
                              updateDiscount(index, e.target.value)
                            }
                            className='w-24'
                          />
                        </TableCell>
                        <TableCell className='font-semibold'>
                          ₹{item.item_total.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Button
                            type='button'
                            variant='ghost'
                            size='icon'
                            className='w-8 h-8 text-destructive hover:text-destructive'
                            onClick={() => removeItem(index)}
                          >
                            <Trash2 className='w-4 h-4' />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pricing */}
              <div className='flex justify-end'>
                <div className='space-y-2 w-72'>
                  <div className='flex justify-between text-sm'>
                    <span className='text-muted-foreground'>Subtotal</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className='flex justify-between text-sm'>
                    <span className='text-muted-foreground'>Total Amount</span>
                    <span>₹{totalAmount.toFixed(2)}</span>
                  </div>
                  <div className='flex items-center justify-between text-sm'>
                    <span className='text-muted-foreground'>
                      Overall Discount
                    </span>
                    <Input
                      type='number'
                      min='0'
                      step='0.01'
                      value={overallDiscount}
                      onChange={(e) => setOverallDiscount(e.target.value)}
                      className='w-28 h-8 text-right'
                    />
                  </div>
                  <Separator />
                  <div className='flex justify-between font-bold text-base'>
                    <span>Final Amount</span>
                    <span>₹{finalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {error && (
            <p className='text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md'>
              {error}
            </p>
          )}

          {/* Save button */}
          <div className='flex gap-3 pb-8'>
            <Button onClick={handleSave} disabled={saving} className='gap-2'>
              <Save className='w-4 h-4' />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
            <Button
              variant='outline'
              onClick={() => navigate("/dashboard/prebooking/orders")}
            >
              Back to List
            </Button>
          </div>
        </div>

        {/* Right sidebar */}
        <div className='space-y-4'>
          {/* Payment Summary */}
          <Card>
            <CardHeader className='pb-3'>
              <CardTitle className='text-base'>Payment Summary</CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              <div className='flex justify-between text-sm'>
                <span className='text-muted-foreground'>Subtotal</span>
                <span>₹{Number(order.subtotal).toFixed(2)}</span>
              </div>
              <div className='flex justify-between text-sm'>
                <span className='text-muted-foreground'>Total Amount</span>
                <span>₹{Number(order.subtotal).toFixed(2)}</span>
              </div>
              <div className='flex justify-between text-sm'>
                <span className='text-muted-foreground'>Overall Discount</span>
                <span className='text-destructive'>
                  −₹{Number(order.overall_discount).toFixed(2)}
                </span>
              </div>
              <div className='flex justify-between text-sm font-semibold text-green-600'>
                <span>Final Amount</span>
                <span>₹{Number(order.final_amount).toFixed(2)}</span>
              </div>
              <Separator />
              <div className='flex justify-between text-sm'>
                <span className='text-muted-foreground'>Amount Paid</span>
                <span className='text-green-600 font-medium'>
                  ₹{Number(order.amount_paid).toFixed(2)}
                </span>
              </div>
              <div className='flex justify-between text-sm font-semibold'>
                <span className='text-muted-foreground'>Pending Balance</span>
                <span className='text-destructive'>
                  ₹{Number(order.pending_balance).toFixed(2)}
                </span>
              </div>

              {/* Add Payment button */}
              {Number(order.pending_balance) > 0 && (
                <Button
                  className='w-full gap-2 mt-2'
                  onClick={() => {
                    setPaymentAmount("");
                    setPaymentMethod("");
                    setPaymentRemarks("");
                    setPaymentError("");
                    setPaymentOpen(true);
                  }}
                >
                  <CreditCard className='w-4 h-4' />
                  Add Payment
                </Button>
              )}

              {Number(order.pending_balance) === 0 && (
                <div className='text-center text-sm text-green-600 font-medium pt-1'>
                  ✓ Fully Paid
                </div>
              )}
            </CardContent>
          </Card>

          {/* Update Status */}
          {isAdmin && (
            <Card>
              <CardHeader className='pb-3'>
                <CardTitle className='text-base'>Update Status</CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                <div className='space-y-2'>
                  <Label>Order Status</Label>
                  <Select value={orderStatus} onValueChange={setOrderStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ORDER_STATUSES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  className='w-full'
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? "Updating..." : "Update Status"}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Payment History */}
          <Card>
            <CardHeader className='pb-3'>
              <CardTitle className='text-base'>Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              {!order.payment_history || order.payment_history.length === 0 ? (
                <p className='text-sm text-muted-foreground text-center py-4'>
                  No payments recorded yet.
                </p>
              ) : (
                <div className='space-y-0'>
                  <div className='grid grid-cols-3 gap-2 pb-2'>
                    <p className='text-xs font-medium text-muted-foreground'>
                      Date
                    </p>
                    <p className='text-xs font-medium text-muted-foreground'>
                      Amount
                    </p>
                    <p className='text-xs font-medium text-muted-foreground'>
                      Method
                    </p>
                  </div>
                  <Separator />
                  {order.payment_history.map((payment) => (
                    <div key={payment.id}>
                      <div className='grid grid-cols-3 gap-2 py-2'>
                        <p className='text-xs text-muted-foreground'>
                          {format(new Date(payment.created_at), "dd/MM/yy")}
                        </p>
                        <p className='text-xs font-semibold text-green-600'>
                          ₹{Number(payment.amount).toFixed(2)}
                        </p>
                        <p className='text-xs text-foreground uppercase'>
                          {payment.payment_method}
                        </p>
                      </div>
                      {payment.remarks && (
                        <p className='text-xs text-muted-foreground pb-1'>
                          {payment.remarks}
                        </p>
                      )}
                      <Separator />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Payment Modal */}
      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent className='sm:max-w-sm'>
          <DialogHeader>
            <DialogTitle>Add Payment</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddPayment} className='space-y-4 py-2'>
            {/* Balance info */}
            <div className='grid grid-cols-2 gap-3 p-3 rounded-md bg-muted text-center'>
              <div>
                <p className='text-xs text-muted-foreground'>Final Amount</p>
                <p className='text-sm font-bold'>
                  ₹{Number(order.final_amount).toFixed(2)}
                </p>
              </div>
              <div>
                <p className='text-xs text-muted-foreground'>Pending Balance</p>
                <p className='text-sm font-bold text-destructive'>
                  ₹{Number(order.pending_balance).toFixed(2)}
                </p>
              </div>
            </div>

            <div className='space-y-2'>
              <Label>
                Amount (₹)
                <span className='text-xs text-muted-foreground ml-2'>
                  max ₹{Number(order.pending_balance).toFixed(2)}
                </span>
              </Label>
              <Input
                type='number'
                min='0.01'
                step='0.01'
                max={Number(order.pending_balance)}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder='0.00'
                autoFocus
                required
              />
            </div>

            <div className='space-y-2'>
              <Label>Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder='Select method' />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label>
                Remarks
                <span className='text-xs text-muted-foreground ml-2'>
                  (optional)
                </span>
              </Label>
              <Input
                value={paymentRemarks}
                onChange={(e) => setPaymentRemarks(e.target.value)}
                placeholder='e.g. Balance payment'
              />
            </div>

            {paymentError && (
              <p className='text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md'>
                {paymentError}
              </p>
            )}

            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => setPaymentOpen(false)}
              >
                Cancel
              </Button>
              <Button type='submit' disabled={paymentLoading}>
                {paymentLoading ? "Recording..." : "Record Payment"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
