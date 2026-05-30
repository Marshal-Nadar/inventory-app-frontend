import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Combobox } from "@/components/common/Combobox";
import { DatePicker } from "@/components/ui/date-picker";
import {
  dailySalesService,
  type DailySales,
} from "@/services/dailySalesService";
import { branchService, type Branch } from "@/services/branchService";
import { useAppSelector } from "@/hooks/useAppSelector";
import { toast } from "sonner";
import { format } from "date-fns";
import { Save, RefreshCw, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate, useSearchParams } from "react-router-dom";

export const AddSalesPage = () => {
  const user = useAppSelector((state) => state.auth.user);
  const isAdmin = user?.role === "admin" || user?.is_super_admin;
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();
  const paramBranchId = searchParams.get("branch_id");
  const paramDate = searchParams.get("date");

  const today = new Date().toLocaleDateString("en-CA");

  // filters
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchId, setBranchId] = useState(
    paramBranchId || String(user?.branch_id || ""),
  );
  const [saleDate, setSaleDate] = useState<Date | undefined>(
    paramDate ? new Date(`${paramDate}T00:00:00`) : new Date(),
  );

  // auto values
  const [outdoorCatering, setOutdoorCatering] = useState("0");
  const [miscExpense, setMiscExpense] = useState("0");
  const [autoLoading, setAutoLoading] = useState(false);

  // manual inputs
  const [petpoojaTotal, setPetpoojaTotal] = useState("0");
  const [nsTotal, setNsTotal] = useState("0");
  const [upi, setUpi] = useState("0");
  const [cash, setCash] = useState("0");
  const [swiggy, setSwiggy] = useState("0");
  const [zomato, setZomato] = useState("0");

  // existing record
  const [existingRecord, setExistingRecord] = useState<DailySales | null>(null);
  const [loading, setLoading] = useState(false);

  // ─── Computed ─────────────────────────────────────────────────

  const netSales =
    (parseFloat(petpoojaTotal) || 0) +
    (parseFloat(nsTotal) || 0) +
    (parseFloat(outdoorCatering) || 0);

  const netCounter =
    (parseFloat(upi) || 0) +
    (parseFloat(cash) || 0) +
    (parseFloat(miscExpense) || 0) +
    (parseFloat(swiggy) || 0) +
    (parseFloat(zomato) || 0);

  const difference = netCounter - netSales;

  // ─── Fetch auto values ────────────────────────────────────────

  const fetchAutoValues = useCallback(async (bid: string, date: string) => {
    if (!bid || !date) return;
    setAutoLoading(true);
    try {
      const data = await dailySalesService.getAutoValues(bid, date);
      setOutdoorCatering(String(data.outdoor_catering));
      setMiscExpense(String(data.misc_expense));
    } catch {
      toast.error("Failed to fetch auto values");
    } finally {
      setAutoLoading(false);
    }
  }, []);

  const fetchExistingRecord = useCallback(
    async (bid: string, date: string) => {
      if (!bid || !date) return;
      try {
        const data = await dailySalesService.getByBranchAndDate(bid, date);
        if (data) {
          setExistingRecord(data);
          setPetpoojaTotal(String(data.petpooja_total));
          setNsTotal(String(data.ns_total));
          setUpi(String(data.upi));
          setCash(String(data.cash));
          setSwiggy(String(data.swiggy));
          setZomato(String(data.zomato));
          setOutdoorCatering(String(data.outdoor_catering));
          setMiscExpense(String(data.misc_expense));
        } else {
          setExistingRecord(null);
          setPetpoojaTotal("0");
          setNsTotal("0");
          setUpi("0");
          setCash("0");
          setSwiggy("0");
          setZomato("0");
          // fetch fresh auto values
          fetchAutoValues(bid, date);
        }
      } catch {
        console.error("Failed to fetch existing record");
      }
    },
    [fetchAutoValues],
  );

  useEffect(() => {
    if (isAdmin) {
      branchService
        .getAll()
        .then((data) => setBranches(data.filter((b) => b.is_active)));
    }
  }, []);

  useEffect(() => {
    const formattedDate = saleDate ? format(saleDate, "yyyy-MM-dd") : today;
    if (branchId) {
      fetchExistingRecord(branchId, formattedDate);
    }
  }, [branchId, saleDate]);

  // ─── Submit ───────────────────────────────────────────────────

  const isEditable =
    isAdmin || (saleDate ? format(saleDate, "yyyy-MM-dd") === today : false);

  const handleSubmit = async () => {
    if (!branchId) {
      toast.error("Please select a branch");
      return;
    }
    if (!saleDate) {
      toast.error("Please select a date");
      return;
    }

    const formattedDate = format(saleDate, "yyyy-MM-dd");

    setLoading(true);
    try {
      await dailySalesService.upsert({
        branch_id: isAdmin ? Number(branchId) : undefined,
        sale_date: formattedDate,
        petpooja_total: parseFloat(petpoojaTotal) || 0,
        ns_total: parseFloat(nsTotal) || 0,
        outdoor_catering: parseFloat(outdoorCatering) || 0,
        upi: parseFloat(upi) || 0,
        cash: parseFloat(cash) || 0,
        misc_expense: parseFloat(miscExpense) || 0,
        swiggy: parseFloat(swiggy) || 0,
        zomato: parseFloat(zomato) || 0,
        net_sales: netSales,
        net_counter: netCounter,
        difference,
      });
      toast.success(
        existingRecord
          ? "Sales report updated successfully"
          : "Sales report submitted successfully",
      );
      navigate("/dashboard/sales/report");
      // refetch to update existing record state
      fetchExistingRecord(branchId, formattedDate);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to submit sales");
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
    <div className='space-y-6 max-w-3xl'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-xl font-bold text-foreground'>
            Daily Sales Entry
          </h2>
          <p className='text-sm text-muted-foreground mt-1'>
            {existingRecord ? (
              <Badge
                variant='outline'
                className='text-blue-600 border-blue-200'
              >
                Editing existing record
              </Badge>
            ) : (
              <Badge
                variant='outline'
                className='text-green-600 border-green-200'
              >
                New entry
              </Badge>
            )}
          </p>
        </div>
      </div>

      {/* Date + Branch */}
      <Card>
        <CardContent className='pt-4'>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label>Date</Label>
              {isAdmin ? (
                <DatePicker
                  date={saleDate}
                  setDate={setSaleDate}
                  placeholder='Select date'
                />
              ) : (
                <Input
                  value={format(new Date(), "dd MMM yyyy")}
                  readOnly
                  className='bg-muted text-muted-foreground cursor-not-allowed'
                />
              )}
            </div>

            <div className='space-y-2'>
              <Label>Branch</Label>
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
          </div>
        </CardContent>
      </Card>

      {/* Income Section */}
      <Card>
        <CardHeader className='pb-3'>
          <CardTitle className='text-base'>Income Section</CardTitle>
        </CardHeader>
        <CardContent className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
          <div className='space-y-2'>
            <Label>PetPooja Total</Label>
            <Input
              type='number'
              min='0'
              step='0.01'
              value={petpoojaTotal}
              onChange={(e) => setPetpoojaTotal(e.target.value)}
              placeholder='0.00'
            />
          </div>

          <div className='space-y-2'>
            <Label>NS Total</Label>
            <Input
              type='number'
              min='0'
              step='0.01'
              value={nsTotal}
              onChange={(e) => setNsTotal(e.target.value)}
              placeholder='0.00'
            />
          </div>

          <div className='space-y-2'>
            <Label className='text-sm font-medium leading-tight'>
              Outdoor Catering
              <span className='block text-xs text-muted-foreground font-normal'>
                (Pre-Booking Paid Today)
              </span>
              {autoLoading && (
                <RefreshCw className='w-3 h-3 animate-spin text-muted-foreground' />
              )}
            </Label>
            <Input
              value={outdoorCatering}
              readOnly
              className='bg-muted text-muted-foreground cursor-not-allowed font-medium'
            />
          </div>
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card>
        <CardHeader className='pb-3'>
          <CardTitle className='text-base'>Payment Methods</CardTitle>
        </CardHeader>
        <CardContent className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
          <div className='space-y-2'>
            <Label>UPI</Label>
            <Input
              type='number'
              min='0'
              step='0.01'
              value={upi}
              onChange={(e) => setUpi(e.target.value)}
              placeholder='0.00'
            />
          </div>

          <div className='space-y-2'>
            <Label>Cash</Label>
            <Input
              type='number'
              min='0'
              step='0.01'
              value={cash}
              onChange={(e) => setCash(e.target.value)}
              placeholder='0.00'
            />
          </div>

          <div className='space-y-2'>
            <Label className='text-sm font-medium leading-tight'>
              Misc Expense
              {autoLoading && (
                <RefreshCw className='w-3 h-3 animate-spin text-muted-foreground' />
              )}
            </Label>
            <Input
              value={miscExpense}
              readOnly
              className='bg-muted text-muted-foreground cursor-not-allowed font-medium'
            />
          </div>
        </CardContent>
      </Card>

      {/* Online Platforms */}
      <Card>
        <CardHeader className='pb-3'>
          <CardTitle className='text-base'>Online Platforms</CardTitle>
        </CardHeader>
        <CardContent className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
          <div className='space-y-2'>
            <Label>Swiggy</Label>
            <Input
              type='number'
              min='0'
              step='0.01'
              value={swiggy}
              onChange={(e) => setSwiggy(e.target.value)}
              placeholder='0.00'
            />
          </div>

          <div className='space-y-2'>
            <Label>Zomato</Label>
            <Input
              type='number'
              min='0'
              step='0.01'
              value={zomato}
              onChange={(e) => setZomato(e.target.value)}
              placeholder='0.00'
            />
          </div>
        </CardContent>
      </Card>

      {/* Live Calculation Summary */}
      <Card>
        <CardHeader className='pb-3'>
          <CardTitle className='text-base'>Live Calculation Summary</CardTitle>
        </CardHeader>
        <CardContent className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
          <div className='space-y-2'>
            <Label className='text-xs text-muted-foreground leading-tight'>
              Net Sales
              <span className='block'>PetPooja + NS + Outdoor</span>
            </Label>
            <Input
              value={netSales.toFixed(2)}
              readOnly
              className='bg-muted cursor-not-allowed font-semibold text-foreground'
            />
          </div>

          <div className='space-y-2'>
            <Label className='text-xs text-muted-foreground leading-tight'>
              Net Counter
              <span className='block'>UPI + Cash + Misc + Swiggy + Zomato</span>
            </Label>
            <Input
              value={netCounter.toFixed(2)}
              readOnly
              className='bg-muted cursor-not-allowed font-semibold text-foreground'
            />
          </div>

          <div className='space-y-2'>
            <Label className='text-xs text-muted-foreground leading-tight'>
              Difference
              <span className='block'>Counter − Sales</span>
            </Label>
            <Input
              value={difference.toFixed(2)}
              readOnly
              className={cn(
                "cursor-not-allowed font-bold",
                difference === 0
                  ? "bg-green-50 text-green-600"
                  : difference > 0
                    ? "bg-orange-50 text-orange-600"
                    : "bg-red-50 text-destructive",
              )}
            />
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className='flex gap-3 pb-8'>
        <Button
          onClick={handleSubmit}
          disabled={loading || !branchId || !isEditable}
          className='gap-2'
        >
          <Save className='w-4 h-4' />
          {!isEditable
            ? "View Only"
            : loading
              ? "Saving..."
              : existingRecord
                ? "Update Sales"
                : "Submit Sales"}
        </Button>
      </div>
    </div>
  );
};
