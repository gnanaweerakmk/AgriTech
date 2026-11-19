"use client";

import Link from "next/link";
import { BankReview, Ledger, Agriculture, LandAuthority } from "./reviews";
import { ActivityHistory, InventoryForecast, TransactionChart, useTransactions } from "../shared/insights";
import { useState } from "react";
import { previewPath, flows } from "../../lib/preview";
import { DemoForm, Metrics, Panel, ReportButton, Status, Table, Tabs, useDemoState } from "../shared/ui";

const applicants = [
  ["AGR-1024", "Nimal Perera", "nimal.perera@example.com", "Farmer, Land Owner", "2 documents", "20 Oct 2026"],
  ["AGR-1025", "Asha Silva", "asha.silva@example.com", "Driver", "2 documents", "20 Oct 2026"],
  ["AGR-1026", "Greenfield Inputs", "hello@greenfield.example.com", "Input Manufacturer", "3 documents", "19 Oct 2026"],
  ["AGR-1027", "Sahan Dias", "sahan.dias@example.com", "Vehicle Owner", "2 documents", "19 Oct 2026"],
  ["AGR-1028", "Harvest Hub", "team@harvest.example.com", "Economic Center", "3 documents", "18 Oct 2026"],
  ["AGR-1029", "Maya Fernando", "maya.fernando@example.com", "Individual Buyer", "1 document", "18 Oct 2026"],
];
const cases = [
  ["ESC-2041", "TXN-8872", "Green Basket Market / Dilhani Farm", "Quality mismatch", "LKR 125,000", "Under review", "R. Jayasinghe"],
  ["ESC-2038", "TXN-8795", "Kandy Fresh / Southern Growers", "Delivery issue", "LKR 96,000", "Awaiting evidence", "P. Senanayake"],
  ["ESC-2036", "TXN-8781", "Ceylon Foods / Rowan Fernando", "Payment anomaly", "LKR 63,500", "Escalated", "R. Jayasinghe"],
];
const alerts = [
  ["AI-0842", "Ceylon Foods · TXN-8781", "Unusual payment pattern", "High", "94%", "Open"],
  ["AI-0840", "Lakpura Traders · ACC-1192", "Potential duplicate business identity", "High", "91%", "Open"],
  ["AI-0839", "Uva Harvest · LST-4406", "Listing price outside seasonal range", "Medium", "82%", "Open"],
  ["AI-0837", "Ruhuna Produce · LST-4360", "Repeated listing update", "Low", "65%", "Cleared"],
];
const money = (amount: number) => "LKR " + amount.toLocaleString("en-LK");

function Dashboard() {
  const [reviews] = useDemoState<Record<string, string>>("registration-status", {});
  const [submissions] = useDemoState<string[][]>("registration-submissions", []);
  const [disputes] = useDemoState<Record<string, string>>("case-status", {});
  const [investigations] = useDemoState<Record<string, string>>("ai-status", {});
  const pending = [...applicants, ...submissions].filter(([id]) => reviews[id] !== "Active").length;
  return <>
    <Metrics items={[["Registered accounts", "1,248"], ["Pending registrations", String(pending)],
      ["Open escrow disputes", String(3 - Object.values(disputes).filter(s => s === "Resolved").length)],
      ["Open AI Investigations", String(3 - alerts.slice(0, 3).filter(([id]) => investigations[id] === "Cleared").length)]]} />
    <TransactionChart />
    <InventoryForecast compact />

  </>;
}

