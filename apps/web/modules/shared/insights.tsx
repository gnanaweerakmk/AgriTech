"use client";
import Link from "next/link";
import { flows } from "../../lib/preview";
import { useEffect, useState } from "react";
import { aggregateTransactions, transactions, money, stockDays, forecastStock, type ActivityEvent, type DemoDocument, type Module, type Transaction } from "../../lib/demo-model";
import { Metrics, Panel, ReportButton, Table, useDemoState } from "./ui";

export function ActivityHistory({ module, section, reference }: { module: Module; section?: string; reference?: string }) {
  const [events] = useDemoState<ActivityEvent[]>("activity-events", []);
  const [query, setQuery] = useState(""); const [action, setAction] = useState("");
  const [from, setFrom] = useState(""); const [to, setTo] = useState("");
  const scoped = events.filter(event => event.module === module && (!section || event.section === section) && (!reference || event.reference === reference));
  const filtered = scoped.filter(event => (!action || event.action === action) && (!from || event.date.slice(0, 10) >= from) && (!to || event.date.slice(0, 10) <= to) && [event.reference, event.actor, event.action, event.notes].join(" ").toLowerCase().includes(query.toLowerCase())).slice().reverse();
  const columns = ["Date / time", "Actor", "Action", "Record", "Previous", "Updated", "Notes"];
  return <Panel title={reference ? `History · ${reference}` : section ? `${(flows[module].screens as Record<string, string>)[section] ?? section} · History` : "Activity history"}>
    <p className="muted">Changes recorded in this browser. Financial transactions are shown separately from activity.</p>
    <div className="filter-row"><label>Search history<input value={query} onChange={e => setQuery(e.target.value)} placeholder="Record, action or person" /></label>
      <label>Action<select value={action} onChange={e => setAction(e.target.value)}><option value="">All actions</option>{[...new Set(scoped.map(e => e.action))].map(a => <option key={a}>{a}</option>)}</select></label>
      <label>From<input type="date" value={from} onChange={e => setFrom(e.target.value)} /></label><label>To<input type="date" value={to} onChange={e => setTo(e.target.value)} /></label></div>
    <Table columns={columns} rows={filtered.map(e => [new Date(e.date).toLocaleString("en-GB", { timeZone: "Asia/Colombo" }), e.actor, e.action, <Link href={e.href}>{e.reference}</Link>, <span className="cell-wrap">{e.before}</span>, <span className="cell-wrap">{e.after}</span>, <span className="cell-wrap">{e.notes}</span>])} />
    {!!filtered.length && <ReportButton name="agritech-activity" rows={[columns, ...filtered.map(e => [e.date, e.actor, e.action, e.reference, e.before, e.after, e.notes])]}>Export activity</ReportButton>}
  </Panel>;
}

export function useTransactions() {
  const [purchases] = useDemoState<Record<string, string>>("market-orders", {});
  const [booking] = useDemoState("transport-booking", "Draft");
  const [lease] = useDemoState("lease-payment", "Pending");
  const [events] = useDemoState<ActivityEvent[]>("activity-events", []);
  const extra: Transaction[] = [];
  const make = (id: string, module: Module, reference: string, gross: number, status: Transaction["status"], payer: string, payee: string) => {
    const event = events.slice().reverse().find(e => e.module === module && (e.reference === reference || e.reference === (module === "transport" ? "transport-booking" : "lease-payment")));
    const date = event?.date ?? "2026-10-20T12:00:00+05:30";
    extra.push({ id, applicantId: "", module, reference, gross, fee: 0, status, payer, payee, date, paymentRef: id + "-PAY", events: [{ date, action: `Simulated payment ${status.toLowerCase()}` }] });
  };
  for (const [id, amount] of Object.entries(purchases)) make("DEMO-SALE-" + id, "market", id, Number(amount.replace(/[^\d.]/g, "")), "Held", "Green Basket Co.", "Demo seller");
  if (booking === "Payment verified") make("DEMO-TRANSPORT-2052", "transport", "SHP-2052", 8500, "Settled", "Green Basket Co.", "Transport provider");
  if (lease === "Verified") make("DEMO-LEASE-018", "cultivation", "LD-018", 30000, "Settled", "Kavindu Silva", "Demo landowner");
  return [...transactions, ...extra];
}

