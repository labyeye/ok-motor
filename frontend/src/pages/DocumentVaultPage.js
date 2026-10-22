import { Fragment, useContext, useEffect, useMemo, useState } from "react";
import {
  Check,
  Camera,
  CreditCard,
  Download,
  FileArchive,
  FileCheck2,
  FileSpreadsheet,
  FileSignature,
  FolderOpen,
  IdCard,
  Images,
  FileText,
  Receipt,
  Search,
  ShieldAlert,
  ShieldCheck,
  X,
} from "lucide-react";
import axios from "axios";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { config } from "../config/environment";
import AuthContext from "../context/AuthContext";
import AppSidebar from "../components/common/AppSidebar";
import { exportRowsToExcel } from "../utils/exportUtils";
import panLogo from "../assets/pancardlogo.png";
import rcLogo from "../assets/vehiclerclogo.png";
import aadhaarLogo from "../assets/aadhaar.png";

// Each column groups one or more keys of the stored `documents` object.
const DOC_COLUMNS = [
  {
    id: "rc",
    label: "Vehicle RC",
    shortLabel: "RC",
    keys: ["vehicleRC"],
    logo: rcLogo,
    Icon: FileCheck2,
    color: "#2563eb",
  },
  {
    id: "aadhaar",
    label: "Aadhaar",
    shortLabel: "AAD",
    keys: ["aadhaar"],
    logo: aadhaarLogo,
    Icon: IdCard,
    color: "#7c3aed",
  },
  {
    id: "pan",
    label: "PAN",
    shortLabel: "PAN",
    keys: ["pan"],
    logo: panLogo,
    Icon: CreditCard,
    color: "#0891b2",
  },
  {
    id: "insurance",
    label: "Insurance",
    shortLabel: "INS",
    keys: ["insuranceCertificate"],
    Icon: ShieldCheck,
    color: "#16a34a",
  },
  {
    id: "noc",
    label: "NOC",
    shortLabel: "NOC",
    keys: ["vehicleNOC"],
    Icon: ShieldAlert,
    color: "#ea580c",
  },
  {
    id: "receipt",
    label: "Receipt",
    shortLabel: "REC",
    keys: ["vehicleBuyReceipt", "transferReceipt", "vehicleSellReceipt"],
    Icon: Receipt,
    color: "#c026d3",
  },
  {
    id: "photos",
    label: "Vehicle Pics",
    shortLabel: "PIC",
    keys: ["vehiclePhotos"],
    Icon: Images,
    color: "#db2777",
  },
  {
    id: "delivery",
    label: "Delivery",
    shortLabel: "DEL",
    keys: ["deliveryPhoto"],
    Icon: Camera,
    color: "#4f46e5",
  },
  {
    id: "signed",
    label: "Signed Doc",
    shortLabel: "SIG",
    keys: ["signedDocBuy", "signedDocSell"],
    Icon: FileSignature,
    color: "#0f766e",
  },
];
const CORE = ["rc", "aadhaar", "pan"];

const extractRows = (response) =>
  Array.isArray(response.data)
    ? response.data
    : response.data?.data ||
      response.data?.buyLetters ||
      response.data?.sellLetters ||
      [];