function Registration() {
  const [active, select] = useState<string | null>(null);
  const [doc, setDoc] = useState("NIC_sample.pdf");
  const [roles, setRoles] = useState<string[]>([]);
  const [status, setStatus] = useDemoState<Record<string, string>>("registration-status", {});
  const [assignedRoles, saveRoles] = useDemoState<Record<string, string[]>>("assigned-roles", {});
  const [subview, setSubview] = useState("Queue");
  const [message, setMessage] = useState("");
  const [submissions] = useDemoState<string[][]>("registration-submissions", []);
  const queue = [...applicants, ...submissions];
  const applicant = queue.find(([id]) => id === active);
  const available = ["Farmer", "Land Owner", "Driver", "Vehicle Owner", "Individual Buyer", "Input Manufacturer", "Economic Center", "Value-Addition Factory"];
  return <>
    <Tabs items={["Queue", "Admin Directory", "Role Templates", "Policy Rules", "Audit Logs"]} active={subview} onChange={setSubview} />
    {subview === "Queue" && <>
      <h2>Pending registrations</h2>
      <Table columns={["Applicant", "Status", "Requested roles", "Documents", "Submitted"]}
        selected={applicant ? queue.indexOf(applicant) : undefined}
        rows={queue.map(([id, name, email, requested, count, date]) => [
          <><button className="text-button" onClick={() => {
            select(id); setRoles(assignedRoles[id] ?? requested.split(", ")); setDoc("NIC_sample.pdf"); setMessage("");
          }}>{name}</button><small>{email}</small></>,
          <Status tone={status[id] === "Active" ? "good" : ""}>{status[id] ?? "Pending"}</Status>, requested, count, date,
        ])} />
      {applicant && <Panel title={applicant[1] + " - Document preview"}>
        <small>{applicant[0]}</small>
        <Tabs items={["NIC_sample.pdf", ...(applicant[3].includes("Land Owner") ? ["Land_Deed_sample.pdf"] : ["Role_Evidence_sample.pdf"])]} active={doc} onChange={setDoc} />
        <div className="detail-doc"><article><h3>{doc.includes("Deed") ? "LAND OWNERSHIP DEED" : doc.includes("NIC") ? "IDENTITY DOCUMENT" : "ROLE EVIDENCE"}</h3><hr /><small>SAMPLE DOCUMENT</small></article></div>
        <h3>Assign roles</h3><div className="tabs">{available.map(role => <button type="button" className="secondary" key={role}
          aria-pressed={roles.includes(role)} onClick={() => setRoles(roles.includes(role) ? roles.filter(value => value !== role) : [...roles, role])}>{role}</button>)}</div>
        <button className="secondary" onClick={() => {
          setStatus({ ...status, [applicant[0]]: "Missing details" }); setMessage("Missing-details request recorded in the demo.");
        }}>Send Email Regarding Missing Details</button>
        <button className="button" disabled={!roles.length} onClick={() => {
          saveRoles({ ...assignedRoles, [applicant[0]]: roles });
          setStatus({ ...status, [applicant[0]]: "Active" }); setMessage("Sample account activated with the selected roles.");
        }}>Approve &amp; Activate</button>
        <p role="status">{message}</p>
      </Panel>}
    </>}
    {subview === "Admin Directory" && <><p>Review sample administrator and stakeholder accounts.</p><div><Link className="button" href={previewPath("governance", "identity")}>Open Keycloak Admin</Link></div></>}
    {subview === "Role Templates" && <Table columns={["Role template", "Assignment"]} rows={available.map(role => [role, "Requires registration review"])} />}
    {subview === "Policy Rules" && <Panel title="Registration policy"><p>Review the applicant’s supporting documents and assign the appropriate roles before activation.</p></Panel>}
    {subview === "Audit Logs" && <Table columns={["Applicant", "Decision"]} rows={Object.entries(status)} />}
  </>;
}

