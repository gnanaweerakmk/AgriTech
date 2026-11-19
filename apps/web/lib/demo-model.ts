export type Module = "governance" | "cultivation" | "market" | "transport" | "storage";
export type Transaction = {
  id: string; applicantId: string; module: Module; reference: string; date: string;
  payer: string; payee: string; gross: number; fee: number; status: "Settled" | "Held" | "Refunded";
  paymentRef: string; dispute?: string; events: { date: string; action: string }[];
};
export type ActivityEvent = { id: string; date: string; module: Module; section: string; actor: string; action: string; reference: string; before: string; after: string; notes: string; href: string };
export type DemoDocument = { id: string; title: string; url: string; type: "pdf" | "image" };
export type Loan = { id: string; lender: string; start: string; due: string; principal: number; balance: number; status: string; overdue: number };
export type Applicant = { id: string; name: string; amount: number; purpose: string; consent: boolean; loans: Loan[]; documents: DemoDocument[]; assessment: { score: number; factors: string[] } | null };
export const sampleDocument: DemoDocument = { id: "DOC-001", title: "Sample financial statement", url: "/demo/financial-statement.pdf", type: "pdf" };
export const applicants: Applicant[] = [
  { id: "LN-101", name: "Kavindu Silva", amount: 250000, purpose: "Drip irrigation for LD-018", consent: true,
    documents: [sampleDocument, { id: "DOC-002", title: "Plot survey — LD-018", url: "/demo/plot-survey.svg", type: "image" }],
    loans: [{ id: "LOAN-081", lender: "Agri Development Bank", start: "2025-01-15", due: "2026-01-15", principal: 180000, balance: 0, status: "Repaid", overdue: 0 }, { id: "LOAN-094", lender: "Rural Credit Bank", start: "2026-03-01", due: "2027-03-01", principal: 120000, balance: 40000, status: "Active", overdue: 0 }],
    assessment: { score: 82, factors: ["One repaid loan and no overdue installments", "Recurring settled produce sales in the sample ledger", "Verified plot LD-018 supports the production history", "Disputed/refunded transactions warrant review"] } },
  { id: "LN-102", name: "Harvest Hub", amount: 500000, purpose: "Cold storage expansion", consent: true,
    documents: [{ ...sampleDocument, id: "DOC-003", title: "Sample storage finance application", url: "/demo/harvest-hub-statement.pdf" }],
    loans: [{ id: "LOAN-097", lender: "Rural Credit Bank", start: "2026-06-01", due: "2027-06-01", principal: 350000, balance: 290000, status: "Overdue", overdue: 2 }],
    assessment: { score: 58, factors: ["Two overdue installments on the existing loan", "Sample storage fee receipts show ongoing platform use", "Outstanding balance of LKR 290,000", "Shorter repayment history than LN-101"] } },
  { id: "LN-103", name: "Maya Fernando", amount: 90000, purpose: "First growing season", consent: true, documents: [], loans: [], assessment: null },
  { id: "LN-104", name: "Uva Growers", amount: 320000, purpose: "Harvest equipment", consent: false, documents: [], loans: [], assessment: null },
];
export function financialAccess(applicant: Applicant) { return applicant.consent; }
export const transactions: Transaction[] = Array.from({ length: 28 }, (_, index) => {
  const day = 7 + Math.floor(index / 2);
  const date = `2026-10-${String(day).padStart(2, "0")}T${index % 2 ? "14" : "09"}:00:00+05:30`;
  const status = index % 9 === 0 ? "Refunded" : index % 5 === 0 ? "Held" : "Settled";
  return { id: `TX-${2040 + index}`, applicantId: index % 2 ? "LN-102" : "LN-101", module: index % 2 ? "storage" : "market",
    reference: index % 2 ? `BOOK-${800 + index}` : `ORDER-${800 + index}`, date, payer: "Green Basket Co.", payee: index % 2 ? "Harvest Hub" : "Kavindu Silva",
    gross: 40000 + index * 3200, fee: 400 + index * 32, status, paymentRef: `DEMO-PAY-${2040 + index}`,
    dispute: status === "Refunded" ? `CASE-${index + 101}` : undefined,
    events: [{ date, action: "Payment received and held in escrow" }, ...(status !== "Held" ? [{ date: date.replace(/T\d\d:/, "T16:"), action: status === "Settled" ? "Receipt confirmed; escrow released and net amount settled" : "Dispute reviewed; full gross amount refunded; fee reversed" }] : [])] };
});
export function aggregateTransactions(records: Transaction[], days: number, end: string) {
  const endTime = Date.parse(end.slice(0, 10) + "T00:00:00Z");
  return Array.from({ length: days }, (_, i) => {
    const date = new Date(endTime - (days - 1 - i) * 86400000).toISOString().slice(0, 10);
    const rows = records.filter(row => row.date.slice(0, 10) === date);
    const completed = rows.filter(row => row.status === "Settled");
    const value = completed.reduce((sum, row) => sum + row.gross, 0);
    return { date, value, count: completed.length, average: completed.length ? value / completed.length : 0,
      held: rows.filter(row => row.status === "Held").reduce((sum, row) => sum + row.gross, 0),
      refunded: rows.filter(row => row.status === "Refunded").reduce((sum, row) => sum + row.gross, 0) };
  });
}
export type Plot = { id: string; plan: string; farmer: string; location: string; acres: number; crop: string; yieldKg: number; harvest: string; fit: number; confidence: number; soil: string; irrigation: string; ownership: string; suitability: string };
export const plots: Plot[] = [
  { id: "LD-018", plan: "PL-017", farmer: "Kavindu Silva", location: "Mawathagama", acres: 2, crop: "Tomato", yieldKg: 4800, harvest: "2026-11-28", fit: 96, confidence: 87, soil: "Sandy loam, pH 6.5", irrigation: "Drip", ownership: "Verified", suitability: "Pending" },
  { id: "LD-012", plan: "PL-020", farmer: "Asha Fernando", location: "Matale", acres: 1.5, crop: "Chilli", yieldKg: 2200, harvest: "2026-12-12", fit: 89, confidence: 81, soil: "Loam, pH 6.2", irrigation: "Well water", ownership: "Pending", suitability: "Pending" },
  { id: "LD-027", plan: "PL-023", farmer: "Ruwan Fernando", location: "Polgahawela", acres: 3, crop: "Rice", yieldKg: 6500, harvest: "2026-12-20", fit: 91, confidence: 84, soil: "Clay loam, pH 6.0", irrigation: "Canal", ownership: "Pending", suitability: "Pending" },
];
export type LandReview = { ownership: string; suitability: string; note: string; actor: string; date: string };
export function reviewLand(previous: LandReview, action: string, note: string, date: string): LandReview {
  if (["Reject ownership", "Reject suitability", "Request information"].includes(action) && !note.trim()) throw new Error("Add a reason before recording this decision.");
  if (action === "Approve suitability" && previous.ownership !== "Verified") throw new Error("Verify ownership before approving suitability.");
  const next = { ...previous, note: note.trim(), actor: "Land Registration Officer", date };
  if (action === "Verify ownership") next.ownership = "Verified";
  else if (action === "Reject ownership") { next.ownership = "Rejected"; next.suitability = "Pending"; }
  else if (action === "Approve suitability") next.suitability = "Approved";
  else if (action === "Reject suitability") next.suitability = "Rejected";
  else if (action === "Request information") { next.ownership = "Information requested"; next.suitability = "Pending"; }
  else throw new Error("Unknown review action.");
  return next;
}
export type StockDay = { date: string; incoming: number; outgoing: number };
export const stockDays: StockDay[] = Array.from({ length: 7 }, (_, i) => ({ date: `2026-10-${14 + i}`, incoming: [0.8, 0.6, 1.1, 0.7, 0.9, 0.8, 1.2][i], outgoing: [0.5, 0.4, 0.7, 0.4, 0.6, 0.5, 0.8][i] }));
export function forecastStock(current: number, capacity: number, history: StockDay[], horizon = 14) {
  if (history.length < 7) return null;
  const recent = history.slice(-7);
  const incoming = recent.reduce((sum, row) => sum + row.incoming, 0) / 7;
  const outgoing = recent.reduce((sum, row) => sum + row.outgoing, 0) / 7;
  return Array.from({ length: horizon }, (_, i) => {
    const projected = current + (incoming - outgoing) * (i + 1);
    return { day: i + 1, incoming, outgoing, projected, available: capacity - projected, shortage: Math.max(0, projected - capacity), stockout: Math.max(0, -projected) };
  });
}
export function appendActivity(events: ActivityEvent[], event: ActivityEvent) {
  return events.some(row => row.id === event.id) ? events : [...events, event];
}
export const money = (value: number) => "LKR " + value.toLocaleString("en-LK", { maximumFractionDigits: 2 });

