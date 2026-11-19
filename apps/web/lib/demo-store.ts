import { appendActivity, type ActivityEvent, type Module } from "./demo-model";

export const storagePrefix = "agritech-preview-v1:";
export const demoChange = "agritech-demo-change";
const memory = new Map<string, unknown>();
export function readDemo<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try { const raw = localStorage.getItem(storagePrefix + key); if (raw !== null) return JSON.parse(raw) as T; } catch {}
  return (memory.get(key) as T) ?? fallback;
}
export function writeDemo(key: string, value: unknown) {
  memory.set(key, value);
  try { localStorage.setItem(storagePrefix + key, JSON.stringify(value)); } catch {
    window.dispatchEvent(new CustomEvent("agritech-storage-warning"));
  }
  window.dispatchEvent(new CustomEvent(demoChange, { detail: key }));
}
const tracking: Record<string, [Module, string, string]> = {
  "registration-submissions": ["governance", "registration", "Registration submitted"],
  "registration-status": ["governance", "registration", "Registration decision"], "assigned-roles": ["governance", "registration", "Roles assigned"],
  "case-status": ["governance", "disputes", "Dispute updated"], "ai-status": ["governance", "investigations", "Investigation reviewed"],
  "identity-status": ["governance", "identity", "Account updated"], "loan-offers": ["governance", "offers", "Loan offer saved"],
  "loan-decisions": ["governance", "applications", "Application reviewed"], "authority-reviews": ["governance", "plans", "Cultivation review"],
  "land-reviews-v2": ["governance", "land", "Land review"], "auditor-notes": ["governance", "ledger", "Auditor note recorded"],
  "harvest-estimate": ["cultivation", "crops", "Harvest estimate saved"], "land-requests": ["cultivation", "plots", "Lease request updated"],
  "cultivation-plans": ["cultivation", "plans", "Cultivation plan submitted"], "crop-health-status": ["cultivation", "health", "Field review requested"],
  "lease-payment": ["cultivation", "leases", "Installment payment"], "market-listings": ["market", "listings", "Listing published"],
  "market-bids": ["market", "bids", "Bid decision"], "market-order": ["market", "dispatch", "Dispatch updated"],
  "market-orders": ["market", "orders", "Escrow hold created"], "transport-booking": ["transport", "book", "Transport booking updated"],
  "transport-handover": ["transport", "assigned", "Handover recorded"], "driver-job-2048": ["transport", "driver", "Driver decision"],
  "fleet-availability": ["transport", "fleet", "Vehicle availability updated"], "warehouse-capacity": ["storage", "settings", "Capacity updated"],
  "warehouse-stock": ["storage", "movements", "Stock movement posted"],
};
const describe = (value: unknown): string => value === undefined ? "Not recorded" : typeof value === "string" ? value : Array.isArray(value) ? value.map(describe).join(" · ") : value && typeof value === "object" ? Object.entries(value).filter(([key]) => key !== "moves").map(([key, val]) => `${key}: ${describe(val)}`).join("; ") : String(value);
export function recordActivity(input: Omit<ActivityEvent, "id" | "date">) {
  const event: ActivityEvent = { ...input, id: crypto.randomUUID(), date: new Date().toISOString() };
  writeDemo("activity-events", appendActivity(readDemo<ActivityEvent[]>("activity-events", []), event));
}
export function trackChange(key: string, before: unknown, after: unknown) {
  const config = tracking[key];
  if (!config || JSON.stringify(before) === JSON.stringify(after)) return;
  const [module, defaultSection, action] = config;
  const path = typeof location === "undefined" ? "" : location.pathname.split("/").at(-1);
  const section = key === "authority-reviews" && path === "warehouses" ? "warehouses" : defaultSection;
  let reference = key;
  let previous = before, next = after;
  if (Array.isArray(after)) {
    const index = after.findIndex((row, i) => JSON.stringify(row) !== JSON.stringify((before as unknown[])?.[i]));
    if (index >= 0) { previous = (before as unknown[])?.[index]; next = after[index]; reference = String(after[index]?.[0] ?? key); }
  } else if (after && typeof after === "object" && !["warehouse-stock", "warehouse-capacity", "harvest-estimate"].includes(key)) {
    const entry = Object.entries(after).find(([id, value]) => JSON.stringify(value) !== JSON.stringify((before as Record<string, unknown>)?.[id]));
    if (entry) { reference = entry[0]; previous = (before as Record<string, unknown>)?.[reference]; next = entry[1]; }
  }
  if (key === "warehouse-stock") reference = String((after as { moves: string[][] }).moves.at(-1)?.[0] ?? "WH-008");
  const actor = key === "registration-submissions" ? "Applicant" : section === "land" ? "Land Registration Officer" : ["offers", "applications"].includes(section) ? "Bank Officer" : section === "ledger" ? "Financial Auditor" : module === "governance" ? "Review officer" : module === "cultivation" && path === "owner" ? "Landowner" : module === "cultivation" ? "Farmer" : module === "storage" ? "Warehouse operator" : module === "transport" ? "Transport operator" : "Market participant";
  recordActivity({ module, section, action, reference, before: describe(previous), after: describe(next), notes: key === "warehouse-stock" ? describe((after as { moves: string[][] }).moves.at(-1)) : typeof next === "object" && next && "note" in next ? String(next.note) : "Recorded in the browser demo", actor, href: `/preview/${module}/${section}?record=${encodeURIComponent(reference)}` });
  if (key === "warehouse-stock") {
    const old = before as { cold: number; dry: number }; const current = after as { cold: number; dry: number };
    const changes = readDemo<{ date: string; type: string; incoming: number; outgoing: number }[]>("stock-changes", []);
    for (const type of ["cold", "dry"] as const) {
      const difference = current[type] - old[type];
      if (difference) changes.push({ date: new Date().toISOString().slice(0, 10), type, incoming: Math.max(0, difference), outgoing: Math.max(0, -difference) });
    }
    writeDemo("stock-changes", changes);
  }
}
