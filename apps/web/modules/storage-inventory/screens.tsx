"use client";
import Link from "next/link";
import { InventoryForecast } from "../shared/insights";
import { History } from "../shared/history";
import { DemoForm, Metrics, Panel, ReportButton, Status, Table, useDemoState } from "../shared/ui";

const initialMovements = [
  ["MOV-088 · LOT-030", "Stock-in · 20 Oct", "1,200 kg rice", "1,200 kg · D-01"],
  ["MOV-089 · LOT-031", "Stock-out · 21 Oct", "200 kg tomatoes", "600 kg · C-02"],
  ["MOV-090 · LOT-032", "Stock-in · 22 Oct", "800 kg onions", "800 kg · D-02"],
];
const stockFields = ["Movement / lot", "Type", "Quantity", "Balance / bay"];

export function Storage({ screen }: { screen: string }) {
  const [warehouse, saveWarehouse] = useDemoState("warehouse-capacity", { name: "Dambulla Cold Store", cold: 10, dry: 20 });
  const [stock, saveStock] = useDemoState("warehouse-stock", { cold: 6, dry: 12, moves: initialMovements });
  const total = warehouse.cold + warehouse.dry;
  const used = stock.cold + stock.dry;
  if (screen === "forecast") return <InventoryForecast />;
  if (screen === "settings") return <>
    <Metrics items={[["Warehouse", "WH-008", warehouse.name], ["Total capacity", total.toFixed(1) + " t", warehouse.cold + " t cold · " + warehouse.dry + " t dry"],
      ["Current occupancy", Math.round(used / total * 100) + "%", used.toFixed(1) + " t / " + total.toFixed(1) + " t"]]} />
    <Panel title="Register warehouse"><small>WH-008 · existing verified record</small>
      <DemoForm id="warehouse-settings" fields={[
        ["Warehouse name", warehouse.name], ["Operator organization", "Harvest Link Logistics (Pvt) Ltd"],
        ["Address", "12 Market Road, Dambulla"], ["Registration number", "WH-008 / MAT / 2026"],
        ["Cold capacity (tonnes)", String(warehouse.cold), "number"], ["Dry capacity (tonnes)", String(warehouse.dry), "number"],
      ]} actions={["Save Warehouse & Capacity Settings"]} onSubmit={(_, values) => {
        const cold = Number(values["Cold capacity (tonnes)"]); const dry = Number(values["Dry capacity (tonnes)"]);
        if (cold < stock.cold || dry < stock.dry || cold + dry <= 0) return "Capacity must cover all posted stock.";
        saveWarehouse({ name: values["Warehouse name"], cold, dry }); return "Sample warehouse settings saved.";
      }}><div><Status tone="good">Consumer Affairs Verification: Verified</Status></div></DemoForm>
      <label>Choose updated documents<input type="file" accept=".pdf,.png,.jpg,.jpeg" /></label>
      <small>Demo file selection. Files are discarded on navigation.</small>
    </Panel>
  </>;
  if (screen === "movements") return <>
    <Panel title="Warehouse operator · record goods received"><DemoForm id="warehouse-receipt" fields={[
      ["Received quantity", "300 kg okra · LOT-035"], ["Storage bay", "Dry bay D-03"], ["Condition", "Good · no visible damage"], ["Received by", "D. Senanayake · WH-008"],
    ]} actions={["Record Goods Received"]} /></Panel>
    <Panel title="Stock-in / stock-out console"><DemoForm id="warehouse-movement" fields={[
      ["Lot reference", "LOT-036 · carrots"], ["Owner / order", "Green Basket · AGR-2036"], ["Quantity (kg)", "400", "number"], ["Storage bay", "C-01"],
    ]} actions={["Record Stock-in", "Record Stock-out"]} onSubmit={(action, values) => {
      const kg = Number(values["Quantity (kg)"]);
      const kind = values["Storage bay"].trim().toUpperCase().startsWith("C-") ? "cold" : "dry";
      const incoming = action === "Record Stock-in";
      const next = Math.round((stock[kind] + (incoming ? kg : -kg) / 1000) * 1000000) / 1000000;
      if (kg <= 0 || next < 0 || next > warehouse[kind]) return "Enter a positive amount within available stock and capacity.";
      const row = [values["Lot reference"], incoming ? "Stock-in" : "Stock-out", kg + " kg", values["Storage bay"]];
      saveStock({ ...stock, [kind]: next, moves: [...stock.moves, row] }); return "Sample inventory movement posted.";
    }} /></Panel>
    <Panel title="Booking & payment status"><p>WH-008 · 500 kg / 7 days · LKR 6,000</p><Status tone="warn">Awaiting booking</Status></Panel>
  </>;
  if (screen === "capacity") return <>
    <Metrics items={[["Cold space available", (warehouse.cold - stock.cold).toFixed(1) + " t"], ["Dry space available", (warehouse.dry - stock.dry).toFixed(1) + " t"], ["Temperature", "4.2 °C", "Sample reading · normal"]]} />
    <Panel title="Real-time occupancy">{(["cold", "dry"] as const).map(type => <label key={type}>
      {type === "cold" ? "Cold" : "Dry"} storage · {stock[type].toFixed(1)} / {warehouse[type].toFixed(1)} t
      <progress value={stock[type]} max={warehouse[type] || 1} />
    </label>)}<p className="notice good">Occupancy uses posted stock movements.</p></Panel>
  </>;
  if (screen === "inventory") return <Panel title="Posted inventory movements"><Table columns={stockFields} rows={stock.moves} />
    <ReportButton name="warehouse-inventory" rows={[stockFields, ...stock.moves]}>Generate Inventory Report</ReportButton>
  </Panel>;
  return <History title="Storage fee ledger" rows={[]}>
    <Panel title="Future booking context"><p>WH-008 · planned 500 kg / 7 days · LKR 6,000 · booking unconfirmed</p><Status tone="warn">Not yet transferred</Status></Panel>
  </History>;
}
