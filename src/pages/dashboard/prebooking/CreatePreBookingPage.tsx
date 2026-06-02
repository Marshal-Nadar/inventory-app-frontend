import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Combobox } from "@/components/common/Combobox";
import { DatePicker } from "@/components/ui/date-picker";
import { productService, type Product } from "@/services/productService";
import { branchService, type Branch } from "@/services/branchService";
import { preBookingService } from "@/services/preBookingService";
import { useAppSelector } from "@/hooks/useAppSelector";
import { toast } from "sonner";
import { Plus, Trash2, ShoppingCart, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { NumberInput } from "@/components/ui/number-input";

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "upi", label: "UPI" },
  { value: "card", label: "Card" },
];

interface OrderItem {
  product_id: number;
  product_name: string;
  unit_price: number;
  quantity: number;
  product_discount: number;
  item_total: number;
}

export const CreatePreBookingPage = () => {
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const isAdmin =
    user?.role === "admin" ||
    user?.role === "storekeeper" ||
    user?.is_super_admin;

  // customer
  const [customerName, setCustomerName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");

  // branch
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchId, setBranchId] = useState(String(user?.branch_id || ""));

  // products
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

  // pricing
  const [overallDiscount, setOverallDiscount] = useState("0");

  // payment
  const [amountPaid, setAmountPaid] = useState("0");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [remarks, setRemarks] = useState("");

  // delivery
  const [deliveryDate, setDeliveryDate] = useState<Date | undefined>(
    new Date(),
  );

  const [deliveryTime, setDeliveryTime] = useState("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    productService
      .getAll()
      .then((data) => setProducts(data.filter((p) => p.is_active)));

    if (isAdmin) {
      branchService
        .getAll()
        .then((data) => setBranches(data.filter((b) => b.is_active)));
    }
  }, []);

  // ─── Computed values ──────────────────────────────────────────

  const subtotal = orderItems.reduce(
    (sum, item) => sum + item.unit_price * item.quantity,
    0,
  );

  const productDiscountTotal = orderItems.reduce(
    (sum, item) => sum + Number(item.product_discount),
    0,
  );

  const totalAmount = subtotal - productDiscountTotal;

  const overallDiscountNum = parseFloat(overallDiscount) || 0;

  const finalAmount = Math.max(0, totalAmount - overallDiscountNum);

  const pendingBalance = Math.max(
    0,
    finalAmount - (parseFloat(amountPaid) || 0),
  );

  // ─── Item management ──────────────────────────────────────────

  const handleAddProduct = () => {
    if (!selectedProductId) {
      toast.error("Please select a product");
      return;
    }
    const existing = orderItems.find(
      (item) => String(item.product_id) === selectedProductId,
    );
    if (existing) {
      toast.error("Product already added — adjust quantity instead");
      return;
    }
    const product = products.find((p) => String(p.id) === selectedProductId);
    if (!product) return;

    setOrderItems((prev) => [
      ...prev,
      {
        product_id: product.id,
        product_name: product.name,
        unit_price: Number(product.price),
        quantity: 1,
        product_discount: 0,
        item_total: Number(product.price),
      },
    ]);
    setSelectedProductId("");
  };

  const updateItemQty = (index: number, delta: number) => {
    setOrderItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const newQty = Math.max(1, item.quantity + delta);
        return {
          ...item,
          quantity: newQty,
          item_total: newQty * item.unit_price - Number(item.product_discount),
        };
      }),
    );
  };

  const updateItemDiscount = (index: number, value: string) => {
    setOrderItems((prev) =>
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
    setOrderItems((prev) => prev.filter((_, i) => i !== index));
  };

  // ─── Submit ───────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!customerName.trim()) {
      setError("Customer name is required");
      return;
    }
    if (!mobile.trim() || mobile.length < 10) {
      setError("Valid mobile number is required");
      return;
    }
    if (!deliveryAddress.trim()) {
      setError("Delivery address is required");
      return;
    }
    if (isAdmin && !branchId) {
      setError("Please select a branch");
      return;
    }
    if (orderItems.length === 0) {
      setError("Please add at least one product");
      return;
    }
    if (!deliveryDate) {
      setError("Delivery date is required");
      return;
    }
    if (!deliveryTime) {
      setError("Delivery time is required");
      return;
    }

    const paid = parseFloat(amountPaid) || 0;
    if (paid > finalAmount) {
      setError(
        `Amount paid (₹${paid}) cannot exceed final amount (₹${finalAmount.toFixed(2)})`,
      );
      return;
    }

    if (paid > 0 && !paymentMethod) {
      setError("Please select a payment method");
      return;
    }

    setLoading(true);
    try {
      await preBookingService.create({
        branch_id: isAdmin ? Number(branchId) : undefined,
        customer_name: customerName.trim(),
        mobile: mobile.trim(),
        email: email.trim(),
        delivery_address: deliveryAddress.trim(),
        items: orderItems,
        subtotal,
        product_discount_total: productDiscountTotal,
        overall_discount: overallDiscountNum,
        final_amount: finalAmount,
        amount_paid: paid,
        payment_method: paid > 0 ? paymentMethod : undefined,
        delivery_date: deliveryDate ? format(deliveryDate, "yyyy-MM-dd") : "",
        delivery_time: deliveryTime,
        remarks: remarks.trim(),
        notes: notes.trim(),
      });
      toast.success("Pre-booking order created successfully");
      navigate("/dashboard/prebooking/orders");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create order");
    } finally {
      setLoading(false);
    }
  };

  if (user?.is_super_admin) {
    return (
      <div className='text-center py-16 space-y-3'>
        <AlertTriangle className='w-10 h-10 text-orange-600 mx-auto opacity-50' />
        <p className='text-sm font-medium text-foreground'>
          Super Admin cannot create operational records.
        </p>
        <p className='text-xs text-muted-foreground'>
          Log in as a restaurant admin to perform this action.
        </p>
      </div>
    );
  }

  return (
    <div className='space-y-6 max-w-4xl'>
      {/* Header */}
      <div>
        <h2 className='text-xl font-bold text-foreground'>
          Create New Pre-Booking
        </h2>
        <p className='text-sm text-muted-foreground mt-1'>
          Create a new pre-booking order for a customer.
        </p>
      </div>

      <form onSubmit={handleSubmit} className='space-y-6'>
        {/* Customer Details */}
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='text-base'>Customer Details</CardTitle>
          </CardHeader>
          <CardContent className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label>
                Customer Name <span className='text-destructive'>*</span>
              </Label>
              <Input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder='e.g. John Doe'
                required
              />
            </div>

            <div className='space-y-2'>
              <Label>
                Mobile Number <span className='text-destructive'>*</span>
              </Label>
              <Input
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder='10-digit mobile'
                maxLength={10}
                required
              />
            </div>

            <div className='space-y-2'>
              <Label>Email Address</Label>
              <Input
                type='email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder='optional'
              />
            </div>

            {/* Branch */}
            <div className='space-y-2'>
              <Label>
                Branch <span className='text-destructive'>*</span>
              </Label>
              {isAdmin ? (
                <Combobox
                  options={branches.map((b) => ({
                    value: String(b.id),
                    label: b.name,
                  }))}
                  value={branchId}
                  onChange={setBranchId}
                  placeholder='Select branch'
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

            <div className='space-y-2 sm:col-span-2'>
              <Label>
                Delivery Address <span className='text-destructive'>*</span>
              </Label>
              <Input
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder='Full delivery address'
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Order Details */}
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='text-base'>Order Details</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            {/* Product selector */}
            <div className='flex gap-3 items-end'>
              <div className='flex-1 space-y-2'>
                <Label>Select Product</Label>
                <Combobox
                  options={products
                    .filter(
                      (p) =>
                        !orderItems.find((item) => item.product_id === p.id),
                    )
                    .map((p) => ({
                      value: String(p.id),
                      label: `${p.name} — ₹${Number(p.price).toFixed(2)}`,
                    }))}
                  value={selectedProductId}
                  onChange={setSelectedProductId}
                  placeholder='Select a product'
                  searchPlaceholder='Search products...'
                  emptyText='No products available.'
                />
              </div>
              <Button
                type='button'
                onClick={handleAddProduct}
                className='gap-2'
              >
                <Plus className='w-4 h-4' />
                Add
              </Button>
            </div>

            {/* Items table */}
            {orderItems.length > 0 && (
              <div className='border rounded-md overflow-hidden'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Product Discount</TableHead>
                      <TableHead>Item Total</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orderItems.map((item, index) => (
                      <TableRow key={item.product_id}>
                        <TableCell className='font-medium'>
                          {item.product_name}
                        </TableCell>
                        <TableCell>₹{item.unit_price.toFixed(2)}</TableCell>
                        <TableCell>
                          <div className='flex items-center gap-2'>
                            <Button
                              type='button'
                              variant='outline'
                              size='icon'
                              className='w-7 h-7'
                              onClick={() => updateItemQty(index, -1)}
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
                              onClick={() => updateItemQty(index, 1)}
                            >
                              +
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <NumberInput
                            min='0'
                            value={item.product_discount}
                            onChange={(value) =>
                              updateItemDiscount(index, value)
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
            )}

            {/* Pricing summary */}
            {orderItems.length > 0 && (
              <div className='space-y-2 pt-2'>
                <Separator />
                <div className='flex justify-end'>
                  <div className='space-y-2 w-72'>
                    <div className='flex justify-between text-sm'>
                      <span className='text-muted-foreground'>Subtotal</span>
                      <span className='font-medium'>
                        ₹{subtotal.toFixed(2)}
                      </span>
                    </div>

                    <div className='flex justify-between text-sm'>
                      <span className='text-muted-foreground'>
                        Product Discounts
                      </span>
                      <span className='font-medium text-orange-600'>
                        − ₹{productDiscountTotal.toFixed(2)}
                      </span>
                    </div>

                    <div className='flex justify-between text-sm'>
                      <span className='text-muted-foreground'>
                        Total Amount
                      </span>
                      <span className='font-medium'>
                        ₹{totalAmount.toFixed(2)}
                      </span>
                    </div>

                    <div className='flex items-center justify-between text-sm'>
                      <span className='text-muted-foreground'>
                        Overall Discount
                      </span>
                      <NumberInput
                        min='0'
                        value={overallDiscount}
                        onChange={setOverallDiscount}
                        className='w-28 h-8 text-right'
                      />
                    </div>

                    <Separator />

                    <div className='flex justify-between text-base font-bold'>
                      <span>Final Amount</span>
                      <span>₹{finalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Initial Payment */}
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='text-base'>Initial Payment</CardTitle>
          </CardHeader>
          <CardContent className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label>Amount Paid (₹)</Label>
              <NumberInput
                min='0'
                value={amountPaid}
                onChange={setAmountPaid}
                placeholder='0.00'
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
              <Label>Remarks</Label>
              <Input
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder='e.g. Advance received'
              />
            </div>

            <div className='space-y-2'>
              <Label>Pending Balance (₹)</Label>
              <Input
                value={`₹${pendingBalance.toFixed(2)}`}
                readOnly
                className={`bg-muted cursor-not-allowed font-semibold ${
                  pendingBalance > 0 ? "text-destructive" : "text-green-600"
                }`}
              />
            </div>
          </CardContent>
        </Card>

        {/* Delivery Schedule */}
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='text-base'>Delivery Schedule</CardTitle>
          </CardHeader>
          <CardContent className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label>
                Delivery Date <span className='text-destructive'>*</span>
              </Label>
              <DatePicker
                placeholder='Select delivery date'
                date={deliveryDate}
                setDate={setDeliveryDate}
              />
            </div>

            <div className='space-y-2'>
              <Label>
                Delivery Time <span className='text-destructive'>*</span>
              </Label>
              <Input
                type='time'
                value={deliveryTime}
                onChange={(e) => setDeliveryTime(e.target.value)}
                className='w-full'
              />
            </div>

            <div className='space-y-2 sm:col-span-2'>
              <Label>Additional Notes</Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder='Any special instructions...'
              />
            </div>
          </CardContent>
        </Card>

        {error && (
          <p className='text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md'>
            {error}
          </p>
        )}

        <div className='flex gap-3'>
          <Button
            type='submit'
            disabled={loading || orderItems.length === 0}
            className='gap-2'
          >
            <ShoppingCart className='w-4 h-4' />
            {loading ? "Creating..." : "Create Pre-Booking"}
          </Button>
          <Button
            type='button'
            variant='outline'
            onClick={() => navigate("/dashboard/prebooking/orders")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};