export function TransactionChart() {
  const records = useTransactions(); const [days, setDays] = useState(7); const [active, setActive] = useState<number | null>(null);
  const end = records.reduce((latest, row) => row.date.slice(0, 10) > latest ? row.date.slice(0, 10) : latest, "2026-10-20");
  const points = aggregateTransactions(records, days, end);
  const total = points.reduce((sum, point) => sum + point.value, 0); const count = points.reduce((sum, point) => sum + point.count, 0);
  const max = Math.max(1, ...points.map(p => p.value)); const x = (i: number) => 60 + i * 820 / (points.length - 1); const y = (value: number) => 195 - value / max * 155;
  const current = active === null ? undefined : points[active];
  return <Panel title="Transaction activity"><div className="heading"><div><p className="eyebrow">COMPLETED VALUE</p><h2 className="big-value">{money(total)}</h2><p className="muted">{count} settled transactions · {points[0].date} — {end}</p></div>
    <label>Period<select value={days} onChange={e => { setDays(Number(e.target.value)); setActive(null); }}><option value={7}>Last 7 days</option><option value={14}>Last 14 days</option><option value={30}>Last 30 days</option></select></label></div>
    <p className="muted">Hover, focus or tap a point for daily metrics. Amounts in LKR; dates use recorded transaction days.</p>
    <div className="chart-frame"><svg viewBox="0 0 930 235" role="group" aria-label="Completed transaction value in LKR by date">
      {[0, .5, 1].map(f => <g key={f}><line x1="60" x2="890" y1={y(max * f)} y2={y(max * f)} stroke="#dfe6df" /><text x="52" y={y(max * f) + 4} textAnchor="end">{Math.round(max * f / 1000)}k</text></g>)}
      <polyline points={points.map((p, i) => `${x(i)},${y(p.value)}`).join(" ")} stroke="#17603e" strokeWidth="3" fill="none" />
      {points.map((p, i) => <g key={p.date}><circle cx={x(i)} cy={y(p.value)} r={active === i ? 7 : 5} fill="#17603e" />
        <circle className="chart-target" tabIndex={0} role="button" aria-label={`${p.date}: ${money(p.value)}, ${p.count} settled transactions; average ${money(p.average)}; held ${money(p.held)}; refunded ${money(p.refunded)}`} cx={x(i)} cy={y(p.value)} r="13" fill="transparent" onMouseEnter={() => setActive(i)} onFocus={() => setActive(i)} onClick={() => setActive(i)} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setActive(i); } }} />
        {(i === 0 || i === points.length - 1 || (days <= 14 && i % 2 === 0)) && <text x={x(i)} y="222" textAnchor="middle">{p.date.slice(5)}</text>}</g>)}
    </svg></div>
    <div className="chart-readout" aria-live="polite">{current ? <><strong>{current.date}</strong><span>Completed {money(current.value)}</span><span>{current.count} transactions</span><span>Average {money(current.average)}</span><span>Held {money(current.held)}</span><span>Refunded {money(current.refunded)}</span></> : <span>Select any point to inspect its metrics.</span>}</div>
    <details><summary>View chart data as a table</summary><Table columns={["Date", "Completed value", "Count", "Average", "Held", "Refunded"]} rows={points.map(p => [p.date, money(p.value), p.count, money(p.average), money(p.held), money(p.refunded)])} /></details>
  </Panel>;
}

export function DocumentViewer({ documents }: { documents: DemoDocument[] }) {
  const [id, setId] = useState(documents[0]?.id ?? ""); const [failed, setFailed] = useState(false);
  const doc = documents.find(d => d.id === id) ?? documents[0];
  const previewUrl = doc?.type === "pdf" && doc.url.startsWith("/demo/") ? doc.url.replace(/\.pdf$/, ".png") : doc?.url;
  useEffect(() => { setFailed(false); if (!doc) return; let cancelled = false; fetch(doc.url, { method: "HEAD" }).then(r => { if (!cancelled && !r.ok) setFailed(true); }).catch(() => { if (!cancelled) setFailed(true); }); return () => { cancelled = true; }; }, [doc?.url]);
  if (!doc) return <p className="notice">No supporting documents attached. Request documents using the review form.</p>;
  return <div className="document-viewer"><div className="heading"><label>Document<select value={doc.id} onChange={e => { setId(e.target.value); setFailed(false); }}>{documents.map(d => <option value={d.id} key={d.id}>{d.title}</option>)}</select></label><a className="secondary" href={doc.url} download>Download document</a></div>
    <p className="muted">Illustrative document supplied with the demo.</p>
    {failed ? <p role="status" className="notice warn">Preview unavailable. Try the optional download or select another document.</p> : doc.type === "pdf" && !doc.url.startsWith("/demo/") ? <object key={doc.url} data={doc.url} type="application/pdf" aria-label={doc.title}><p>PDF preview is unavailable in this browser. Use Download document to view it.</p></object> : <div className="document-page"><img src={previewUrl} alt={doc.title} onError={() => setFailed(true)} />{doc.type === "pdf" && <small>Page 1 of 1 · PDF preview</small>}</div>}
    <details><summary>Having trouble viewing this document?</summary><p>Use the optional download above if your browser does not support inline previews.</p></details>
  </div>;
}

