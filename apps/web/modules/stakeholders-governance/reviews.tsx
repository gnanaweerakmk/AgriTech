"use client";
import { useEffect, useState } from "react";
import { applicants, financialAccess, money, plots, reviewLand, type LandReview, type DemoDocument } from "../../lib/demo-model";
import { recordActivity } from "../../lib/demo-store";
import { ActivityHistory, DocumentViewer, useTransactions } from "../shared/insights";
import { DemoForm, Metrics, Panel, ReportButton, Status, Table, Tabs, useDemoState } from "../shared/ui";

function useSelection(initial: string) {
  const [selected, select] = useState(initial);
  useEffect(() => { const record = new URLSearchParams(window.location.search).get("record"); if (record) select(record); }, []);
  return [selected, select] as const;
}
export function BankReview() {
  const [selected, select] = useSelection("LN-101"); const [tab, setTab] = useState("Overview");
  const [decisions, save] = useDemoState<Record<string, string>>("loan-decisions", {});
  const applicant = applicants.find(a => a.id === selected) ?? applicants[0];
  const allowed = financialAccess(applicant); const records = useTransactions().filter(t => t.applicantId === applicant.id);
  const settled = records.filter(t => t.status === "Settled");
  const paid = settled.reduce((sum, t) => sum + t.gross - t.fee, 0);
  const overdue = applicant.loans.reduce((sum, loan) => sum + loan.overdue, 0);
  return <>
    <Panel title="Loan applications"><p className="muted">Select an applicant to review their supporting records without leaving the dashboard.</p>
      <Table columns={["Application", "Applicant", "Requested", "Data consent", "Review status"]} selected={applicants.indexOf(applicant)} rows={applicants.map(a => [<button className="text-button" onClick={() => { select(a.id); setTab("Overview"); }}>{a.id}</button>, a.name, money(a.amount), a.consent ? "Granted · demo" : "Not granted", <Status>{decisions[a.id] ?? "Awaiting review"}</Status>])} />
    </Panel>
    <Panel title={`${applicant.name} · ${applicant.id}`}><div className="heading"><p>{applicant.purpose}</p><Status>{decisions[applicant.id] ?? "Awaiting review"}</Status></div>
      <Tabs items={["Overview", "Documents", "Loan History", "AgriTech Activity", "Credit Assessment", "History"]} active={tab} onChange={setTab} />
      {tab === "Overview" && <Metrics items={[["Requested finance", money(applicant.amount)], ["Data access", allowed ? "Consented" : "Not consented"], ["Assessment", allowed && applicant.assessment ? `${applicant.assessment.score}/100 · illustrative` : "Unavailable"]]} />}
      {!allowed && tab !== "Overview" && tab !== "History" ? <p className="notice warn">The applicant has not granted access to financial records or documents. Request consent before reviewing these sections.</p> : <>
        {tab === "Documents" && <DocumentViewer key={applicant.id} documents={applicant.documents} />}
        {tab === "Loan History" && <><Metrics items={[["Past / current loans", String(applicant.loans.length)], ["Outstanding balance", money(applicant.loans.reduce((sum, l) => sum + l.balance, 0))], ["Overdue installments", String(overdue)]]} /><Table columns={["Loan", "Lender", "Start", "Due", "Principal", "Outstanding", "Status", "Overdue installments"]} rows={applicant.loans.map(l => [l.id, l.lender, l.start, l.due, money(l.principal), money(l.balance), l.status, l.overdue])} /></>}
        {tab === "AgriTech Activity" && <><Metrics items={[["Transactions", String(records.length)], ["Settled earnings", money(paid)], ["Settled / all payments", records.length ? `${Math.round(settled.length / records.length * 100)}%` : "No history"], ["Refunds / disputes", String(records.filter(t => t.dispute).length)]]} /><p className="muted">Payment completion measures platform settlements; loan repayment history is shown separately.</p><Table columns={["Date", "Transaction", "Activity", "Amount", "Status"]} rows={records.map(t => [t.date.slice(0, 10), <a href={`/preview/governance/ledger?record=${t.id}`}>{t.id}</a>, t.reference, money(t.gross), t.status])} /></>}
        {tab === "Credit Assessment" && (applicant.assessment ? <div className="assessment"><div className="score"><strong>{applicant.assessment.score}</strong><span>/ 100</span></div><div><h3>Illustrative AI credit assessment</h3><p>Sample assessment · 20 Oct 2026 · Fixture model v1</p><p className="muted">This is a matched sample model response, not a live prediction or lending decision.</p><ul>{applicant.assessment.factors.map(f => <li key={f}>{f}</li>)}</ul><div className="links"><button className="secondary" onClick={() => setTab("Loan History")}>Review repayment evidence</button><button className="secondary" onClick={() => setTab("AgriTech Activity")}>Review platform activity</button></div></div></div> : <p className="notice">Insufficient history. No score is available for this applicant.</p>)}
      </>}
      {tab === "History" && <ActivityHistory module="governance" reference={applicant.id} />}
      <details><summary>Record officer review or request documents</summary><DemoForm key={applicant.id} id={`loan-review:${applicant.id}`} fields={[["Officer review note", "", "textarea"]]} actions={["Record review", "Request supporting documents", ...(!allowed ? ["Request data consent"] : [])]} onSubmit={(action, values) => {
        const next = action === "Record review" ? "Reviewed" : action === "Request data consent" ? "Consent requested" : "Documents requested";
        if (action === "Record review" && !allowed) return "Data-access consent is required before recording a financial review.";
        save({ ...decisions, [applicant.id]: next });
        recordActivity({ module: "governance", section: "applications", reference: applicant.id, actor: "Bank Officer", action: "Review note", before: decisions[applicant.id] ?? "Awaiting review", after: next, notes: values["Officer review note"], href: `/preview/governance/applications?record=${applicant.id}` });
        return "Review saved in this demo.";
      }} /></details>
    </Panel>
  </>;
}

