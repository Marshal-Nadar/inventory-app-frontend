import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
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
import {
  Filter,
  BarChart2,
  Phone,
  ShoppingCart,
  Package,
  IndianRupee,
  CalendarDays,
} from "lucide-react";
import { purchaseService, type VendorReport } from "@/services/purchaseService";
import { vendorService, type Vendor } from "@/services/vendorService";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const VendorReportPage = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [vendorId, setVendorId] = useState("");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  const [report, setReport] = useState<VendorReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    vendorService.getAll().then(setVendors);
  }, []);

  const handleFilter = async () => {
    if (!vendorId) {
      toast.error("Please select a vendor");
      return;
    }
    if (!dateFrom || !dateTo) {
      toast.error("Please select both dates");
      return;
    }
    if (dateFrom > dateTo) {
      toast.error("From date cannot be after To date");
      return;
    }

    setLoading(true);
    try {
      const data = await purchaseService.getVendorReport(
        vendorId,
        format(dateFrom, "yyyy-MM-dd"),
        format(dateTo, "yyyy-MM-dd"),
      );
      setReport(data);
      setSearched(true);
      if (!data.summary) {
        toast.info("No purchases found for this vendor in the selected range");
      }
    } catch {
      toast.error("Failed to generate vendor report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div>
        <h2 className='text-xl font-bold text-foreground'>Vendor Report</h2>
        <p className='text-sm text-muted-foreground mt-1'>
          View purchase history and material breakdown by vendor.
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className='pt-4'>
          <div className='flex flex-wrap gap-4 items-end'>
            <div className='space-y-2 w-56'>
              <Label>
                Vendor <span className='text-destructive'>*</span>
              </Label>
              <Combobox
                options={vendors.map((v) => ({
                  value: String(v.id),
                  label: v.name,
                }))}
                value={vendorId}
                onChange={setVendorId}
                placeholder='Select vendor'
                searchPlaceholder='Search vendors...'
                emptyText='No vendors found.'
              />
            </div>

            <div className='space-y-2'>
              <Label>From Date</Label>
              <DatePicker
                date={dateFrom}
                setDate={setDateFrom}
                placeholder='Start date'
              />
            </div>

            <div className='space-y-2'>
              <Label>To Date</Label>
              <DatePicker
                date={dateTo}
                setDate={setDateTo}
                placeholder='End date'
              />
            </div>

            <Button onClick={handleFilter} disabled={loading} className='gap-2'>
              <Filter className='w-4 h-4' />
              {loading ? "Loading..." : "Filter"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {searched && (
        <div className='space-y-6'>
          {!report?.summary ? (
            <div className='text-center py-16 text-muted-foreground'>
              <BarChart2 className='w-10 h-10 opacity-30 mx-auto mb-3' />
              <p className='text-sm'>
                No purchases found for this vendor in the selected date range.
              </p>
            </div>
          ) : (
            <>
              {/* Vendor Summary */}
              <Card>
                <CardHeader className='pb-3'>
                  <CardTitle className='text-base'>Vendor Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
                    <div className='flex items-center gap-3'>
                      <div className='p-2 rounded-lg bg-primary/10'>
                        <ShoppingCart className='w-4 h-4 text-primary' />
                      </div>
                      <div>
                        <p className='text-xs text-muted-foreground'>Vendor</p>
                        <p className='text-sm font-semibold text-foreground'>
                          {report.summary.vendor_name}
                        </p>
                        {report.summary.vendor_phone && (
                          <div className='flex items-center gap-1 mt-0.5'>
                            <Phone className='w-3 h-3 text-muted-foreground' />
                            <span className='text-xs text-muted-foreground font-mono'>
                              {report.summary.vendor_phone}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className='flex items-center gap-3'>
                      <div className='p-2 rounded-lg bg-green-500/10'>
                        <IndianRupee className='w-4 h-4 text-green-600' />
                      </div>
                      <div>
                        <p className='text-xs text-muted-foreground'>
                          Total Spend
                        </p>
                        <p className='text-sm font-semibold text-foreground'>
                          ₹{Number(report.summary.total_spend).toFixed(2)}
                        </p>
                        <p className='text-xs text-muted-foreground'>
                          {report.summary.total_purchases} purchases
                        </p>
                      </div>
                    </div>

                    <div className='flex items-center gap-3'>
                      <div className='p-2 rounded-lg bg-blue-500/10'>
                        <CalendarDays className='w-4 h-4 text-blue-600' />
                      </div>
                      <div>
                        <p className='text-xs text-muted-foreground'>
                          First Purchase
                        </p>
                        <p className='text-sm font-semibold text-foreground'>
                          {format(
                            new Date(
                              `${String(report.summary.first_purchase).split("T")[0]}T00:00:00`,
                            ),
                            "dd MMM yyyy",
                          )}
                        </p>
                      </div>
                    </div>

                    <div className='flex items-center gap-3'>
                      <div className='p-2 rounded-lg bg-orange-500/10'>
                        <CalendarDays className='w-4 h-4 text-orange-600' />
                      </div>
                      <div>
                        <p className='text-xs text-muted-foreground'>
                          Last Purchase
                        </p>
                        <p className='text-sm font-semibold text-foreground'>
                          {format(
                            new Date(
                              `${String(report.summary.last_purchase).split("T")[0]}T00:00:00`,
                            ),
                            "dd MMM yyyy",
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Two column layout */}
              <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                {/* Purchase History */}
                <Card>
                  <CardHeader className='pb-3'>
                    <CardTitle className='text-base flex items-center gap-2'>
                      <ShoppingCart className='w-4 h-4' />
                      Purchase History
                      <Badge variant='secondary' className='ml-auto'>
                        {report.purchases.length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='p-0'>
                    {report.purchases.length === 0 ? (
                      <p className='text-center text-muted-foreground py-6 text-sm'>
                        No purchases
                      </p>
                    ) : (
                      <Accordion type='multiple' className='w-full divide-y'>
                        {report.purchases.map((p) => (
                          <AccordionItem
                            key={p.id}
                            value={String(p.id)}
                            className='border-b last:border-b-0'
                          >
                            {/* Header — distinct bg */}
                            <AccordionTrigger className='px-4 py-3 hover:no-underline bg-muted/60 hover:bg-muted data-[state=open]:bg-primary/8 data-[state=open]:border-b transition-colors'>
                              <div className='flex items-center justify-between w-full pr-2'>
                                <div className='flex items-center gap-3'>
                                  <span className='text-xs font-mono bg-background px-2 py-1 rounded border font-semibold'>
                                    {p.invoice_number}
                                  </span>
                                  <span className='text-xs text-muted-foreground'>
                                    {format(
                                      new Date(`${p.purchase_date}T00:00:00`),
                                      "dd MMM yyyy",
                                    )}
                                  </span>
                                  <Badge variant='outline' className='text-xs'>
                                    {p.items?.length || 0} items
                                  </Badge>
                                </div>
                                <span className='text-sm font-bold text-foreground'>
                                  ₹{Number(p.total_cost).toFixed(2)}
                                </span>
                              </div>
                            </AccordionTrigger>

                            {/* Content — white/card bg so it pops against muted header */}
                            <AccordionContent className='px-0 pb-0 bg-background'>
                              <Table>
                                <TableHeader>
                                  <TableRow className='bg-muted/30'>
                                    <TableHead className='text-xs pl-4'>
                                      Material
                                    </TableHead>
                                    <TableHead className='text-xs'>
                                      Qty
                                    </TableHead>
                                    <TableHead className='text-xs'>
                                      Rate
                                    </TableHead>
                                    <TableHead className='text-right text-xs pr-4'>
                                      Amount
                                    </TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {p.items?.map((item, i) => (
                                    <TableRow
                                      key={i}
                                      className='hover:bg-muted/20 border-b last:border-b-0'
                                    >
                                      <TableCell className='pl-4'>
                                        <p className='text-sm font-medium text-foreground'>
                                          {item.raw_material_name}
                                        </p>
                                        <p className='text-xs text-muted-foreground'>
                                          {item.category}
                                        </p>
                                      </TableCell>
                                      <TableCell className='text-sm text-foreground'>
                                        {Number(item.quantity).toFixed(3)}{" "}
                                        {item.metric}
                                      </TableCell>
                                      <TableCell className='text-sm text-muted-foreground'>
                                        ₹
                                        {Number(item.price_per_unit).toFixed(2)}
                                      </TableCell>
                                      <TableCell className='text-right text-sm font-semibold text-foreground pr-4'>
                                        ₹{Number(item.total_cost).toFixed(2)}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>

                              {/* Invoice subtotal row */}
                              <div className='flex justify-end px-4 py-2.5 bg-muted/20 border-t'>
                                <span className='text-xs text-muted-foreground mr-3'>
                                  Invoice Total
                                </span>
                                <span className='text-sm font-bold text-foreground'>
                                  ₹{Number(p.total_cost).toFixed(2)}
                                </span>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    )}
                  </CardContent>
                </Card>

                {/* Materials Purchased */}
                <Card>
                  <CardHeader className='pb-3'>
                    <CardTitle className='text-base flex items-center gap-2'>
                      <Package className='w-4 h-4' />
                      Materials Purchased
                      <Badge variant='secondary' className='ml-auto'>
                        {report.materials.length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='p-0'>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Material</TableHead>
                          <TableHead>Total Qty</TableHead>
                          <TableHead className='text-right'>
                            Total Cost
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {report.materials.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={3}
                              className='text-center text-muted-foreground py-6 text-sm'
                            >
                              No materials
                            </TableCell>
                          </TableRow>
                        ) : (
                          report.materials.map((m, i) => (
                            <TableRow key={i}>
                              <TableCell>
                                <p className='text-sm font-medium text-foreground'>
                                  {m.raw_material_name}
                                </p>
                                <p className='text-xs text-muted-foreground'>
                                  {m.category}
                                </p>
                              </TableCell>
                              <TableCell className='text-sm text-foreground'>
                                {Number(m.total_quantity).toFixed(3)} {m.metric}
                              </TableCell>
                              <TableCell className='text-right font-semibold text-foreground'>
                                ₹{Number(m.total_cost).toFixed(2)}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>

              {/* Total summary bar */}
              <div className='flex justify-end gap-6 pr-2'>
                <span className='text-sm text-muted-foreground'>
                  Total Purchases:{" "}
                  <span className='font-semibold text-foreground'>
                    {report.summary.total_purchases}
                  </span>
                </span>
                <Separator orientation='vertical' className='h-5' />
                <span className='text-sm text-muted-foreground'>
                  Total Spend:{" "}
                  <span className='font-semibold text-foreground'>
                    ₹{Number(report.summary.total_spend).toFixed(2)}
                  </span>
                </span>
              </div>
            </>
          )}
        </div>
      )}

      {!searched && (
        <div className='text-center py-16 text-muted-foreground'>
          <BarChart2 className='w-10 h-10 opacity-30 mx-auto mb-3' />
          <p className='text-sm'>
            Select a vendor and date range, then click Filter.
          </p>
        </div>
      )}
    </div>
  );
};
