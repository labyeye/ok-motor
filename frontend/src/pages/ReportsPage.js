import { useContext, useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Bike,
  FileSpreadsheet,
  FileText,
  RefreshCw,
  ShoppingCart,
  Shield,
  TrendingUp,
  Wrench,
} from "lucide-react";
import axios from "axios";
import { config } from "../config/environment";
import AuthContext from "../context/AuthContext";
import AppSidebar from "../components/common/AppSidebar";
import { exportRowsToExcel, exportRowsToPdf } from "../utils/exportUtils";

const REPORT_TYPES = [
  {
    id: "sell",
    title: "Sales Report",
    desc: "All sold vehicles and sale amounts",
    Icon: TrendingUp,
  },
  {
    id: "buy",
    title: "Purchase Report",
    desc: "All bought vehicles and purchase amounts",
    Icon: ShoppingCart,
  },
  {
    id: "service",
    title: "Service Report",
    desc: "Service bills and free services",
    Icon: Wrench,
  },
  {
    id: "insurance",
    title: "Insurance Report",
    desc: "Insurance policies and expiry dates",
    Icon: Shield,
  },
  {
    id: "puc",
    title: "PUC Report",
    desc: "PUC certificates and expiry dates",
    Icon: FileText,
  },
  {
    id: "vehicles",
    title: "Vehicle Report",
    desc: "Vehicle inventory and details",
    Icon: Bike,
  },
];

const value = (row, ...keys) => {
  for (const key of keys) {
    if (row?.[key] !== undefined && row?.[key] !== null && row[key] !== "") {
      return row[key];
    }
  }
  return "";
};