function Disputes() {
  const [active, select] = useState(cases[0][0]);
  const [filter, setFilter] = useState("Open disputes");
  const [query, search] = useState("");
  const [states, save] = useDemoState<Record<string, string>>("case-status", {});
  const filtered = cases.filter(row => row.join(" ").toLowerCase().includes(query.trim().toLowerCase())
    && (filter === "All cases" || (filter === "Resolved") === (states[row[0]] === "Resolved")));
  const current = filtered.find(row => row[0] === active) ?? filtered[0];
  const resolved = cases.filter(([id]) => states[id] === "Resolved").length;
  const held = cases.filter(([id]) => states[id] !== "Resolved").reduce((total, row) => total + Number(row[4].replace(/[^0-9]/g, "")), 0);
  return <>
    <Metrics items={[["Open disputes", String(cases.length - resolved)], ["Funds held in dispute", money(held)], ["Resolved this month", String(18 + resolved)]]} />
    <div className="heading"><Tabs items={["Open disputes", "Resolved", "All cases"]} active={filter} onChange={setFilter} />
      <label>Search cases<input type="search" placeholder="Case or transaction" value={query} onChange={event => search(event.target.value)} /></label></div>
    <Table columns={["Case / transaction", "Buyer / Seller", "Amount held", "Status", "Assigned to", "Action"]}
      selected={current ? filtered.indexOf(current) : undefined}
      rows={filtered.map(([id, txn, parties, reason, amount, state, assignee]) => [
        <>{id} · {txn}<small>{reason}</small></>, parties, amount, <Status tone={states[id] === "Resolved" ? "good" : "warn"}>{states[id] ?? state}</Status>,
        assignee, <button className="text-button" onClick={() => select(id)}>Review {id}</button>,
      ])} />
    {current && <Panel title={current[0] + " · " + current[3]}>
      <p>{current[2]} · {current[4]} · {states[current[0]] ?? current[5]}</p>
      <div className="tabs"><Status>Delivery photos</Status><Status>QR handover log</Status><Status>Invoice attached</Status></div>
      <DemoForm key={current[0]} id={"dispute:" + current[0]} fields={[["Resolution notes", "", "textarea"]]}
        actions={["Record resolution", "Request evidence"]} onSubmit={action => {
          save({ ...states, [current[0]]: action === "Record resolution" ? "Resolved" : "Awaiting evidence" });
          return "Case updated in the demo.";
        }} />
    </Panel>}
  </>;
}

function Investigations() {
  const [active, select] = useState(alerts[0][0]);
  const [filter, setFilter] = useState("Open alerts");
  const [states, save] = useDemoState<Record<string, string>>("ai-status", {});
  const filtered = alerts.filter(row => filter === "All alerts" || (filter === "Cleared") === ((states[row[0]] ?? row[5]) === "Cleared"));
  const current = filtered.find(row => row[0] === active) ?? filtered[0];
  const open = alerts.filter(row => (states[row[0]] ?? row[5]) !== "Cleared");
  return <>
    <Metrics items={[["Open investigations", String(open.length)], ["High-risk alerts", String(open.filter(row => row[3] === "High").length)], ["Cleared", String(alerts.length - open.length)]]} />
    <Tabs items={["Open alerts", "Cleared", "All alerts"]} active={filter} onChange={setFilter} />
    <Table columns={["Alert", "Entity / signal", "Risk", "Confidence", "Status", "Action"]}
      selected={current ? filtered.indexOf(current) : undefined}
      rows={filtered.map(([id, entity, signal, risk, confidence, state]) => [
        id, <><strong>{entity}</strong><small>{signal}</small></>, <Status tone={risk === "High" ? "bad" : "warn"}>{risk}</Status>,
        confidence, states[id] ?? state, <button className="text-button" onClick={() => select(id)}>Review {id}</button>,
      ])} />
    {current && <Panel title={current[0] + " · " + current[2]}>
      <label>Illustrative model confidence · {current[4]}<progress value={parseInt(current[4], 10)} max={100} /></label>
      <p className="notice warn">Verify the underlying records before recording an investigation finding.</p>
      <DemoForm key={current[0]} id={"ai:" + current[0]} fields={[["Review note", "", "textarea"]]}
        actions={["Escalate for review", "Mark false positive"]} onSubmit={action => {
          save({ ...states, [current[0]]: action === "Mark false positive" ? "Cleared" : "Escalated" });
          return "Investigation decision recorded in the demo.";
        }} />
    </Panel>}
  </>;
}

