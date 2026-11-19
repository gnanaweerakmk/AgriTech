"use client";
import Link from "next/link";
import { previewPath } from "../../lib/preview";
import { History } from "../shared/history";
import { DemoForm, Metrics, Panel, Status, Table, useDemoState } from "../shared/ui";

export function Transport({ screen }: { screen: string }) {
  const [warehouse, setWarehouse] = useDemoState("transport-warehouse", true);
  const [booking, setBooking] = useDemoState("transport-booking", "Draft");
  const [handover, setHandover] = useDemoState("transport-handover", "Awaiting pickup");
  const [job, setJob] = useDemoState("driver-job-2048", "Offered");
  const [fleet, saveFleet] = useDemoState<Record<string, string>>("fleet-availability", { "WP NA-8241": "Available" });
  if (screen === "driver") return <Panel title="Dispatch offer · SHP-2048">
    <p>Mawathagama farm to Dambulla collection center · 500 kg tomatoes</p>
    <div role="status"><Status>{job}</Status></div>
    <div className="links">
      {job === "Offered" && <>
        <button className="button" onClick={() => setJob("Accepted")}>Accept job</button>
        <button className="secondary" onClick={() => setJob("Declined")}>Decline job</button>
      </>}
      {job === "Accepted" && <Link className="button" href={previewPath("transport", "assigned")}>Open pickup and delivery</Link>}
    </div>
  </Panel>;
  if (screen === "fleet") return <Panel title="Manage vehicle availability">
    <DemoForm id="fleet-vehicle" fields={[["Registration number"]]} actions={["Mark available", "Mark unavailable"]} onSubmit={(action, values) => {
      const registration = values["Registration number"].trim().toUpperCase();
      if (!registration) return "Enter a registration number.";
      saveFleet({ ...fleet, [registration]: action === "Mark available" ? "Available" : "Unavailable" });
      return "Sample vehicle availability updated.";
    }} />
    <Table columns={["Vehicle", "Status"]} rows={Object.entries(fleet)} />
  </Panel>;
  if (screen === "book") return <>
    <Panel title="Request transport"><small>New booking · SHP-2052</small>
      <DemoForm id="transport-request" fields={[
        ["Pickup address", "Mawathagama farm · LD-024"], ["Drop-off address", "Dambulla collection center"],
        ["Pickup contact", "Nimal Perera"], ["Receiver contact", "Green Basket"], ["Goods & weight", "Tomatoes · 500 kg / 25 crates"],
        ["Pickup date & time", "2026-10-24T08:30", "datetime-local"],
        ...(warehouse ? [["Warehouse finder", "WH-008 · Dambulla Cold Store · 4.0 t available"] as [string, string]] : []),
      ]} actions={["Submit & Pay LKR 8,500"]} onSubmit={() => {
        if (booking === "Payment verified") return "The sample booking already has a verified demo payment.";
        setBooking("Confirmed"); return "Sample booking confirmed. Continue in checkout.";
      }}>
        <label className="check"><input type="checkbox" checked={warehouse} onChange={event => setWarehouse(event.target.checked)} /> Deliver to Warehouse?</label>
        <p>Refrigerated van · estimated 68 km · transport fee LKR 8,500</p>
      </DemoForm>
    </Panel>
    <Panel title="Automatic payment checkout"><div className="heading"><div><h2>LKR 8,500</h2><small>SHP-2052 · Transport fee</small></div><Status tone={booking === "Payment verified" ? "good" : "warn"}>{booking}</Status></div>
      <ol className="steps">{["Draft", "Confirmed", "Awaiting provider", "Payment verified"].map(step =>
        <li key={step} aria-current={booking === step ? "step" : undefined}>{step}</li>)}</ol>
      <p className="notice">Checkout records the transport fee. Pickup confirmation uses the assigned shipment’s separate handover code.</p>
      <div className="links">
        {booking === "Confirmed" && <button className="button" onClick={() => setBooking("Awaiting provider")}>Start simulated checkout</button>}
        {booking === "Awaiting provider" && <button className="button" onClick={() => setBooking("Payment verified")}>Simulate provider verification</button>}
        {booking === "Payment verified" && <Link className="button" href={previewPath("transport", "history")}>View transaction</Link>}
      </div>
    </Panel>
  </>;
  if (screen === "assigned") return <Panel title="Assigned shipment · SHP-2048">
    <Metrics items={[["Driver", "S. Dias"], ["Vehicle", "WP NA-8241"], ["Pickup status", handover]]} />
    <p>500 kg tomatoes · Mawathagama farm → Dambulla collection center</p>
    <p className="notice">Sample pickup code: SHP-2048-PICKUP. Sample delivery code: SHP-2048-DELIVERY.</p>
    <DemoForm id="transport-handover-form" fields={[["Handover code"]]} actions={["Confirm handover"]} onSubmit={(_, values) => {
      if (handover === "Delivered") return "This sample shipment has already been delivered.";
      const pickedUp = handover === "In transit";
      const expected = pickedUp ? "SHP-2048-DELIVERY" : "SHP-2048-PICKUP";
      if (values["Handover code"].trim().toUpperCase() !== expected) return "Enter the sample " + (pickedUp ? "delivery" : "pickup") + " code.";
      setHandover(pickedUp ? "Delivered" : "In transit"); return "Sample handover recorded.";
    }} />
  </Panel>;
  if (screen === "tracking") return <Panel title="Shipment tracking · SHP-2048">
    <p>Pickup: Mawathagama farm · Destination: Dambulla collection center</p>
    <ol className="steps">{["Awaiting pickup", "In transit", "Delivered"].map(step => <li key={step} aria-current={handover === step ? "step" : undefined}>{step}</li>)}</ol>
    <p className="notice">Last milestone: {handover}. Sample route and milestones.</p>
  </Panel>;
  return <History title="Transport fee ledger" rows={booking === "Payment verified" ? [["SHP-2052", "24 Oct 2026", "LKR 8,500", "Verified"]] : []} />;
}