export function Ledger() {
  const records = useTransactions(); const [selected, select] = useSelection("TX-2041"); const [query, search] = useState("");
  const [status, setStatus] = useState(""); const [module, setModule] = useState(""); const [from, setFrom] = useState(""); const [to, setTo] = useState("");
  const [notes, saveNotes] = useDemoState<Record<string, string>>("auditor-notes", {});
  const rows = records.filter(t => (!status || t.status === status) && (!module || t.module === module) && (!from || t.date.slice(0, 10) >= from) && (!to || t.date.slice(0, 10) <= to) && [t.id, t.reference, t.payer, t.payee].join(" ").toLowerCase().includes(query.toLowerCase()));
  const transaction = rows.find(t => t.id === selected) ?? rows[0];
  const headings = ["Transaction", "Date", "Module", "Payer", "Payee", "Reference", "Gross", "Fee", "Net", "Status", "Payment reference", "Dispute"];
  const exportRow = (t: typeof records[number]) => [t.id, t.date, t.module, t.payer, t.payee, t.reference, t.gross, t.status === "Refunded" ? 0 : t.fee, t.status === "Refunded" ? 0 : t.gross - t.fee, t.status, t.paymentRef, t.dispute ?? "None"];
  return <><Panel title="Platform transaction ledger"><p className="muted">Read-only sample financial records across the platform. Review notes are recorded separately.</p>
    <div className="filter-row"><label>Search transactions<input value={query} onChange={e => search(e.target.value)} placeholder="Reference or counterparty" /></label><label>Status<select value={status} onChange={e => setStatus(e.target.value)}><option value="">All statuses</option>{["Settled", "Held", "Refunded"].map(s => <option key={s}>{s}</option>)}</select></label><label>Module<select value={module} onChange={e => setModule(e.target.value)}><option value="">All modules</option>{["market", "storage", "transport", "cultivation"].map(s => <option key={s}>{s}</option>)}</select></label><label>From<input type="date" value={from} onChange={e => setFrom(e.target.value)} /></label><label>To<input type="date" value={to} onChange={e => setTo(e.target.value)} /></label></div>
    <div className="ledger-list"><Table columns={["Transaction", "Date", "Parties", "Module / reference", "Gross", "Status"]} rows={rows.map(t => [<button className="text-button" onClick={() => select(t.id)}>{t.id}</button>, t.date.slice(0, 10), <>{t.payer}<small>to {t.payee}</small></>, <>{t.module}<small>{t.reference}</small></>, money(t.gross), <Status>{t.status}</Status>])} selected={transaction ? rows.indexOf(transaction) : undefined} /></div>
    {!!rows.length && <ReportButton name="agritech-full-ledger" rows={[headings, ...rows.map(exportRow)]}>Export detailed ledger</ReportButton>}
  </Panel>{transaction && <Panel title={`${transaction.id} · Transaction details`}>
    <Metrics items={[["Gross", money(transaction.gross)], ["Fee", money(transaction.status === "Refunded" ? 0 : transaction.fee)], [transaction.status === "Held" ? "Net held" : "Net settled", money(transaction.status === "Refunded" ? 0 : transaction.gross - transaction.fee)], ["Escrow status", transaction.status]]} />
    <Table columns={["Field", "Details"]} rows={[["Payer → Payee", `${transaction.payer} → ${transaction.payee}`], ["Origin / reference", `${transaction.module} / ${transaction.reference}`], ["Payment reference", transaction.paymentRef], ["Created", transaction.date], ["Settlement", transaction.status === "Settled" ? `${money(transaction.gross - transaction.fee)} to ${transaction.payee}; account ending 0421 (sample)` : "Not settled"], ["Refund", transaction.status === "Refunded" ? `${money(transaction.gross)} returned; fee reversed` : "None"], ["Associated dispute", transaction.dispute ?? "None"]]} />
    <ol className="timeline">{transaction.events.map((e, i) => <li key={i}><time>{e.date}</time><strong>{e.action}</strong></li>)}</ol>
    <ReportButton name={`${transaction.id}-receipt`} rows={[headings, exportRow(transaction), [], ["Event date", "Event"], ...transaction.events.map(e => [e.date, e.action])]}>Download sample receipt (CSV)</ReportButton>
    <DemoForm key={transaction.id} id={`audit-note:${transaction.id}`} fields={[["Auditor note", notes[transaction.id] ?? "", "textarea"]]} actions={["Save review note"]} onSubmit={(_, values) => { saveNotes({ ...notes, [transaction.id]: values["Auditor note"] }); return "Review note saved. Financial records are unchanged."; }} />
    <ActivityHistory module="governance" reference={transaction.id} />
  </Panel>}</>;
}