const directory = [
  ["R. Jayasinghe", "r.jayasinghe@agritech.lk", "Super Admin", "Active", "Enabled"],
  ["P. Senanayake", "p.senanayake@agritech.lk", "Operations Admin", "Active", "Enabled"],
  ["Nimal Perera", "nimal.perera@example.com", "Not assigned", "Pending", "Not enrolled"],
  ["Lakpura Traders", "accounts@lakpura.example.com", "Exporter", "Active", "Not enrolled"],
  ["Dinesh Kumara", "dinesh.kumara@example.com", "Individual Buyer", "Suspended", "Not enrolled"],
];
function Identity() {
  const [tab, setTab] = useState("Users");
  const [selected, select] = useState(directory[2][0]);
  const [states, save] = useDemoState<Record<string, string>>("identity-status", {});
  const [registrations] = useDemoState<Record<string, string>>("registration-status", {});
  const [roles] = useDemoState<Record<string, string[]>>("assigned-roles", {});
  const assigned = (name: string, role: string) => name === "Nimal Perera" && roles["AGR-1024"] ? roles["AGR-1024"].join(", ") : role;
  const accountStatus = (name: string, state: string) => states[name] ?? (name === "Nimal Perera" ? registrations["AGR-1024"] : undefined) ?? state;
  return <>
    <Tabs items={["Users", "Roles & groups", "Clients", "Sessions", "Audit logs"]} active={tab} onChange={setTab} />
    {tab === "Users" && <>
      <Table columns={["User / Email", "Roles", "Status", "MFA"]}
        selected={directory.findIndex(row => row[0] === selected)} rows={directory.map(([name, email, role, state, mfa]) => [
          <><button className="text-button" onClick={() => select(name)}>{name}</button><small>{email}</small></>,
          assigned(name, role), <Status tone={accountStatus(name, state) === "Active" ? "good" : ""}>{accountStatus(name, state)}</Status>, mfa,
        ])} />
      <Panel title={selected}><div className="links">
        <button className="secondary" disabled={selected === directory[0][0]} onClick={() => save({ ...states, [selected]: "Suspended" })}>Suspend sample account</button>
        <button className="button" onClick={() => save({ ...states, [selected]: "Active" })}>Activate sample account</button>
      </div></Panel>
    </>}
    {tab === "Roles & groups" && <Table columns={["User", "Roles"]} rows={directory.map(([name, , role]) => [name, assigned(name, role)])} />}
    {tab === "Clients" && <Table columns={["Client", "Protocol"]} rows={[["AgriTech Web", "OpenID Connect"], ["AgriTech API", "OpenID Connect"]]} />}
    {tab === "Sessions" && <Table columns={["Account", "Sample session"]} rows={directory.filter(row => accountStatus(row[0], row[3]) === "Active").map(([name]) => [name, "Active"])} />}
    {tab === "Audit logs" && <Table columns={["Account", "Demo status change"]} rows={Object.entries(states)} />}
  </>;
}

const reportRows = [
  ["Platform performance summary", "Transaction value, volumes and registrations", "01–20 Oct 2026"],
  ["Escrow & dispute ledger", "21 cases · 18 resolved · 3 open", "01–20 Oct 2026"],
  ["AI investigation audit", "4 alerts today · 3 open · 1 cleared", "20 Oct 2026"],
  ["Identity & access review", "1,248 accounts · Admin MFA coverage 100%", "As of 20 Oct 2026"],
];

