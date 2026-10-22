export const formatIndianAmount = (value) => {
  if (value === null || value === undefined || value === "") return "";
  const numeric = String(value)
    .replace(/,/g, "")
    .replace(/[^\d.]/g, "");
  if (!numeric) return "";
  const [whole, decimal] = numeric.split(".");
  const formattedWhole = Number(whole || 0).toLocaleString("en-IN");
  return decimal !== undefined
    ? `${formattedWhole}.${decimal.slice(0, 2)}`
    : formattedWhole;
};

export const parseIndianAmount = (value) => {
  const parsed = Number(String(value ?? "").replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

export const formatHistoryDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};
