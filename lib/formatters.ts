export function formatCurrency(value: number, currency = "USD") {
  if (value == null || isNaN(value)) return "$0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatNumber(value: number, maximumFractionDigits = 2) {
  if (value == null || isNaN(value)) return "0";
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits,
  }).format(value);
}

export function formatPercent(value: number) {
  if (value == null || isNaN(value)) return "0.00%";
  return `${value.toFixed(2)}%`;
}