function Reports() {
  const ledger = useTransactions();
  const completed = ledger.filter(row => row.status === "Settled");
  const completedValue = money(completed.reduce((sum, row) => sum + row.gross, 0));
  const [states] = useDemoState<Record<string, string>>("case-status", {});
  const [decisions] = useDemoState<Record<string, string>>("ai-status", {});
  const [users] = useDemoState<Record<string, string>>("identity-status", {});
  const reports = [
    [["Metric", "Value"], ["Completed transaction value", completedValue], ["Completed transactions", completed.length], ["Registrations approved", 124]],
    [["Case", "Transaction", "Amount", "Status"], ...cases.map(([id, txn, , , amount, status]) => [id, txn, amount, states[id] ?? status])],
    [["Alert", "Signal", "Confidence", "Status"], ...alerts.map(([id, , signal, , confidence, status]) => [id, signal, confidence, decisions[id] ?? status])],
    [["User", "Role", "Status"], ...directory.map(([name, , role, status]) => [name, role, users[name] ?? status])],
  ];
  return <>
    <Metrics items={[["Completed transaction value", completedValue], ["Completed transactions · all records", String(completed.length)], ["Registrations approved", "124"]]} />
    <ReportButton name="agritech-performance" rows={reports[0]}>Export summary</ReportButton>
    <h2>Available reports</h2>
    <Table columns={["Report", "Period", "Format", "Export"]} rows={reportRows.map(([report, detail, period], index) => [
      <>{report}<small>{detail}</small></>, period, "CSV", <ReportButton name={"agritech-report-" + (index + 1)} rows={reports[index]}>Download {report}</ReportButton>,
    ])} />
  </>;
}

function Bank() {
  const [offers, save] = useDemoState<string[][]>("loan-offers", []);
  return <>
    <Panel title="Publish New Bank Offer"><DemoForm id="bank-offer" fields={[
      ["Offer title"], ["Bank"], ["Annual interest rate", "", "number"], ["Tenure"], ["Loan range"], ["Application closing date", "", "date"], ["Eligibility & terms", "", "textarea"],
    ]} actions={["Publish New Loan Offer", "Save Draft"]} onSubmit={(action, values) => {
      save([...offers.filter(row => row[0] !== values["Offer title"]), [values["Offer title"], values.Bank, action === "Save Draft" ? "Draft" : "Published"]]);
      return "Loan offer saved in the demo.";
    }} /></Panel>
    <Table columns={["Offer", "Bank", "Status"]} rows={offers} />
  </>;
}

function Authorities({ screen }: { screen: string }) {
  const [selected, select] = useState("");
  const [reviews, save] = useDemoState<Record<string, string>>("authority-reviews", {});
  const [zoom, setZoom] = useState(1);
  if (screen === "demand") {
    const rows = [["Kurunegala · LST-052", "500 kg tomatoes", "1,200 kg", "Within Local Demand Threshold"],
      ["Matale · LST-061", "2,000 kg potatoes", "1,000 kg", "Sale Blocked"]];
    const columns = ["Region / listing", "Requested sale", "Allowance remaining", "Compliance result"];
    return <Panel title="Local Demand Sales Monitor (Regional thresholds)"><Table columns={columns} rows={rows} />
      <p className="notice warn">Read-only compliance outcomes · Blocked sales cannot proceed to checkout.</p>
      <ReportButton name="regional-demand" rows={[columns, ...rows]}>View Regional Demand Report</ReportButton>
    </Panel>;
  }
  if (screen === "monitoring") return <Panel title="Regional Crop Disease Monitoring">
    <div className="crop-map" aria-label="Illustrative Kurunegala crop map">
      <div className="crop-map-features" style={{ transform: "scale(" + zoom + ")" }}><span className="plot">● T-018 · field review needed</span></div>
      <div className="map-tools"><button className="secondary" aria-label="Zoom in" onClick={() => setZoom(Math.min(2, zoom + .2))}>+</button>
        <button className="secondary" aria-label="Zoom out" onClick={() => setZoom(Math.max(1, zoom - .2))}>−</button></div>
    </div>
    <div className="tabs"><Status tone="warn">3 observations awaiting field confirmation</Status><Status tone="good">12 healthy plots monitored</Status></div>
    <details><summary>View Observation</summary><p>T-018 / LD-018 · Possible early blight · Illustrative confidence 87% · Field assessment required.</p></details>
    <DemoForm id="field-visit" fields={[["Field visit date", "", "date"]]} actions={["Schedule Field Visit"]} />
  </Panel>;
  const rows = [
    ["WH-021", "Matale Agro Store", "8 t cold / 12 t dry", "Safety certificate attached", "Pending inspection"],
    ["WH-022", "Kurunegala Grain Hub", "0 t cold / 25 t dry", "Fire certificate missing", "Missing details"],
  ];
  const record = rows.find(([id]) => id === selected) ?? rows[0];
  return <>
    <Panel title="Consumer Affairs Authority · inspection queue">
      <Table columns={["Warehouse / application", "Capacity", "Evidence", "Inspection status"]}
        rows={rows.map(([id, name, description, evidence, status]) => [
          <button className="text-button" onClick={() => select(id)}>{id} · {name}</button>, description, evidence, reviews[id] ?? status,
        ])} />
    </Panel>
    <Panel title="Selected warehouse review">
      <p>{record[0]} · {record[1]} · {record[2]} · {record[3]}</p>
      <DemoForm key={record[0]} id={"authority:" + record[0]} fields={[["Inspector note", "", "textarea"]]}
        actions={["Verify Warehouse", "Missing Details"]} onSubmit={action => {
          save({ ...reviews, [record[0]]: action === "Verify Warehouse" ? "Verified" : action });
          return "Review saved in the demo.";
        }} />
    </Panel>
  </>;
}