const plotDocuments = (id: string): DemoDocument[] => [{ id: id + "-deed", title: `Sample deed · ${id}`, url: `/demo/${id}-deed.pdf`, type: "pdf" }, { id: id + "-survey", title: `Survey plan · ${id}`, url: `/demo/${id}-survey.svg`, type: "image" }];
export function Agriculture() {
  const [selected, select] = useSelection("LD-018"); const [query, search] = useState("");
  const [reviews, save] = useDemoState<Record<string, string>>("authority-reviews", {});
  const [submitted] = useDemoState<string[][]>("cultivation-plans", []);
  const rows = plots.filter(p => [p.id, p.farmer, p.location, p.crop].join(" ").toLowerCase().includes(query.toLowerCase()));
  const plot = rows.find(p => p.id === selected) ?? rows[0];
  return <><Panel title="Agriculture Department · Cultivation overview"><label>Search plots<input value={query} onChange={e => search(e.target.value)} placeholder="Plot, farmer, crop or location" /></label>
    <Table columns={["Plot / plan", "Farmer", "Location", "Area", "Crop", "Predicted yield", "Harvest date", "Soil fit / confidence", "Plan status"]} selected={plot ? rows.indexOf(plot) : undefined} rows={rows.map(p => [<button className="text-button" onClick={() => select(p.id)}>{p.id}<small>{p.plan}</small></button>, p.farmer, p.location, `${p.acres} acres`, p.crop, `${p.yieldKg.toLocaleString()} kg`, p.harvest, `${p.fit}% / ${p.confidence}%`, <Status>{reviews[p.plan] ?? "Pending officer review"}</Status>])} />
    <p className="muted">Yield, harvest dates, fit and confidence are illustrative model outputs for these sample plots.</p>
  </Panel>{plot && <Panel title={`${plot.id} · ${plot.crop} cultivation`}>
    <Metrics items={[["Area", `${plot.acres} acres`], ["Predicted yield", `${plot.yieldKg.toLocaleString()} kg`], ["Expected harvest", plot.harvest]]} />
    <p>Prediction inputs: {plot.soil}; {plot.irrigation.toLowerCase()} irrigation; {plot.location} regional growing conditions; crop and cultivated area. Sample prediction dated 20 Oct 2026.</p>
    <details><summary>View land documents</summary><DocumentViewer key={plot.id} documents={plotDocuments(plot.id)} /></details>
    <DemoForm key={plot.id} id={`agriculture:${plot.plan}`} fields={[["Officer review note", "", "textarea"]]} actions={["Approve Plan", "Request revision", "Reject Plan"]} onSubmit={(action, values) => { if (!values["Officer review note"].trim()) return "Provide a review note."; const state = action === "Approve Plan" ? "Approved" : action === "Reject Plan" ? "Rejected" : "Revision requested"; save({ ...reviews, [plot.plan]: state }); recordActivity({ module: "governance", section: "plans", reference: plot.id, action, actor: "Agriculture Officer", before: reviews[plot.plan] ?? "Pending officer review", after: state, notes: values["Officer review note"], href: `/preview/governance/plans?record=${plot.id}` }); return "Cultivation decision recorded."; }} />
    <ActivityHistory module="governance" reference={plot.id} />
  </Panel>}{!!submitted.length && <Panel title="New plans submitted from Crop & Land"><Table columns={["Plot", "Crop", "Planting date", "Review"]} rows={submitted.map(([id, crop, date, state], i) => [id, crop, date, <><Status>{reviews[`SUB-${i}`] ?? state}</Status><DemoForm id={`submitted-plan:${i}`} fields={[["Review note", "", "textarea"]]} actions={["Approve Plan", "Request revision", "Reject Plan"]} onSubmit={(action) => { save({ ...reviews, [`SUB-${i}`]: action === "Approve Plan" ? "Approved" : action === "Reject Plan" ? "Rejected" : "Revision requested" }); return "Submitted plan reviewed."; }} /></>])} /><p className="muted">New submissions have no prediction until an assessment is available.</p></Panel>}</>;
}

