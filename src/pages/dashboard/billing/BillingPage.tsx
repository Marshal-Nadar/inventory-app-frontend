import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  Receipt,
  CreditCard,
  Wallet,
  Smartphone,
  Globe,
} from "lucide-react";
import {
  billingService,
  type BillingProduct,
  type BillItem,
} from "@/services/billingService";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash", icon: Wallet },
  { value: "card", label: "Card", icon: CreditCard },
  { value: "upi", label: "UPI", icon: Smartphone },
  { value: "online", label: "Online", icon: Globe },
];

const GST_PERCENT = 5;

export const BillingPage = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<BillingProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<BillItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    billingService
      .getProducts()
      .then(setProducts)
      .catch(() => toast.error("Failed to load products"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return products;
    return products.filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase()),
    );
  }, [products, search]);

  const addToCart = (product: BillingProduct) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product_id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product_id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                item_total: (item.quantity + 1) * item.unit_price,
              }
            : item,
        );
      }
      return [
        ...prev,
        {
          product_id: product.id,
          product_name: product.name,
          unit_price: Number(product.price),
          quantity: 1,
          item_total: Number(product.price),
        },
      ];
    });
  };

  const updateQty = (productId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product_id !== productId) return item;
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          return {
            ...item,
            quantity: newQty,
            item_total: newQty * item.unit_price,
          };
        })
        .filter((item): item is BillItem => item !== null),
    );
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.product_id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setPaymentMethod("");
  };

  // ─── Computed ─────────────────────────────────────────────────

  const subtotal = cart.reduce((sum, item) => sum + item.item_total, 0);
  const gstAmount = (subtotal * GST_PERCENT) / 100;
  const totalAmount = subtotal + gstAmount;

  // ─── Submit ───────────────────────────────────────────────────

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    if (!paymentMethod) {
      toast.error("Please select a payment method");
      return;
    }

    setSubmitting(true);
    try {
      const bill = await billingService.create({
        items: cart,
        payment_method: paymentMethod,
      });
      toast.success(`Bill ${bill.bill_number} created successfully`);
      clearCart();
      navigate(`/dashboard/billing/${bill.id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create bill");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 h-full'>
      {/* Left — Products */}
      <div className='lg:col-span-2 space-y-4'>
        <div>
          <h2 className='text-xl font-bold text-foreground'>Billing</h2>
          <p className='text-sm text-muted-foreground mt-1'>
            Select products to create a bill.
          </p>
        </div>

        <div className='relative w-full sm:max-w-sm'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground' />
          <Input
            placeholder='Search products...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='pl-9'
          />
        </div>

        {loading ? (
          <p className='text-sm text-muted-foreground py-8 text-center'>
            Loading products...
          </p>
        ) : filtered.length === 0 ? (
          <div className='text-center py-12 text-muted-foreground'>
            <ShoppingCart className='w-10 h-10 opacity-30 mx-auto mb-3' />
            <p className='text-sm'>No products found.</p>
          </div>
        ) : (
          <div className='grid grid-cols-2 sm:grid-cols-3 gap-3'>
            {filtered.map((product) => {
              const inCart = cart.find(
                (item) => item.product_id === product.id,
              );
              return (
                <Card
                  key={product.id}
                  className={cn(
                    "cursor-pointer hover:shadow-md transition-all hover:border-primary/40",
                    inCart && "border-primary bg-primary/5",
                  )}
                  onClick={() => addToCart(product)}
                >
                  <CardContent className='pt-4 pb-3 space-y-2'>
                    <p className='text-sm font-medium text-foreground line-clamp-2'>
                      {product.name}
                    </p>
                    <div className='flex items-center justify-between'>
                      <span className='text-sm font-bold text-foreground'>
                        ₹{Number(product.price).toFixed(2)}
                      </span>
                      {inCart && (
                        <Badge className='text-xs'>{inCart.quantity}</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Right — Cart */}
      <div className='space-y-4'>
        <Card className='sticky top-4'>
          <CardContent className='pt-4 space-y-4'>
            <div className='flex items-center justify-between'>
              <h3 className='text-base font-semibold flex items-center gap-2'>
                <ShoppingCart className='w-4 h-4' />
                Cart
              </h3>
              {cart.length > 0 && (
                <Button
                  variant='ghost'
                  size='sm'
                  className='h-7 text-xs text-destructive'
                  onClick={clearCart}
                >
                  Clear
                </Button>
              )}
            </div>

            {cart.length === 0 ? (
              <div className='text-center py-8 text-muted-foreground'>
                <Receipt className='w-8 h-8 opacity-30 mx-auto mb-2' />
                <p className='text-sm'>Cart is empty</p>
                <p className='text-xs'>Click a product to add it</p>
              </div>
            ) : (
              <>
                <div className='space-y-3 max-h-80 overflow-y-auto'>
                  {cart.map((item) => (
                    <div
                      key={item.product_id}
                      className='flex items-center gap-2'
                    >
                      <div className='flex-1 min-w-0'>
                        <p className='text-sm font-medium text-foreground truncate'>
                          {item.product_name}
                        </p>
                        <p className='text-xs text-muted-foreground'>
                          ₹{item.unit_price.toFixed(2)} each
                        </p>
                      </div>

                      <div className='flex items-center gap-1'>
                        <Button
                          variant='outline'
                          size='icon'
                          className='w-6 h-6'
                          onClick={() => updateQty(item.product_id, -1)}
                        >
                          <Minus className='w-3 h-3' />
                        </Button>
                        <span className='w-6 text-center text-sm font-medium'>
                          {item.quantity}
                        </span>
                        <Button
                          variant='outline'
                          size='icon'
                          className='w-6 h-6'
                          onClick={() => updateQty(item.product_id, 1)}
                        >
                          <Plus className='w-3 h-3' />
                        </Button>
                      </div>

                      <span className='text-sm font-semibold w-16 text-right'>
                        ₹{item.item_total.toFixed(2)}
                      </span>

                      <Button
                        variant='ghost'
                        size='icon'
                        className='w-6 h-6 text-destructive'
                        onClick={() => removeFromCart(item.product_id)}
                      >
                        <Trash2 className='w-3.5 h-3.5' />
                      </Button>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Totals */}
                <div className='space-y-1.5'>
                  <div className='flex justify-between text-sm'>
                    <span className='text-muted-foreground'>Subtotal</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className='flex justify-between text-sm'>
                    <span className='text-muted-foreground'>
                      GST ({GST_PERCENT}%)
                    </span>
                    <span>₹{gstAmount.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className='flex justify-between font-bold text-base'>
                    <span>Total</span>
                    <span>₹{totalAmount.toFixed(2)}</span>
                  </div>
                </div>

                <Separator />

                {/* Payment method */}
                <div className='space-y-2'>
                  <p className='text-xs font-medium text-muted-foreground'>
                    Payment Method
                  </p>
                  <div className='grid grid-cols-2 gap-2'>
                    {PAYMENT_METHODS.map((method) => (
                      <button
                        key={method.value}
                        onClick={() => setPaymentMethod(method.value)}
                        className={cn(
                          "flex items-center gap-2 p-2.5 rounded-lg border text-sm font-medium transition-colors",
                          paymentMethod === method.value
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:bg-accent",
                        )}
                      >
                        <method.icon className='w-4 h-4' />
                        {method.label}
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  className='w-full gap-2'
                  size='lg'
                  onClick={handleCheckout}
                  disabled={submitting || !paymentMethod}
                >
                  <Receipt className='w-4 h-4' />
                  {submitting
                    ? "Processing..."
                    : `Checkout ₹${totalAmount.toFixed(2)}`}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
