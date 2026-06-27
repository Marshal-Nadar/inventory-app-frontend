import { type Bill } from "@/services/billingService";
import { format } from "date-fns";

interface Props {
  bill: Bill;
}

export const ReceiptPrintLayout = ({ bill }: Props) => {
  return (
    <div id='receipt-print-area' style={{ display: "none" }}>
      <div
        style={{
          width: "72mm",
          fontFamily: "'Courier New', monospace",
          fontSize: "12px",
          color: "#000",
          padding: "4mm",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "6px" }}>
          <div style={{ fontSize: "16px", fontWeight: "bold" }}>
            {bill.print_company_name || "Restaurant"}
          </div>
          {bill.print_address && (
            <div style={{ fontSize: "10px" }}>{bill.print_address}</div>
          )}
          {bill.print_contact && (
            <div style={{ fontSize: "10px" }}>Mob: {bill.print_contact}</div>
          )}
        </div>

        <div style={{ borderTop: "1px dashed #000", margin: "6px 0" }} />

        {/* Bill info */}
        <div style={{ fontSize: "11px" }}>
          <div>Bill No: {bill.bill_number}</div>
          <div>{format(new Date(bill.created_at), "dd/MM/yyyy hh:mm a")}</div>
          <div>Branch: {bill.branch_name}</div>
          <div>Served by: {bill.billed_by_name}</div>
        </div>

        <div style={{ borderTop: "1px dashed #000", margin: "6px 0" }} />

        {/* Items */}
        <table style={{ width: "100%", fontSize: "11px" }}>
          <thead>
            <tr>
              <td style={{ fontWeight: "bold" }}>Item</td>
              <td style={{ fontWeight: "bold", textAlign: "center" }}>Qty</td>
              <td style={{ fontWeight: "bold", textAlign: "right" }}>Amt</td>
            </tr>
          </thead>
          <tbody>
            {bill.items?.map((item, i) => (
              <tr key={i}>
                <td style={{ paddingTop: "2px" }}>{item.product_name}</td>
                <td style={{ textAlign: "center", paddingTop: "2px" }}>
                  {item.quantity}
                </td>
                <td style={{ textAlign: "right", paddingTop: "2px" }}>
                  {Number(item.item_total).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ borderTop: "1px dashed #000", margin: "6px 0" }} />

        {/* Totals */}
        <div style={{ fontSize: "11px" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Subtotal</span>
            <span>₹{Number(bill.subtotal).toFixed(2)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>GST ({bill.gst_percent}%)</span>
            <span>₹{Number(bill.gst_amount).toFixed(2)}</span>
          </div>
        </div>

        <div style={{ borderTop: "1px dashed #000", margin: "6px 0" }} />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "14px",
            fontWeight: "bold",
          }}
        >
          <span>TOTAL</span>
          <span>₹{Number(bill.total_amount).toFixed(2)}</span>
        </div>

        <div style={{ marginTop: "4px", fontSize: "11px" }}>
          Payment: {bill.payment_method.toUpperCase()}
        </div>

        <div style={{ borderTop: "1px dashed #000", margin: "6px 0" }} />

        {bill.print_footer_note && (
          <div style={{ textAlign: "center", fontSize: "10px" }}>
            {bill.print_footer_note}
          </div>
        )}
        <div
          style={{ textAlign: "center", fontSize: "10px", marginTop: "4px" }}
        >
          Thank you for your visit!
        </div>
      </div>
    </div>
  );
};