export function GovernanceScreen({ screen }: { screen: string }) {
  const title = screen === "dashboard" ? "Admin Dashboard" : screen === "registration" ? "Registration Verification Portal"
    : screen === "reports" ? "Reports & Analytics"
    : flows.governance.screens[screen as keyof typeof flows.governance.screens];
  return <><h1>{title}</h1>
    {screen === "dashboard" && <Dashboard />}
    {screen === "registration" && <Registration />}
    {screen === "disputes" && <Disputes />}
    {screen === "investigations" && <Investigations />}
    {screen === "identity" && <Identity />}
    {screen === "reports" && <Reports />}
    {screen === "offers" && <Bank />}
    {screen === "applications" && <BankReview />}
    {screen === "plans" && <Agriculture />}
    {screen === "land" && <LandAuthority />}
    {screen === "ledger" && <Ledger />}
    {screen === "audit" && <Panel title="Financial Auditor · AI anomaly detection scanner">
      <p className="notice warn"><strong>Flagged activity · TX-2051 · LKR 75,200</strong><br />Three attempts from a newly added device in 12 minutes. Case CASE-A019 is open.</p>
      <DemoForm id="audit-review" fields={[["Scanner scope", "22 Oct · gateway and escrow events"], ["Audit classification", "Needs corroboration"],
        ["Evidence reviewed", "Gateway event log · masked device metadata"], ["Auditor note", "", "textarea"]]} actions={["Review Flagged Activity"]} />
      <ReportButton name="agritech-audit" rows={[["Case", "Transaction", "Classification"], ["CASE-A019", "TX-2051", "Needs corroboration"]]}>Generate Demo Audit Report</ReportButton>
    </Panel>}
    {["monitoring", "warehouses", "demand"].includes(screen) && <Authorities screen={screen} />}
    {(screen === "history" || screen === "dashboard") ? <ActivityHistory module="governance" /> : screen.endsWith("-history") ? <>
      {(screen === "bank-history" ? ["offers", "applications"] : screen === "auditor-history" ? ["ledger", "audit"] : screen === "agriculture-history" ? ["plans", "monitoring"] : screen === "land-history" ? ["land"] : ["warehouses", "demand"]).map(section => <ActivityHistory key={section} module="governance" section={section} />)}
    </> : <ActivityHistory module="governance" section={screen} />}
  </>;
}