const toUrl = (value) => {
  if (typeof value !== "string" || !value) return null;
  if (/^https?:\/\//.test(value)) return value;
  if (value.startsWith("/")) return `${config.FULL_API_URL}${value}`;
  return null;
};

// Collect every URL under a documents key (string, array, {front,back}, {pages}).
const collectUrls = (value) => {
  if (!value) return [];
  if (typeof value === "string") return [toUrl(value)].filter(Boolean);
  if (Array.isArray(value)) return value.flatMap(collectUrls);
  if (typeof value === "object") {
    return ["front", "back", "pages"].flatMap((k) => collectUrls(value[k]));
  }
  return [];
};

const personOf = (r) => {
  if (r.recordType === "Buy") {
    return (
      r.sellerName ||
      r.sellername ||
      r.ownerName ||
      r.personName ||
      r.customerName ||
      ""
    );
  }
  if (r.recordType === "Sell") {
    return (
      r.buyerName ||
      r.buyername ||
      r.ownerName ||
      r.personName ||
      r.customerName ||
      ""
    );
  }
  return (
    r.ownerName ||
    r.personName ||
    r.customerName ||
    r.buyerName ||
    r.sellerName ||
    ""
  );
};

const fmtDate = (v) => {
  const d = new Date(v);
  return v && !Number.isNaN(d.getTime()) ? d.toLocaleDateString("en-IN") : "-";
};

const DocIcon = ({ col, size = 20 }) =>
  col.logo ? (
    <img
      className="vault-document-logo"
      src={col.logo}
      alt=""
      width={size}
      height={size}
    />
  ) : (
    <col.Icon
      size={size}
      strokeWidth={2.2}
      aria-hidden="true"
      style={{ color: col.color }}
    />
  );

const DocumentVaultPage = () => {
  const { user, logout } = useContext(AuthContext);
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [loading, setLoading] = useState(true);
  const [zipping, setZipping] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };
        const responses = await Promise.all([
          axios.get(`${config.API_BASE_URL}/buy-letter?limit=2000`, {
            headers,
          }),
          axios.get(`${config.API_BASE_URL}/sell-letters?limit=2000`, {
            headers,
          }),
          axios.get(`${config.API_BASE_URL}/insurance?limit=2000`, { headers }),
          axios.get(`${config.API_BASE_URL}/puc?limit=2000`, { headers }),
          axios.get(`${config.API_BASE_URL}/vehicles?limit=2000`, { headers }),
        ]);
        const labels = ["Buy", "Sell", "Insurance", "PUC", "Vehicle"];
        setRecords(
          responses.flatMap((response, index) =>
            extractRows(response).map((row) => ({
              ...row,
              recordType: labels[index],
            })),
          ),
        );
      } catch (loadError) {
        setError(
          loadError.response?.data?.message || "Unable to load document vault",
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // One row per record that has at least one document.
  const rows = useMemo(
    () =>
      Array.from(
        records
          .map((record) => {
            const source = record.documents || {};
            const files = {};
            let total = 0;
            DOC_COLUMNS.forEach((col) => {
              files[col.id] = col.keys.flatMap((k) => collectUrls(source[k]));
              total += files[col.id].length;
            });
            const reg =
              record.registrationNumber ||
              record.regNo ||
              record.vehicleRegNo ||
              "";
            return {
              id: `${record.recordType}-${record._id}`,
              type: record.recordType,
              reg,
              person: personOf(record),
              phone:
                record.buyerPhone ||
                record.sellerPhone ||
                record.personPhone ||
                record.phone ||
                "",
              uploadedOn:
                source.meta?.uploadedAt ||
                record.updatedAt ||
                record.createdAt ||
                record.saleDate,
              files,
              total,
            };
          })
          .reduce((unique, row) => {
            if (!row.reg) {
              unique.push(row);
              return unique;
            }

            const existingIndex = unique.findIndex(
              (candidate) =>
                candidate.reg.toLowerCase() === row.reg.toLowerCase(),
            );
            if (existingIndex === -1) {
              unique.push(row);
              return unique;
            }

            const existingTime = new Date(
              unique[existingIndex].uploadedOn,
            ).getTime();
            const rowTime = new Date(row.uploadedOn).getTime();
            if (
              Number.isNaN(existingTime) ||
              (!Number.isNaN(rowTime) && rowTime > existingTime)
            ) {
              unique[existingIndex] = row;
            }
            return unique;
          }, []),
      )
        .filter((row) => row.total > 0)
        .filter((row) => type === "all" || row.type === type)
        .filter((row) => {
          const q = search.toLowerCase();
          return !q || `${row.reg} ${row.person}`.toLowerCase().includes(q);
        }),
    [records, search, type],
  );

  const summary = useMemo(() => {
    const complete = rows.filter((r) =>
      CORE.every((id) => r.files[id].length),
    ).length;
    return [
      { label: "Records with documents", value: rows.length, Icon: FolderOpen },
      {
        label: "Total files",
        value: rows.reduce((n, r) => n + r.total, 0),
        Icon: FileText,
      },
      { label: "RC + Aadhaar + PAN complete", value: complete, Icon: Check },
      {
        label: "Missing core documents",
        value: rows.length - complete,
        Icon: X,
      },
      {
        label: "Buy records",
        value: rows.filter((r) => r.type === "Buy").length,
        Icon: Download,
      },
      {
        label: "Sell records",
        value: rows.filter((r) => r.type === "Sell").length,
        Icon: Download,
      },
    ];
  }, [rows]);

  const buildZip = async (list, name) => {
    setZipping(true);
    try {
      const zip = new JSZip();
      let failed = 0;
      for (const row of list) {
        const folder = zip.folder(`${row.reg || row.id}-${row.type}`);
        for (const col of DOC_COLUMNS) {
          for (const [i, url] of row.files[col.id].entries()) {
            try {
              const res = await fetch(url);
              if (!res.ok) throw new Error(res.status);
              const ext = (url.split("?")[0].match(/\.(\w{2,5})$/) || [
                null,
                "jpg",
              ])[1];
              folder.file(`${col.label}-${i + 1}.${ext}`, await res.blob());
            } catch {
              failed += 1;
            }
          }
        }
      }
      saveAs(await zip.generateAsync({ type: "blob" }), `${name}.zip`);
      if (failed)
        alert(`${failed} file(s) could not be downloaded and were skipped.`);
    } finally {
      setZipping(false);
    }
  };

  const exportMatrix = () =>
    exportRowsToExcel(
      rows.map((r) => ({
        Registration: r.reg,
        Type: r.type,
        Person: r.person,
        Phone: r.phone,
        "Uploaded On": fmtDate(r.uploadedOn),
        "Total Files": r.total,
        ...Object.fromEntries(
          DOC_COLUMNS.map((col) => [
            col.label,
            r.files[col.id].length ? "✔" : "✘",
          ]),
        ),
      })),
      "document-vault",
    );

  return (
    <div className="page-shell">
      <AppSidebar user={user} onLogout={logout} />
      <main className="page-main responsive-page">
        <div className="page-heading">
          <div>
            <h1>
              <FolderOpen size={24} /> Document Vault
            </h1>
            <p>Find and download all available vehicle documents.</p>
          </div>
          <div className="history-toolbar">
            <button
              type="button"
              onClick={exportMatrix}
              disabled={!rows.length}
            >
              <FileSpreadsheet size={16} /> Excel
            </button>
            <button
              type="button"
              onClick={() => buildZip(rows, "document-vault")}
              disabled={!rows.length || zipping}
            >
              <FileArchive size={16} />{" "}
              {zipping ? "Zipping..." : "Download ZIP"}
            </button>
          </div>
        </div>

        <div className="vault-summary">
          {summary.map(({ label, value, Icon }) => (
            <div className="vault-summary-card" key={label}>
              <Icon size={22} />
              <strong>{value}</strong>
              <span>{label}</span>
            </div>
          ))}
        </div>

        <div className="vault-search">
          <Search size={17} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search registration or person name"
          />
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="all">All types</option>
            <option value="Buy">Buy</option>
            <option value="Sell">Sell</option>
            <option value="Insurance">Insurance</option>
            <option value="PUC">PUC</option>
            <option value="Vehicle">Vehicle</option>
          </select>
        </div>

        {loading ? (
          <p>Loading documents...</p>
        ) : error ? (
          <p className="error-message">{error}</p>
        ) : (
          <div className="responsive-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Registration</th>
                  <th>Type</th>
                  <th>Person</th>
                  <th>Phone</th>
                  <th>Uploaded On</th>
                  {DOC_COLUMNS.map((col) => (
                    <th
                      key={col.id}
                      title={col.label}
                      className="vault-document-heading"
                      style={{ "--document-color": col.color }}
                    >
                      <DocIcon col={col} />
                      <span>{col.shortLabel}</span>
                    </th>
                  ))}
                  <th title="Download ZIP">ZIP</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <Fragment key={row.id}>
                    <tr>
                      <td>{row.reg || "-"}</td>
                      <td>{row.type}</td>
                      <td>{row.person || "-"}</td>
                      <td>{row.phone || "-"}</td>
                      <td>{fmtDate(row.uploadedOn)}</td>
                      {DOC_COLUMNS.map((col) => (
                        <td key={col.id} className="vault-document-status">
                          {row.files[col.id].length ? (
                            <span
                              className="vault-status-present"
                              title={`${col.label} available`}
                            >
                              <Check size={17} strokeWidth={3} />
                              <span className="sr-only">
                                {col.label} available
                              </span>
                            </span>
                          ) : (
                            <span
                              className="vault-status-missing"
                              title={`${col.label} missing`}
                            >
                              <X size={17} strokeWidth={2.5} />
                              <span className="sr-only">
                                {col.label} missing
                              </span>
                            </span>
                          )}
                        </td>
                      ))}
                      <td>
                        <button
                          className="vault-download-button"
                          type="button"
                          disabled={zipping}
                          onClick={() => buildZip([row], row.reg || row.id)}
                          title="Download all documents"
                        >
                          <FileArchive size={16} />
                          <span className="sr-only">
                            Download all documents
                          </span>
                        </button>
                      </td>
                    </tr>
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
};

export default DocumentVaultPage;
