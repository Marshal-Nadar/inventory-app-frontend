import { format } from "date-fns";
import { type PreBooking } from "@/services/preBookingService";
import { type DailySales } from "@/services/dailySalesService";
import { type MiscExpense } from "@/services/miscExpenseService";
import { type ProductReportRow } from "@/services/preBookingService";
import { type Purchase } from "@/services/purchaseService";

export const preBookingPrintColumns = [
  { header: "#", accessor: (_: PreBooking, i?: number) => (i ?? 0) + 1 },
  { header: "Order ID", accessor: (r: PreBooking) => r.order_id },
  { header: "Customer", accessor: (r: PreBooking) => r.customer_name },
  { header: "Mobile", accessor: (r: PreBooking) => r.mobile },
  { header: "Branch", accessor: (r: PreBooking) => r.branch_name || "" },
  {
    header: "Delivery Date",
    accessor: (r: PreBooking) =>
      format(
        new Date(`${r.delivery_date.split("T")[0]}T00:00:00`),
        "dd MMM yyyy",
      ),
  },
  {
    header: "Final Amount",
    accessor: (r: PreBooking) => `₹${Number(r.final_amount).toFixed(2)}`,
    align: "right" as const,
  },
  {
    header: "Paid",
    accessor: (r: PreBooking) => `₹${Number(r.amount_paid).toFixed(2)}`,
    align: "right" as const,
  },
  {
    header: "Pending",
    accessor: (r: PreBooking) => `₹${Number(r.pending_balance).toFixed(2)}`,
    align: "right" as const,
  },
  { header: "Payment", accessor: (r: PreBooking) => r.payment_status },
  { header: "Status", accessor: (r: PreBooking) => r.order_status },
];

export const salesReportPrintColumns = [
  {
    header: "Date",
    accessor: (r: DailySales) =>
      format(new Date(`${r.sale_date.split("T")[0]}T00:00:00`), "dd MMM yyyy"),
  },
  { header: "Branch", accessor: (r: DailySales) => r.branch_name || "" },
  {
    header: "PetPooja",
    accessor: (r: DailySales) => `₹${Number(r.petpooja_total).toFixed(2)}`,
    align: "right" as const,
  },
  {
    header: "NS Total",
    accessor: (r: DailySales) => `₹${Number(r.ns_total).toFixed(2)}`,
    align: "right" as const,
  },
  {
    header: "Outdoor",
    accessor: (r: DailySales) => `₹${Number(r.outdoor_catering).toFixed(2)}`,
    align: "right" as const,
  },
  {
    header: "UPI",
    accessor: (r: DailySales) => `₹${Number(r.upi).toFixed(2)}`,
    align: "right" as const,
  },
  {
    header: "Cash",
    accessor: (r: DailySales) => `₹${Number(r.cash).toFixed(2)}`,
    align: "right" as const,
  },
  {
    header: "Swiggy",
    accessor: (r: DailySales) => `₹${Number(r.swiggy).toFixed(2)}`,
    align: "right" as const,
  },
  {
    header: "Zomato",
    accessor: (r: DailySales) => `₹${Number(r.zomato).toFixed(2)}`,
    align: "right" as const,
  },
  {
    header: "Net Sales",
    accessor: (r: DailySales) => `₹${Number(r.net_sales).toFixed(2)}`,
    align: "right" as const,
  },
  {
    header: "Net Counter",
    accessor: (r: DailySales) => `₹${Number(r.net_counter).toFixed(2)}`,
    align: "right" as const,
  },
  {
    header: "Difference",
    accessor: (r: DailySales) => {
      const val = Number(r.difference);
      return `${val > 0 ? "+" : ""}${val.toFixed(2)}`;
    },
    align: "right" as const,
  },
];

export const expenseReportPrintColumns = [
  {
    header: "Date",
    accessor: (r: MiscExpense) =>
      format(new Date(r.expense_date), "dd MMM yyyy"),
  },
  { header: "Branch", accessor: (r: MiscExpense) => r.branch_name },
  { header: "Expense Type", accessor: (r: MiscExpense) => r.expense_type_name },
  {
    header: "Subcategory",
    accessor: (r: MiscExpense) => r.subcategory_name || "—",
  },
  {
    header: "Amount",
    accessor: (r: MiscExpense) => `₹${Number(r.amount).toFixed(2)}`,
    align: "right" as const,
  },
  {
    header: "Payment",
    accessor: (r: MiscExpense) =>
      r.payment_method === "cash" ? "Cash" : "UPI",
  },
  {
    header: "Added By",
    accessor: (r: MiscExpense) => r.created_by_name || "—",
  },
  { header: "Notes", accessor: (r: MiscExpense) => r.notes || "—" },
];

export const productReportPrintColumns = [
  { header: "Order #", accessor: (r: ProductReportRow) => r.order_id },
  { header: "Customer", accessor: (r: ProductReportRow) => r.customer_name },
  { header: "Mobile", accessor: (r: ProductReportRow) => r.mobile },
  { header: "Branch", accessor: (r: ProductReportRow) => r.branch_name },
  {
    header: "Delivery Date",
    accessor: (r: ProductReportRow) =>
      format(new Date(`${r.delivery_date}T00:00:00`), "dd MMM yyyy"),
  },
  { header: "Product", accessor: (r: ProductReportRow) => r.product_name },
  {
    header: "Qty",
    accessor: (r: ProductReportRow) => r.quantity,
    align: "right" as const,
  },
  {
    header: "Unit Price",
    accessor: (r: ProductReportRow) => `₹${Number(r.unit_price).toFixed(2)}`,
    align: "right" as const,
  },
  {
    header: "Disc",
    accessor: (r: ProductReportRow) =>
      Number(r.product_discount) > 0
        ? `₹${Number(r.product_discount).toFixed(2)}`
        : "—",
    align: "right" as const,
  },
  {
    header: "Item Total",
    accessor: (r: ProductReportRow) => `₹${Number(r.item_total).toFixed(2)}`,
    align: "right" as const,
  },
  {
    header: "Order Total",
    accessor: (r: ProductReportRow) => `₹${Number(r.order_total).toFixed(2)}`,
    align: "right" as const,
  },
  {
    header: "Paid",
    accessor: (r: ProductReportRow) => `₹${Number(r.amount_paid).toFixed(2)}`,
    align: "right" as const,
  },
  { header: "Payment", accessor: (r: ProductReportRow) => r.payment_status },
];

export const purchasePrintColumns = [
  {
    header: "Date",
    accessor: (r: Purchase) =>
      new Date(r.purchase_date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
  },
  { header: "Invoice No", accessor: (r: Purchase) => r.invoice_number },
  { header: "Vendor", accessor: (r: Purchase) => r.vendor_name || "" },
  {
    header: "Storage Room",
    accessor: (r: Purchase) => r.storage_room_name || "",
  },
  { header: "Restaurant", accessor: (r: Purchase) => r.restaurant_name || "" },
  {
    header: "Total",
    accessor: (r: Purchase) => `₹${Number(r.total_cost).toFixed(2)}`,
    align: "right" as const,
  },
];