export function LandAuthority() {
  const [selected, select] = useSelection("LD-018"); const [reviews, save] = useDemoState<Record<string, LandReview>>("land-reviews-v2", {});
  const [legacyChecks] = useDemoState("authority-checks", { ownership: false, suitability: false });
  const [note, setNote] = useState(""); const [message, setMessage] = useState("");
  const plot = plots.find(p => p.id === selected) ?? plots[0];
  const stateFor = (p: typeof plot): LandReview => reviews[p.id] ?? { ownership: p.id === "LD-027" && legacyChecks.ownership ? "Verified" : p.ownership, suitability: p.id === "LD-027" && legacyChecks.ownership && legacyChecks.suitability ? "Approved" : p.suitability, note: "", date: "", actor: "" };
  const current = stateFor(plot);
  function decide(action: string) { try { const next = reviewLand(current, action, note, new Date().toISOString()); save({ ...reviews, [plot.id]: next }); setMessage(`${action} recorded for ${plot.id}.`); setNote(""); } catch (e) { setMessage((e as Error).message); } }
  return <><Panel title="Land Registration Authority · Verification queue"><Table columns={["Plot", "Applicant", "Location", "Area", "Ownership", "Suitability"]} selected={plots.indexOf(plot)} rows={plots.map(p => [<button className="text-button" onClick={() => { select(p.id); setNote(""); setMessage(""); }}>{p.id}</button>, p.farmer, p.location, `${p.acres} acres`, <Status>{stateFor(p).ownership}</Status>, <Status>{stateFor(p).suitability}</Status>])} /></Panel>
    <Panel title={`${plot.id} · Ownership & land suitability`}><p>{plot.farmer} · {plot.location} · {plot.acres} acres</p>
      <DocumentViewer key={plot.id} documents={plotDocuments(plot.id)} />
      <div className="split"><div className="review-step"><p className="eyebrow">01 · OWNERSHIP</p><h3>{current.ownership}</h3><p>Review the sample deed and survey against the applicant and plot.</p></div><div className="review-step"><p className="eyebrow">02 · SUITABILITY</p><h3>{current.suitability}</h3><p>{plot.soil} · {plot.irrigation}. Assess agricultural use separately from title verification.</p></div></div>
      <label>Review note / decision reason<textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Required for rejection or an information request" /></label>
      <div className="links">{["Verify ownership", "Approve suitability", "Request information", "Reject ownership", "Reject suitability"].map(action => <button className={action === "Verify ownership" || action === "Approve suitability" ? "button" : "secondary"} key={action} disabled={action === "Approve suitability" && current.ownership !== "Verified"} onClick={() => decide(action)}>{action}</button>)}</div>
      {current.ownership !== "Verified" && <p className="muted">Suitability approval becomes available after ownership is verified.</p>}
      {message && <p role="status">{message}</p>}
      {current.date && <p className="notice">Last decision: {current.actor} · {new Date(current.date).toLocaleString("en-GB", { timeZone: "Asia/Colombo" })}<br />{current.note || "No additional note"}</p>}
      <ActivityHistory module="governance" reference={plot.id} />
    </Panel></>;
}
