"use client";
import Link from "next/link";
import { useState } from "react";
import { previewPath } from "../../lib/preview";
import { History } from "../shared/history";
import { DemoForm, Panel, Status, Table, Tabs, useDemoState } from "../shared/ui";

export function Cultivation({ screen }: { screen: string }) {
  const [harvest, saveHarvest] = useDemoState("harvest-estimate", { date: "", quantity: "" });
  const [requests, saveRequests] = useDemoState<string[][]>("land-requests", []);
  const [plans, savePlans] = useDemoState<string[][]>("cultivation-plans", []);
  const [planReviews] = useDemoState<Record<string, string>>("authority-reviews", {});
  const [visits, saveVisits] = useDemoState("crop-health-status", "Field review needed");
  const [crop, selectCrop] = useState("Tomato");
  const [payment, savePayment] = useDemoState("lease-payment", "Pending");
  if (screen === "owner") return <Panel title="Lease requests for sample plots">
    <Table columns={["Plot", "Requested start", "Status", "Action"]} rows={requests.map(([plot, date, state]) => [
      plot, date, <Status>{state}</Status>, state === "Pending" ? <div className="links">
        {["Approved", "Rejected"].map(decision => <button key={decision} className={decision === "Approved" ? "button" : "secondary"}
          onClick={() => saveRequests(requests.map(row => row[0] === plot ? [plot, date, decision] : row))}>
          {decision === "Approved" ? "Approve" : "Reject"}
        </button>)}
      </div> : null,
    ])} />
    <Link className="secondary" href={previewPath("cultivation", "plots")}>Open farmer's land request demo</Link>
  </Panel>;
  if (screen === "overview") return <>
    <p className="muted">Welcome back, Kavindu. Here’s what needs your attention on the farm.</p>
    <div className="metrics">
      <div className="metric"><small>Planning More Growing Space?</small><div><Link className="button" href={previewPath("cultivation", "plots")}>Find &amp; Request Land →</Link></div></div>
      <div className="metric"><small>Next harvest</small><strong>{harvest.date || "Not set"}</strong></div>
      <div className="metric"><small>Upcoming installment (due 01 Nov)</small><strong>{payment === "Verified" ? "Paid" : "LKR 30,000"}</strong></div>
    </div>
    <Panel title="Current crop"><div className="heading"><strong>Tomato · T-018</strong><Status tone="good">Existing crop</Status></div>
      <p className="muted">LD-018 · Mawathagama · plot 2.0 acres<br />Harvest window: {harvest.date || "not set"}</p>
      <Link className="text-button" href={previewPath("cultivation", "crops")}>My Crops &amp; Harvests →</Link>
    </Panel>
    <Panel title="Your next actions"><div className="notice warn"><strong>Confirm the health observation</strong>
      <p>Review the sample photo result with an agricultural officer.</p><Link href={previewPath("cultivation", "health")}>Open Crop Health →</Link></div>
      <div className="notice"><strong>Set a harvest estimate</strong><p>Record expected harvest date and quantity for T-018.</p>
      <Link href={previewPath("cultivation", "crops")}>Manage crop cycle →</Link></div></Panel>
  </>;
  if (screen === "crops") return <Panel title="Tomato · T-018 · Mawathagama">
    <p>Current plot · LD-018 · 2.0 acres</p>
    <DemoForm id="harvest-form" fields={[["Expected harvest date", harvest.date, "date"], ["Expected quantity (kg)", harvest.quantity, "number"]]}
      actions={["Save harvest estimate"]} onSubmit={(_, values) => {
        saveHarvest({ date: values["Expected harvest date"], quantity: values["Expected quantity (kg)"] });
        return "Harvest estimate updated in your demo overview.";
      }} />
  </Panel>;
  if (screen === "plots") return <>
    <Panel title="Available land"><Table columns={["Plot", "Location", "Size", "Status"]} rows={[
      ["LD-024", "Mawathagama", "2.0 acres", "Verified"], ["LD-029", "Kurunegala", "1.5 acres", "Verified"],
    ]} /></Panel>
    <Panel title="Request land"><DemoForm id="land-request" fields={[["Plot reference", "LD-024"], ["Start date", "", "date"], ["Purpose", "Cultivate tomatoes"]]}
      actions={["Send lease request"]} onSubmit={(_, values) => {
        const plot = values["Plot reference"].trim().toUpperCase();
        if (!["LD-024", "LD-029"].includes(plot)) return "Enter a plot from the available land table.";
        if (requests.some(([id]) => id === plot)) return "This plot already has a sample request.";
        saveRequests([...requests, [plot, values["Start date"], "Pending"]]); return "Sample lease request submitted.";
      }} /></Panel>
  </>;
  if (screen === "plans") return <>
    <Panel title="New cultivation plan"><DemoForm id="cultivation-plan" fields={[["Plot", "LD-018"], ["Crop", "Tomato"], ["Planting date", "", "date"], ["Irrigation", "Drip"]]}
      actions={["Submit plan for review"]} onSubmit={(_, values) => {
        savePlans([...plans, [values.Plot, values.Crop, values["Planting date"], "Pending officer review"]]); return "Sample plan submitted.";
      }} /></Panel>
    <Table columns={["Plot", "Crop", "Planting date", "Status"]} rows={plans.map((row, i) => [row[0], row[1], row[2], planReviews[`SUB-${i}`] ?? row[3]])} />
  </>;
  if (screen === "health") return <Panel title="Crop observation · T-018">
    <Status tone="warn">{visits}</Status><p>Possible early blight · 87% illustrative confidence. Confirm the observation with an agricultural officer.</p>
    <DemoForm id="crop-review" fields={[["Observation date", "", "date"], ["Field notes", "", "textarea"]]}
      actions={["Request field review"]} onSubmit={() => { saveVisits("Sample review requested"); return "Field review request recorded in the demo."; }} />
  </Panel>;
  if (screen === "recommendations") return <Panel title="Crop recommendations · LD-018">
    <Tabs items={["Tomato", "Chilli", "Beans"]} active={crop} onChange={selectCrop} />
    <p className="notice good"><strong>{crop}</strong> · Sample suitability assessment</p>
    <p>{crop === "Tomato" ? "Sandy loam and available drip irrigation fit the sample tomato growing plan." : crop === "Chilli" ? "Check the water supply and regional demand before planning chilli." : "Review crop rotation and the next planting window for beans."}</p>
    <div><Link className="button" href={previewPath("cultivation", "plans")}>Open Cultivation Plans</Link></div>
  </Panel>;
  if (screen === "leases") return <>
    <Panel title="My leases"><Table columns={["Plot", "Start / due date", "Status"]} rows={[["LD-018", "01 Nov 2026", "Active"], ...requests]} /></Panel>
    <Panel title="Upcoming installment"><p>LD-018 · LKR 30,000 · 01 Nov 2026</p><Status tone={payment === "Verified" ? "good" : "warn"}>{payment}</Status>
      {payment === "Pending" && <div><button className="button" onClick={() => savePayment("Verified")}>Simulate installment payment</button></div>}
    </Panel>
  </>;
  return <History title="Lease payment ledger" rows={[["LD-018", "01 Nov 2026", "LKR 30,000", payment]]} />;
}
