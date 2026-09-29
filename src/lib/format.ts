export function formatXof(amount: number): string {
  const integer = Number.isInteger(amount) ? amount : Math.trunc(amount);
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(integer);
}

export function formatInteger(value: number): string {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(Math.trunc(value));
}

export function formatDay(value: Date): string {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeZone: "UTC" }).format(value);
}

export function formatDateTime(value: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export function metricUnit(metric: "KILOMETRES" | "HEURES"): string {
  return metric === "KILOMETRES" ? "km" : "h";
}

export function metricName(metric: "KILOMETRES" | "HEURES"): string {
  return metric === "KILOMETRES" ? "Kilomètres" : "Heures";
}
