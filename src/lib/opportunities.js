export const STATUSES = [
  "Saved",
  "Interested",
  "Preparing",
  "Applied",
  "Recruiter Screen",
  "Interview",
  "Offer",
  "Rejected",
  "Withdrawn",
  "Closed",
];

export const FINISHED_STATUSES = new Set(["Rejected", "Withdrawn", "Closed"]);

export function today() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function formatDate(value) {
  if (!value) return "—";
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(date);
}

export function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }).format(date);
}

export function safeJobUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password ? url.href : "";
  } catch {
    return "";
  }
}

export function statusClass(status) {
  if (!STATUSES.includes(status)) return "status-saved";
  return `status-${status.toLowerCase().replaceAll(" ", "-")}`;
}
