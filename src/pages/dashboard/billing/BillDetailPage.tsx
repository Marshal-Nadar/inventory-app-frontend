import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Printer, CheckCircle2 } from "lucide-react";
import { billingService, type Bill } from "@/services/billingService";
import { toast } from "sonner";
import { format } from "date-fns";

export const BillDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bill, setBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    billingService
      .getById(Number(id))
      .then(setBill)
      .catch(() => toast.error("Failed to load bill"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className='text-center py-12 text-muted-foreground'>
        Loading bill...
      </div>
    );
  }

  if (!bill) {
    return (
      <div className='text-center py-12 text-muted-foreground'>
        Bill not found.
      </div>
    );
  }

  return (
    <div className='space-y-4 max-w-2xl'>
      <div className='flex items-center gap-4'>
        <Button
          variant='ghost'
          size='icon'
          onClick={() => navigate("/dashboard/billing/all")}
        >
          <ArrowLeft className='w-4 h-4' />
        </Button>
        <div className='flex-1'>
          <h2 className='text-xl font-bold text-foreground'>
            {bill.bill_number}
          </h2>
          <p className='text-sm text-muted-foreground'>
            {format(new Date(bill.created_at), "dd MMM yyyy, hh:mm a")}
          </p>
        </div>
        <Badge className='bg-green-500/10 text-green-600 border-0 gap-1'>
          <CheckCircle2 className='w-3 h-3' />
          Paid
        </Badge>
      </div>

      <Card>
        <CardContent className='pt-4 space-y-4'>
          <div className='flex justify-between text-sm'>
            <span className='text-muted-foreground'>Branch</span>
            <span className='font-medium'>{bill.branch_name}</span>
          </div>
          <div className='flex justify-between text-sm'>
            <span className='text-muted-foreground'>Billed By</span>
            <span className='font-medium'>{bill.billed_by_name}</span>
          </div>
          <div className='flex justify-between text-sm'>
            <span className='text-muted-foreground'>Payment Method</span>
            <Badge variant='outline' className='uppercase text-xs'>
              {bill.payment_method}
            </Badge>
          </div>

          <Separator />

          <div className='space-y-2'>
            {bill.items?.map((item, i) => (
              <div key={i} className='flex justify-between text-sm'>
                <span>
                  {item.product_name}{" "}
                  <span className='text-muted-foreground'>
                    × {item.quantity}
                  </span>
                </span>
                <span className='font-medium'>
                  ₹{Number(item.item_total).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <Separator />

          <div className='space-y-1.5'>
            <div className='flex justify-between text-sm'>
              <span className='text-muted-foreground'>Subtotal</span>
              <span>₹{Number(bill.subtotal).toFixed(2)}</span>
            </div>
            <div className='flex justify-between text-sm'>
              <span className='text-muted-foreground'>
                GST ({bill.gst_percent}%)
              </span>
              <span>₹{Number(bill.gst_amount).toFixed(2)}</span>
            </div>
            <Separator />
            <div className='flex justify-between font-bold text-base'>
              <span>Total</span>
              <span>₹{Number(bill.total_amount).toFixed(2)}</span>
            </div>
          </div>

          <Button variant='outline' className='w-full gap-2'>
            <Printer className='w-4 h-4' />
            Print Receipt
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
