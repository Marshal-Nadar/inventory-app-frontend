import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Combobox } from "@/components/common/Combobox";
import { purchaseService, type VendorReport } from "@/services/purchaseService";
import { type Vendor, vendorService } from "@/services/vendorService";
import { useEffect } from "react";
import { Search, TrendingUp, ShoppingCart, Package } from "lucide-react";
import { toast } from "sonner";
import { DatePicker } from "@/components/ui/date-picker";

export const PurchaseReportPage = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [vendorId, setVendorId] = useState("");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [report, setReport] = useState<VendorReport | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    vendorService.getAll().then(setVendors);
  }, []);

  const handleGenerate = async () => {
    if (!vendorId || !dateFrom || !dateTo) {
      toast.error("Please select vendor, start date and end date");
      return;
    }

    if (dateFrom > dateTo) {
      toast.error("Start date cannot be after end date");
      return;
    }

    setLoading(true);
    try {
      const data = await purchaseService.getVendorReport(
        Number(vendorId),
        dateFrom.toISOString().split("T")[0], // Clean YYYY-MM-DD
        dateTo.toISOString().split("T")[0],
      );
      setReport(data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='space-y-6 max-w-4xl'>
      {/* Page header */}
      <div>
        <h2 className='text-xl font-bold text-foreground'>Purchase Report</h2>
        <p className='text-sm text-muted-foreground mt-1'>
          View purchase history and spend summary for a specific vendor.
        </p>
      </div>

      {/* Filter card */}
      <Card>
        <CardHeader className='pb-3'>
          <CardTitle className='text-base'>Select Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex flex-wrap gap-4 items-end'>
            {/* Vendor */}
            <div className='space-y-2 w-56'>
              <Label>Vendor</Label>
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

            {/* Start date */}
            <div className='space-y-2'>
              <Label>Start Date</Label>
              <DatePicker
                date={dateFrom}
                setDate={setDateFrom}
                placeholder='Start date'
              />
            </div>

            {/* End date */}
            <div className='space-y-2'>
              <Label>End Date</Label>
              <DatePicker
                date={dateTo}
                setDate={setDateTo}
                placeholder='End date'
              />
            </div>

            {/* Generate button */}
            <Button
              onClick={handleGenerate}
              disabled={loading}
              className='gap-2'
            >
              <Search className='w-4 h-4' />
              {loading ? "Generating..." : "Generate Report"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report output */}
      {report && (
        <>
          {report.summary ? (
            <div className='space-y-6'>
              {/* Summary cards */}
              <div className='grid grid-cols-2 sm:grid-cols-3 gap-4'>
                <Card>
                  <CardContent className='pt-4 space-y-1'>
                    <div className='flex items-center gap-2 text-muted-foreground text-xs'>
                      <ShoppingCart className='w-3.5 h-3.5' />
                      Total Purchases
                    </div>
                    <p className='text-2xl font-bold text-foreground'>
                      {report.summary.total_purchases}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className='pt-4 space-y-1'>
                    <div className='flex items-center gap-2 text-muted-foreground text-xs'>
                      <TrendingUp className='w-3.5 h-3.5' />
                      Total Spend
                    </div>
                    <p className='text-2xl font-bold text-foreground'>
                      ₹{Number(report.summary.total_spend).toFixed(2)}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className='pt-4 space-y-1'>
                    <div className='flex items-center gap-2 text-muted-foreground text-xs'>
                      <Package className='w-3.5 h-3.5' />
                      Unique Materials
                    </div>
                    <p className='text-2xl font-bold text-foreground'>
                      {report.materials.length}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Vendor info */}
              <Card>
                <CardHeader className='pb-2'>
                  <CardTitle className='text-base'>Vendor Details</CardTitle>
                </CardHeader>
                <CardContent className='flex flex-wrap gap-6 text-sm'>
                  <div>
                    <p className='text-xs text-muted-foreground'>Name</p>
                    <p className='font-medium text-foreground'>
                      {report.summary.vendor_name}
                    </p>
                  </div>
                  <div>
                    <p className='text-xs text-muted-foreground'>Phone</p>
                    <p className='font-medium text-foreground font-mono'>
                      {report.summary.vendor_phone}
                    </p>
                  </div>
                  <div>
                    <p className='text-xs text-muted-foreground'>
                      First Purchase
                    </p>
                    <p className='font-medium text-foreground'>
                      {new Date(
                        report.summary.first_purchase,
                      ).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div>
                    <p className='text-xs text-muted-foreground'>
                      Last Purchase
                    </p>
                    <p className='font-medium text-foreground'>
                      {new Date(
                        report.summary.last_purchase,
                      ).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Separator />

              {/* Purchases in range */}
              <Card>
                <CardHeader className='pb-3'>
                  <CardTitle className='text-base'>
                    Purchases in Range
                    <span className='text-sm font-normal text-muted-foreground ml-2'>
                      ({report.purchases.length} invoices)
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className='p-0'>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>S.No</TableHead>
                        <TableHead>Invoice No</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Storage Room</TableHead>
                        <TableHead>Total (₹)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.purchases.map((p, index) => (
                        <TableRow key={p.id}>
                          <TableCell className='text-muted-foreground'>
                            {index + 1}
                          </TableCell>
                          <TableCell>
                            <code className='text-xs bg-muted px-2 py-1 rounded'>
                              {p.invoice_number}
                            </code>
                          </TableCell>
                          <TableCell>
                            {new Date(p.purchase_date).toLocaleDateString(
                              "en-IN",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              },
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant='outline'>
                              {p.storage_room_name}
                            </Badge>
                          </TableCell>
                          <TableCell className='font-semibold'>
                            ₹{Number(p.total_cost).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Materials breakdown */}
              <Card>
                <CardHeader className='pb-3'>
                  <CardTitle className='text-base'>
                    Materials Purchased
                    <span className='text-sm font-normal text-muted-foreground ml-2'>
                      (grouped by item)
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className='p-0'>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>S.No</TableHead>
                        <TableHead>Raw Material</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Total Qty</TableHead>
                        <TableHead>Metric</TableHead>
                        <TableHead>Total Cost (₹)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.materials.map((m, index) => (
                        <TableRow key={index}>
                          <TableCell className='text-muted-foreground'>
                            {index + 1}
                          </TableCell>
                          <TableCell className='font-medium text-foreground'>
                            {m.raw_material_name}
                          </TableCell>
                          <TableCell>
                            <Badge variant='outline' className='capitalize'>
                              {m.category}
                            </Badge>
                          </TableCell>
                          <TableCell>{Number(m.total_quantity)}</TableCell>
                          <TableCell>
                            <Badge variant='secondary'>{m.metric}</Badge>
                          </TableCell>
                          <TableCell className='font-semibold'>
                            ₹{Number(m.total_cost).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className='py-16 text-center'>
                <p className='text-muted-foreground text-sm'>
                  No purchases found for this vendor in the selected date range.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};
