import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  FileText,
  Truck,
} from "lucide-react";
import { purchaseService, type Purchase } from "@/services/purchaseService";

export const PurchaseDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    purchaseService
      .getById(Number(id))
      .then(setPurchase)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className='text-center py-12 text-muted-foreground'>
        Loading purchase...
      </div>
    );
  }

  if (!purchase) {
    return (
      <div className='text-center py-12 text-muted-foreground'>
        Purchase not found.
      </div>
    );
  }

  return (
    <div className='space-y-6 max-w-4xl'>
      {/* Header */}
      <div className='flex items-center gap-4'>
        <Button
          variant='ghost'
          size='icon'
          onClick={() => navigate("/dashboard/purchases")}
        >
          <ArrowLeft className='w-4 h-4' />
        </Button>
        <div>
          <h2 className='text-xl font-bold text-foreground'>
            Purchase Details
          </h2>
          <p className='text-sm text-muted-foreground'>
            Invoice: {purchase.invoice_number}
          </p>
        </div>
      </div>

      {/* Purchase info */}
      <Card>
        <CardHeader className='pb-3'>
          <CardTitle className='text-base'>Purchase Information</CardTitle>
        </CardHeader>
        <CardContent className='grid grid-cols-2 sm:grid-cols-4 gap-4'>
          <div className='space-y-1'>
            <div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
              <CalendarDays className='w-3.5 h-3.5' />
              Date
            </div>
            <p className='text-sm font-medium text-foreground'>
              {new Date(purchase.purchase_date).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>

          <div className='space-y-1'>
            <div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
              <Truck className='w-3.5 h-3.5' />
              Vendor
            </div>
            <p className='text-sm font-medium text-foreground'>
              {purchase.vendor_name}
            </p>
          </div>

          <div className='space-y-1'>
            <div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
              <FileText className='w-3.5 h-3.5' />
              Invoice No
            </div>
            <code className='text-xs bg-muted px-2 py-1 rounded'>
              {purchase.invoice_number}
            </code>
          </div>

          <div className='space-y-1'>
            <div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
              <Building2 className='w-3.5 h-3.5' />
              Storage Room
            </div>
            <Badge variant='outline'>{purchase.storage_room_name}</Badge>
          </div>

          {purchase.notes && (
            <div className='space-y-1 col-span-2 sm:col-span-4'>
              <p className='text-xs text-muted-foreground'>Notes</p>
              <p className='text-sm text-foreground'>{purchase.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Line items */}
      <Card>
        <CardHeader className='pb-3'>
          <CardTitle className='text-base'>Items Purchased</CardTitle>
        </CardHeader>
        <CardContent className='space-y-3'>
          {/* Header row */}
          <div className='grid grid-cols-[32px_2fr_1fr_1fr_1fr_1fr] gap-3 px-2'>
            <span className='text-xs text-muted-foreground'>#</span>
            <span className='text-xs text-muted-foreground'>Raw Material</span>
            <span className='text-xs text-muted-foreground'>Quantity</span>
            <span className='text-xs text-muted-foreground'>Metric</span>
            <span className='text-xs text-muted-foreground'>Price/Unit</span>
            <span className='text-xs text-muted-foreground text-right'>
              Total
            </span>
          </div>

          <Separator />

          {/* Items */}
          {purchase.items?.map((item, index) => (
            <div
              key={item.id}
              className='grid grid-cols-[32px_2fr_1fr_1fr_1fr_1fr] gap-3 px-2 items-center'
            >
              <span className='text-xs text-muted-foreground'>{index + 1}</span>
              <div>
                <p className='text-sm font-medium text-foreground'>
                  {item.raw_material_name}
                </p>
                <p className='text-xs text-muted-foreground capitalize'>
                  {item.raw_material_category}
                </p>
              </div>
              <span className='text-sm'>{item.quantity}</span>
              <Badge variant='secondary' className='w-fit'>
                {item.metric}
              </Badge>
              <span className='text-sm'>
                ₹{Number(item.price_per_unit).toFixed(2)}
              </span>
              <span className='text-sm font-semibold text-right'>
                ₹{Number(item.total_cost).toFixed(2)}
              </span>
            </div>
          ))}

          <Separator />

          {/* Overall total */}
          <div className='flex items-center justify-end gap-4 px-2'>
            <span className='text-sm font-semibold text-foreground'>
              Overall Total
            </span>
            <span className='text-lg font-bold text-foreground'>
              ₹{Number(purchase.total_cost).toFixed(2)}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
