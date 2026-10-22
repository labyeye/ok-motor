import {
  FileSpreadsheet,
  FileText,
  ListFilter,
  ArrowUpDown,
} from "lucide-react";
import { exportRowsToExcel, exportRowsToPdf } from "../utils/exportUtils";

const HistoryExportToolbar = ({
  rows,
  title,
  filename,
  onSort,
  onFilter,
  filterActive = false,
}) => (
  <div className="history-toolbar">
    <button type="button" onClick={onSort} title="Sort">
      <ArrowUpDown size={16} /> Sort
    </button>
    <button
      type="button"
      className={filterActive ? "active" : ""}
      onClick={onFilter}
      title="Filter"
    >
      <ListFilter size={16} /> Filter
    </button>
    <button
      type="button"
      onClick={() => exportRowsToPdf(rows, title, filename)}
      title="Export PDF"
    >
      <FileText size={16} /> PDF
    </button>
    <button
      type="button"
      onClick={() => exportRowsToExcel(rows, filename)}
      title="Export Excel"
    >
      <FileSpreadsheet size={16} /> Excel
    </button>
  </div>
);

export default HistoryExportToolbar;