const formatReportDate = (input) => {
  if (!input) return "";
  const date = new Date(input);
  if (Number.isNaN(date.getTime()))
    return String(input).replace(/T00:00:00\.000Z$/, "");
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatReportValue = (input) => {
  if (input === null || input === undefined || input === "") return "";
  if (Array.isArray(input)) {
    return input
      .map((item) => {
        if (typeof item !== "object") return item;
        return Object.entries(item)
          .map(([key, itemValue]) => `${key}: ${itemValue}`)
          .join(" | ");
      })
      .join(" || ");
  }
  if (typeof input === "object") {
    return Object.entries(input)
      .map(([key, itemValue]) => `${key}: ${itemValue}`)
      .join(" | ");
  }
  return input;
};

const hasDocument = (documents, ...keys) => {
  const document = keys.reduce((current, key) => current?.[key], documents);
  if (document === null || document === undefined || document === "")
    return false;
  if (Array.isArray(document))
    return document.some((item) => hasDocumentValue(item));
  return hasDocumentValue(document);
};

const hasDocumentValue = (document) => {
  if (document === null || document === undefined || document === "")
    return false;
  if (Array.isArray(document))
    return document.some((item) => hasDocumentValue(item));
  if (typeof document === "object") {
    return Object.values(document).some((value) => hasDocumentValue(value));
  }
  return true;
};

const documentMark = (documents, ...keys) =>
  hasDocument(documents, ...keys) ? "✓" : "✕";

const createReportRow = (row, type) => {
  const registration = value(
    row,
    "registrationNumber",
    "regNo",
    "vehicleRegNo",
  );
  const date = value(
    row,
    type === "insurance" ? "insuranceExpiryDate" : "",
    type === "insurance" ? "insuranceExpiry" : "",
    type === "puc" ? "pucExpiryDate" : "",
    type === "puc" ? "pucExpiry" : "",
    "saleDate",
    "serviceDate",
    "createdAt",
  );

  if (type === "service") {
    return {
      "Service Date": formatReportDate(row.serviceDate || row.createdAt),
      "Delivery Date": formatReportDate(row.deliveryDate),
      Registration: registration,
      "Customer Name": value(row, "customerName"),
      "Customer Phone": value(row, "customerPhone"),
      "Customer Email": value(row, "customerEmail"),
      "Customer Address": value(row, "customerAddress"),
      "Vehicle Type": value(row, "vehicleType"),
      Brand: value(row, "vehicleBrand", "brand"),
      Model: value(row, "vehicleModel", "model"),
      "Chassis Number": value(row, "chassisNumber"),
      "Engine Number": value(row, "engineNumber"),
      "KM Reading": value(row, "kmReading"),
      "Service Type": value(row, "serviceType"),
      "Free Service":
        row.freeServiceIndex === null || row.freeServiceIndex === undefined
          ? "No"
          : `Yes - ${Number(row.freeServiceIndex) + 1}`,
      "Work / Parts Used": formatReportValue(row.serviceItems),
      "Custom Description": value(row, "customServiceDescription"),
      "Issues Reported": value(row, "issuesReported"),
      "Technician Notes": value(row, "technicianNotes"),
      "Warranty Info": value(row, "warrantyInfo"),
      Subtotal: value(row, "totalAmount"),
      Discount: value(row, "discount"),
      "Tax Rate": value(row, "taxRate"),
      "Tax Amount": value(row, "taxAmount"),
      "Grand Total": value(row, "grandTotal"),
      "Advance Paid": value(row, "advancePaid"),
      "Balance Due": value(row, "balanceDue"),
      "Payment Method": value(row, "paymentMethod"),
      "Payment Status": value(row, "paymentStatus"),
    };
  }

  if (type === "buy" || type === "sell") {
    const documents = row.documents || {};
    return {
      Date: formatReportDate(date),
      "Created Date": formatReportDate(row.createdAt),
      "Edited Date": formatReportDate(row.editedAt),
      Registration: registration,
      "Vehicle Brand": value(row, "vehicleName", "vehicleBrand", "brand"),
      "Vehicle Model": value(row, "vehicleModel", "model"),
      Year: value(row, "vehicleYear", "year"),
      "Seller Name": value(row, "sellerName", "sellername"),
      "Seller Phone": value(row, "sellerPhone", "sellerphone"),
      "Seller Email": value(row, "sellerEmail"),
      "Buyer Name": value(row, "buyerName", "customerName"),
      "Buyer Phone": value(row, "buyerPhone", "customerPhone"),
      "Buyer Email": value(row, "buyerEmail", "customerEmail"),
      "Purchase Amount": value(row, "purchaseAmount", "buyAmount"),
      "Sale Amount": value(row, "saleAmount"),
      "Payment Method": value(row, "paymentMethod"),
      "Insurance Company": value(row, "insuranceCompany"),
      "Insurance Policy": value(
        row,
        "insurancePolicyNumber",
        "insurancePolicyNo",
      ),
      "Insurance Expiry": formatReportDate(
        row.insuranceExpiryDate || row.insuranceExpiry,
      ),
      "PUC Number": value(row, "pucNumber"),
      "PUC Expiry": formatReportDate(row.pucExpiryDate || row.pucExpiry),
      "Chassis Number": value(row, "chassisNumber"),
      "Engine Number": value(row, "engineNumber"),
      "Vehicle RC": documentMark(documents, "vehicleRC"),
      Aadhaar: documentMark(documents, "aadhaar"),
      PAN: documentMark(documents, "pan"),
      "Insurance Certificate": documentMark(documents, "insuranceCertificate"),
      "Vehicle NOC": documentMark(documents, "vehicleNOC"),
      "Purchase Receipt": documentMark(documents, "vehicleBuyReceipt"),
      "Signed Letter": documentMark(
        documents,
        type === "buy" ? "signedDocBuy" : "signedDocSell",
      ),
      "Transfer Receipt": documentMark(documents, "transferReceipt"),
      "Delivery / KM Photo": documentMark(documents, "deliveryPhoto"),
      "Vehicle Photos": documentMark(documents, "vehiclePhotos"),
      Notes: value(row, "notes", "note"),
    };
  }

  if (type === "insurance") {
    return {
      "Created Date": formatReportDate(row.createdAt),
      Registration: registration,
      "Person Name": value(row, "personName", "customerName"),
      Phone: value(row, "personPhone", "customerPhone"),
      Email: value(row, "personEmail", "customerEmail"),
      Brand: value(row, "brand", "vehicleBrand"),
      Model: value(row, "vehicleModel", "model"),
      Year: value(row, "year"),
      Color: value(row, "vehicleColor", "color"),
      "Chassis Number": value(row, "chassisNumber"),
      "Engine Number": value(row, "engineNumber"),
      "Vehicle Type": value(row, "vehicleType"),
      "Fuel Type": value(row, "fuelType"),
      "KM Reading": value(row, "kmReading", "vehiclekm"),
      "Policy Number": value(row, "insurancePolicyNo", "insurancePolicyNumber"),
      Company: value(row, "insuranceCompany"),
      "Expiry Date": formatReportDate(
        row.insuranceExpiry || row.insuranceExpiryDate,
      ),
      Status: value(row, "insuranceStatus"),
    };
  }

  if (type === "puc") {
    return {
      "Created Date": formatReportDate(row.createdAt),
      Registration: registration,
      "Person Name": value(row, "personName", "customerName"),
      Phone: value(row, "personPhone", "customerPhone"),
      Email: value(row, "personEmail", "customerEmail"),
      Brand: value(row, "brand", "vehicleBrand"),
      Model: value(row, "vehicleModel", "model"),
      Year: value(row, "year"),
      Color: value(row, "vehicleColor", "color"),
      "Chassis Number": value(row, "chassisNumber"),
      "Engine Number": value(row, "engineNumber"),
      "Vehicle Type": value(row, "vehicleType"),
      "Fuel Type": value(row, "fuelType"),
      "KM Reading": value(row, "kmReading", "vehiclekm"),
      "PUC Number": value(row, "pucNumber"),
      "Issue Date": formatReportDate(row.pucIssueDate),
      "Expiry Date": formatReportDate(row.pucExpiry || row.pucExpiryDate),
      Status: value(row, "pucStatus"),
    };
  }

  return {
    "Created Date": formatReportDate(row.createdAt),
    Registration: registration,
    "Vehicle Name": value(row, "vehicleName"),
    Brand: value(row, "brand", "vehicleBrand"),
    Model: value(row, "vehicleModel", "model"),
    Year: value(row, "year", "vehicleYear"),
    "Vehicle Type": value(row, "vehicleType"),
    "Chassis Number": value(row, "chassisNumber"),
    "Engine Number": value(row, "engineNumber"),
    "KM Reading": value(row, "kmReading"),
    Status: value(row, "availabilityStatus", "status"),
    "Purchase Date": formatReportDate(row.purchaseDate),
    "Sale Date": formatReportDate(row.saleDate),
  };
};

const ReportsPage = () => {
  const { user, logout } = useContext(AuthContext);
  const [rows, setRows] = useState([]);
  const [type, setType] = useState("sell");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token");
        const endpoint =
          type === "sell"
            ? "sell-letters?limit=2000"
            : type === "buy"
              ? "buy-letter?limit=2000"
              : type === "service"
                ? "service-bills?limit=2000"
                : `${type}?limit=2000`;
        const response = await axios.get(`${config.API_BASE_URL}/${endpoint}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = Array.isArray(response.data)
          ? response.data
          : response.data?.data ||
            response.data?.sellLetters ||
            response.data?.buyLetters ||
            [];
        setRows(data);
      } catch (err) {
        setError(err.response?.data?.message || "Unable to load report data");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [type]);

  const reportRows = useMemo(
    () => rows.map((row) => createReportRow(row, type)),
    [rows, type],
  );

  const filteredRows = useMemo(() => {
    const from = fromDate ? new Date(`${fromDate}T00:00:00`) : null;
    const to = toDate ? new Date(`${toDate}T23:59:59`) : null;
    return reportRows.filter((row) => {
      const source = rows[reportRows.indexOf(row)] || {};
      const date = new Date(
        value(
          source,
          type === "insurance" ? "insuranceExpiryDate" : "",
          type === "insurance" ? "insuranceExpiry" : "",
          type === "puc" ? "pucExpiryDate" : "",
          type === "puc" ? "pucExpiry" : "",
          "saleDate",
          "serviceDate",
          "createdAt",
        ),
      );
      if (Number.isNaN(date.getTime())) return !from && !to;
      return (!from || date >= from) && (!to || date <= to);
    });
  }, [fromDate, reportRows, rows, toDate, type]);

  return (
    <div className="page-shell">
      <AppSidebar user={user} onLogout={logout} />
      <main className="page-main responsive-page">
        <div className="page-heading">
          <div>
            <h1>
              <BarChart3 size={24} /> Reports
            </h1>
            <p>Generate operational reports with optional date ranges.</p>
          </div>
          <div className="history-toolbar">
            <label>
              From{" "}
              <input
                type="date"
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
              />
            </label>
            <label>
              To{" "}
              <input
                type="date"
                value={toDate}
                onChange={(event) => setToDate(event.target.value)}
              />
            </label>
            <button
              type="button"
              onClick={() =>
                exportRowsToPdf(
                  filteredRows,
                  "OK Motor Report",
                  `report-${type}`,
                )
              }
            >
              <FileText size={16} /> PDF
            </button>
            <button
              type="button"
              onClick={() => exportRowsToExcel(filteredRows, `report-${type}`)}
            >
              <FileSpreadsheet size={16} /> Excel
            </button>
          </div>
        </div>
        <div className="report-cards">
          {REPORT_TYPES.map(({ id, title, desc, Icon }) => (
            <button
              key={id}
              type="button"
              className={`report-card ${type === id ? "selected" : ""}`}
              onClick={() => setType(id)}
            >
              <Icon size={26} />
              <strong>{title}</strong>
              <span>{desc}</span>
            </button>
          ))}
        </div>
        {loading && <RefreshCw className="spinner" />}
        {error && <p className="error-message">{error}</p>}
        {!loading && !error && (
          <div className="responsive-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  {Object.keys(filteredRows[0] || {}).map((key) => (
                    <th key={key}>{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRows.slice(0, 100).map((row, index) => (
                  <tr key={index}>
                    {Object.values(row).map((value, cellIndex) => (
                      <td key={cellIndex}>{String(value)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
};

export default ReportsPage;