export function InventoryForecast({ compact = false }: { compact?: boolean }) {
  const [warehouse, setWarehouse] = useState("WH-008"); const [type, setType] = useState<"cold" | "dry">("cold");
  const [capacity] = useDemoState("warehouse-capacity", { name: "Dambulla Cold Store", cold: 10, dry: 20 });
  const [stock] = useDemoState("warehouse-stock", { cold: 6, dry: 12, moves: [] });
  const [changes] = useDemoState<{ date: string; type: string; incoming: number; outgoing: number }[]>("stock-changes", []);
  const relevant = changes.filter(c => c.type === type);
  const end = relevant.at(-1)?.date ?? "2026-10-20";
  // Days without movements are zero-flow days, never copies of older sample observations.
  const history = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(Date.parse(end + "T00:00:00Z") - (6 - i) * 86400000).toISOString().slice(0, 10);
    const observed = stockDays.find(day => day.date === date);
    return { date, incoming: (observed?.incoming ?? 0) * (type === "dry" ? 1.5 : 1), outgoing: (observed?.outgoing ?? 0) * (type === "dry" ? 1.5 : 1) };
  });
  for (const change of relevant) { const day = history.find(d => d.date === change.date); if (day) { day.incoming += change.incoming; day.outgoing += change.outgoing; } }
  const current = stock[type]; const limit = capacity[type];
  const forecast = forecastStock(current, limit, warehouse === "WH-008" ? history : []);
  const last = forecast?.at(-1); const breach = forecast?.find(p => p.shortage > 0 || p.stockout > 0);
  let balance = current;
  const past = history.slice().reverse().map(day => { const closing = balance; balance -= day.incoming - day.outgoing; return { ...day, closing }; }).reverse();
  const series = [...past.map(d => d.closing), ...(forecast?.map(p => p.projected) ?? [])];
  const min = Math.min(0, ...series), max = Math.max(limit, ...series, 1); const x = (i: number) => 55 + i * 825 / Math.max(1, series.length - 1); const y = (n: number) => 190 - (n - min) / (max - min) * 150;
  return <Panel title={compact ? "Inventory outlook" : "Inventory trends & forecast"}>
    <p className="eyebrow">ILLUSTRATIVE FORECAST · 14 DAYS</p>
    {!compact && <div className="filter-row"><label>Warehouse<select value={warehouse} onChange={e => setWarehouse(e.target.value)}><option value="WH-008">{capacity.name} · WH-008</option><option value="WH-021">Matale Agro Store · awaiting stock history</option></select></label><label>Storage type<select value={type} onChange={e => setType(e.target.value as "cold" | "dry")}><option value="cold">Cold storage</option><option value="dry">Dry storage</option></select></label></div>}
    {last ? <><Metrics items={[["Current stock", current.toFixed(2) + " t"], ["Projected in 14 days", last.projected.toFixed(2) + " t"], ["Capacity", limit.toFixed(2) + " t"], ["Projected free capacity", last.available.toFixed(2) + " t"]]} />
      <p className={"notice " + (breach ? "warn" : "good")}>{breach ? `Action needed: ${breach.shortage > 0 ? "capacity exceeded" : "stock exhausted"} from day ${breach.day}. ${last.shortage.toFixed(2)} t capacity shortage at day 14.` : "Projected stock stays within capacity for the next 14 days."}</p>
      {compact ? <Link className="text-button" href="/preview/storage/forecast">Explore inventory forecasts →</Link> : <>
        <div className="chart-frame"><svg viewBox="0 0 930 230" role="img" aria-label="Stock in tonnes: observed closing balance followed by a dashed 14-day projection"><line x1="55" x2="880" y1={y(limit)} y2={y(limit)} stroke="#b27625" strokeDasharray="4 4" /><text x="55" y={y(limit) - 7}>Capacity {limit} t</text>
          <polyline fill="none" stroke="#17603e" strokeWidth="3" points={past.map((p, i) => `${x(i)},${y(p.closing)}`).join(" ")} />
          <polyline fill="none" stroke="#17603e" strokeDasharray="6 5" strokeWidth="3" points={[current, ...forecast!.map(p => p.projected)].map((n, i) => `${x(i + 6)},${y(n)}`).join(" ")} />
          <text x="55" y="220">7 observed days</text><text x={x(6)} y="220">Now</text><text x="820" y="220">Day 14</text></svg></div>
        <p>Solid: sample observed stock · Dashed: projected stock · Dotted amber: capacity. All quantities in tonnes.</p>
        <details><summary>Forecast assumptions and observed movements</summary><p>Daily incoming/outgoing averages use the seven calendar days ending {end}. The demo starts with observed movements on 14–20 October; subsequent days without posted movements have zero flow. Current stock anchors the projection. Negative stock and capacity overruns remain visible. This is a planning illustration, not a trained AI model.</p><Table columns={["Date", "Incoming (t)", "Outgoing (t)", "Closing stock (t)"]} rows={past.map(p => [p.date, p.incoming.toFixed(2), p.outgoing.toFixed(2), p.closing.toFixed(2)])} /></details>
        <Table columns={["Forecast day", "Expected in (t)", "Expected out (t)", "Projected stock (t)", "Available (t)", "Capacity shortage (t)"]} rows={forecast!.map(p => [p.day, p.incoming.toFixed(2), p.outgoing.toFixed(2), p.projected.toFixed(2), p.available.toFixed(2), p.shortage.toFixed(2)])} />
      </>}
    </> : <p className="notice">Insufficient history. Seven observed days are needed before a forecast is shown for this warehouse.</p>}
  </Panel>;
}
