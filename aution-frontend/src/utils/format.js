import { parseServerDate } from "./datetime";

export function formatCurrency(amount) {
  if (amount == null) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatLotNumber(id) {
  return String(id).padStart(3, "0");
}

export function formatDateTime(iso) {
  if (!iso) return "—";
  return parseServerDate(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}