import { type PrintSettings } from "@/services/printSettingsService";
import { format } from "date-fns";

interface Column {
  header: string;
  accessor: (row: any) => string | number | React.ReactNode;
  align?: "left" | "right" | "center";
}

interface Props {
  settings: PrintSettings;
  title: string;
  columns: Column[];
  data: any[];
  summary?: { label: string; value: string }[];
}

export const PrintTableLayout = ({
  settings,
  title,
  columns,
  data,
  summary,
}: Props) => {
  return (
    <div id='print-area'>
      <div
        style={{
          fontFamily: "Arial, sans-serif",
          fontSize: "12px",
          color: "#000",
          padding: "20px",
          maxWidth: "100%",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            paddingBottom: "12px",
            borderBottom: "2px solid #000",
            marginBottom: "12px",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "18px",
                fontWeight: "bold",
                marginBottom: "4px",
              }}
            >
              {settings.print_company_name || settings.name}
            </div>
            {settings.print_address && (
              <div
                style={{ fontSize: "11px", color: "#444", marginBottom: "2px" }}
              >
                {settings.print_address}
              </div>
            )}
            {settings.print_contact && (
              <div style={{ fontSize: "11px", color: "#444" }}>
                Tel: {settings.print_contact}
              </div>
            )}
          </div>
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontSize: "14px",
                fontWeight: "bold",
                marginBottom: "4px",
              }}
            >
              {title}
            </div>
            <div style={{ fontSize: "11px", color: "#444" }}>
              {format(new Date(), "dd MMM yyyy, hh:mm a")}
            </div>
          </div>
        </div>

        {/* Table */}
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginBottom: "16px",
          }}
        >
          <thead>
            <tr style={{ backgroundColor: "#f5f5f5" }}>
              {columns.map((col, i) => (
                <th
                  key={i}
                  style={{
                    border: "1px solid #ddd",
                    padding: "6px 8px",
                    fontSize: "11px",
                    fontWeight: "bold",
                    textAlign: col.align || "left",
                  }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr
                key={i}
                style={{
                  backgroundColor: i % 2 === 0 ? "#fff" : "#fafafa",
                }}
              >
                {columns.map((col, j) => (
                  <td
                    key={j}
                    style={{
                      border: "1px solid #ddd",
                      padding: "6px 8px",
                      fontSize: "11px",
                      textAlign: col.align || "left",
                    }}
                  >
                    {col.accessor(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Summary */}
        {summary && summary.length > 0 && (
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginBottom: "24px",
            }}
          >
            <table style={{ borderCollapse: "collapse", minWidth: "240px" }}>
              {summary.map((s, i) => (
                <tr key={i}>
                  <td
                    style={{
                      padding: "3px 12px 3px 0",
                      fontSize: "11px",
                      color: "#444",
                      textAlign: "right",
                    }}
                  >
                    {s.label}
                  </td>
                  <td
                    style={{
                      padding: "3px 0",
                      fontSize: "11px",
                      fontWeight: "bold",
                      textAlign: "right",
                    }}
                  >
                    {s.value}
                  </td>
                </tr>
              ))}
            </table>
          </div>
        )}

        {/* Footer */}
        <div
          style={{
            borderTop: "1px solid #000",
            paddingTop: "12px",
          }}
        >
          {settings.print_footer_note && (
            <div
              style={{
                textAlign: "center",
                fontSize: "11px",
                color: "#444",
                marginBottom: "32px",
              }}
            >
              {settings.print_footer_note}
            </div>
          )}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "40px",
              paddingTop: "8px",
            }}
          >
            <div style={{ textAlign: "center", flex: 1 }}>
              <div
                style={{
                  borderTop: "1px solid #000",
                  paddingTop: "6px",
                  fontSize: "11px",
                }}
              >
                Authorized Signature
              </div>
            </div>
            <div style={{ flex: 1 }} />
            <div style={{ textAlign: "center", flex: 1 }}>
              <div
                style={{
                  borderTop: "1px solid #000",
                  paddingTop: "6px",
                  fontSize: "11px",
                }}
              >
                Receiver's Signature
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
