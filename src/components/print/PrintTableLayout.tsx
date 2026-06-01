import { type PrintSettings } from "@/services/printSettingsService";
import { format } from "date-fns";

interface Column {
  header: string;
  accessor: (row: any, index?: number) => string | number | React.ReactNode;
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
    <div id='print-area' style={{ display: "none" }}>
      <div
        style={{
          fontFamily: "'Segoe UI', Arial, sans-serif",
          fontSize: "12px",
          color: "#111",
          padding: "16px 24px",
          maxWidth: "100%",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            paddingBottom: "14px",
            borderBottom: "2px solid #111",
            marginBottom: "18px",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "16px",
                fontWeight: "700",
                marginBottom: "3px",
              }}
            >
              {settings.print_company_name || settings.name}
            </div>
            {settings.print_address && (
              <div
                style={{ fontSize: "11px", color: "#555", marginBottom: "2px" }}
              >
                {settings.print_address}
              </div>
            )}
            {settings.print_contact && (
              <div style={{ fontSize: "11px", color: "#555" }}>
                Mob: {settings.print_contact}
              </div>
            )}
          </div>
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontSize: "16px",
                fontWeight: "700",
                marginBottom: "4px",
              }}
            >
              {title}
            </div>
            <div style={{ fontSize: "11px", color: "#555" }}>
              {format(new Date(), "dd MMM yyyy, hh:mm a")}
            </div>
          </div>
        </div>

        {/* Table — full border grid */}
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginBottom: "20px",
            border: "1px solid #bbb",
          }}
        >
          <thead>
            <tr style={{ backgroundColor: "#f0f0f0" }}>
              {columns.map((col, i) => (
                <th
                  key={i}
                  style={{
                    border: "1px solid #bbb",
                    padding: "8px 10px",
                    fontSize: "11px",
                    fontWeight: "700",
                    textAlign: col.align || "left",
                    textTransform: "uppercase",
                    letterSpacing: "0.4px",
                    color: "#222",
                    whiteSpace: "nowrap",
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
                      border: "1px solid #bbb",
                      padding: "8px 10px",
                      fontSize: "11px",
                      textAlign: col.align || "left",
                      verticalAlign: "top",
                      lineHeight: "1.5",
                    }}
                  >
                    {col.accessor(row, i)}
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
              marginBottom: "28px",
            }}
          >
            <table
              style={{
                borderCollapse: "collapse",
                minWidth: "240px",
                border: "1px solid #bbb",
              }}
            >
              <tbody>
                {summary.map((s, i) => (
                  <tr key={i}>
                    <td
                      style={{
                        border: "1px solid #bbb",
                        padding: "7px 14px",
                        fontSize: "11px",
                        color: "#555",
                        textAlign: "right",
                      }}
                    >
                      {s.label}
                    </td>
                    <td
                      style={{
                        border: "1px solid #bbb",
                        padding: "7px 14px",
                        fontSize: "12px",
                        fontWeight: "700",
                        textAlign: "right",
                        minWidth: "90px",
                      }}
                    >
                      {s.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer — no separator, no footer note section */}
        <div style={{ marginTop: "40px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "80px",
            }}
          >
            <div style={{ flex: 1, textAlign: "center" }}>
              <div
                style={{
                  borderTop: "1px solid #333",
                  paddingTop: "6px",
                  fontSize: "11px",
                  color: "#333",
                }}
              >
                Authorized Signature
              </div>
            </div>
            <div style={{ flex: 1, textAlign: "center" }}>
              <div
                style={{
                  borderTop: "1px solid #333",
                  paddingTop: "6px",
                  fontSize: "11px",
                  color: "#333",
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
