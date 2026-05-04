import React, { useState, useRef, useEffect } from "react";
import { Filter } from "lucide-react";

const operatorOptions = {
  text: [
    { key: "contains", label: "Contains" },
    { key: "eq", label: "Equals" },
    { key: "starts", label: "Starts with" },
  ],
  number: [
    { key: "eq", label: "=" },
    { key: "gt", label: ">" },
    { key: "lt", label: "<" },
    { key: "gte", label: ">=" },
    { key: "lte", label: "<=" },
    { key: "between", label: "Between" },
  ],
  date: [
    { key: "eq", label: "On" },
    { key: "before", label: "Before" },
    { key: "after", label: "After" },
    { key: "between", label: "Between" },
  ],
};

const TableFilter = ({
  type = "text",
  onApply = () => {},
  onClear = () => {},
  placeholder = "",
  compact = false,
  rangeOnly = false,
}) => {
  const [open, setOpen] = useState(false);
  const [op, setOp] = useState(
    rangeOnly ? "between" : operatorOptions[type]?.[0]?.key || "contains",
  );
  const [value, setValue] = useState("");
  const [value2, setValue2] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const onDoc = (e) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  const clear = () => {
    setOp(rangeOnly ? "between" : operatorOptions[type]?.[0]?.key || "");
    setValue("");
    setValue2("");
    onClear();
    setOpen(false);
  };

  const apply = () => {
    const v1 = String(value || "").trim();
    const v2 = String(value2 || "").trim();

    if (op === "between") {
      if (!v1 && !v2) return;
    } else {
      if (!v1) return;
    }

    onApply({ op, value: v1, value2: v2 });
    setOpen(false);
  };

  const inputType =
    type === "date" ? "date" : type === "number" ? "number" : "text";

  const betweenPlaceholders = (() => {
    if (type === "date") return ["From", "To"];
    return ["Min", "Max"];
  })();

  return (
    <div style={{ position: "relative", display: "inline-block" }} ref={ref}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen((s) => !s);
        }}
        title="Filter"
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: compact ? 4 : 6,
          color: open ? "#071952" : "#64748b",
        }}
      >
        <Filter size={14} />
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: compact ? 26 : 28,
            right: 0,
            zIndex: 1200,
            background: "#fff",
            border: "1px solid #e6edf3",
            boxShadow: "0 6px 18px rgba(2,6,23,0.08)",
            borderRadius: 8,
            padding: 10,
            minWidth: 220,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {!rangeOnly ? (
            <div style={{ marginBottom: 8 }}>
              <select
                value={op}
                onChange={(e) => setOp(e.target.value)}
                style={{
                  width: "100%",
                  padding: "6px 8px",
                  borderRadius: 6,
                  border: "1px solid #e6edf3",
                }}
              >
                {(operatorOptions[type] || operatorOptions.text).map((o) => (
                  <option key={o.key} value={o.key}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div style={{ marginBottom: 8, fontSize: 13, color: "#374151" }}>
              Range
            </div>
          )}

          <div
            style={{
              display: "flex",
              gap: 8,
              marginBottom: 8,
              alignItems: "center",
            }}
          >
            {op === "between" ? (
              <>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    flex: 1,
                  }}
                >
                  <div style={{ fontSize: 12, color: "#64748b" }}>
                    {betweenPlaceholders[0]}
                  </div>
                  <input
                    type={inputType}
                    value={value}
                    placeholder={type === "date" ? "yyyy-mm-dd" : "Min"}
                    onChange={(e) => setValue(e.target.value)}
                    style={{
                      flex: 1,
                      padding: "6px 8px",
                      borderRadius: 6,
                      border: "1px solid #e6edf3",
                    }}
                    {...(inputType === "number" ? { step: 1 } : {})}
                  />
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    width: 110,
                  }}
                >
                  <div style={{ fontSize: 12, color: "#64748b" }}>
                    {betweenPlaceholders[1]}
                  </div>
                  <input
                    type={inputType}
                    value={value2}
                    placeholder={type === "date" ? "yyyy-mm-dd" : "Max"}
                    onChange={(e) => setValue2(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "6px 8px",
                      borderRadius: 6,
                      border: "1px solid #e6edf3",
                    }}
                    {...(inputType === "number" ? { step: 1 } : {})}
                  />
                </div>
              </>
            ) : (
              <input
                type={inputType}
                value={value}
                placeholder={placeholder}
                onChange={(e) => setValue(e.target.value)}
                style={{
                  flex: 1,
                  padding: "6px 8px",
                  borderRadius: 6,
                  border: "1px solid #e6edf3",
                }}
                {...(inputType === "number" ? { step: 1 } : {})}
              />
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button
              onClick={clear}
              style={{
                padding: "6px 10px",
                background: "#f1f5f9",
                borderRadius: 6,
                border: "none",
                cursor: "pointer",
              }}
            >
              Clear
            </button>
            <button
              onClick={apply}
              style={{
                padding: "6px 10px",
                background: "#071952",
                color: "#fff",
                borderRadius: 6,
                border: "none",
                cursor: "pointer",
              }}
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableFilter;
