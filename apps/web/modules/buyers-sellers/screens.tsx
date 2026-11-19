"use client";
import Link from "next/link";
import { useState } from "react";
import { previewPath } from "../../lib/preview";
import { History } from "../shared/history";
import { DemoForm, Metrics, Panel, Status, Table, Tabs, useDemoState } from "../shared/ui";

export function Market({ screen }: { screen: string }) {
  const [mode, setMode] = useState("Direct sale");
  const [listings, saveListings] = useDemoState<string[][]>("market-listings", []);
  const [bids, saveBids] = useDemoState<Record<string, string>>("market-bids", {});
  const [order, saveOrder] = useDemoState("market-order", "Awaiting dispatch");
  const [product, chooseProduct] = useDemoState<number | null>("market-product-index", null);
  const [purchases, savePurchases] = useDemoState<Record<number, string>>("market-orders", {});
  const products = [
    ["Tomatoes · LST-052", "500 kg", "LKR 200", "Direct sale"],
    ["Potatoes · LST-061", "2,000 kg", "LKR 180", "Direct sale"],
    ...listings,
  ];
  if (screen === "listings") return <>
    <Metrics items={[["Active listings", String(4 + listings.length)], ["Incoming bids", String(3 - Object.keys(bids).length) + " pending"], ["Ready to dispatch", order === "Awaiting dispatch" ? "1 order" : "0 orders"]]} />
    <Panel title="Create listing"><DemoForm id="market-listing" fields={[
      ["Produce name", "Green chilli · Grade A"], ["Quantity (kg)", "300", "number"], ["Harvest date", "2026-10-23", "date"],
      ["Pickup location", "LD-024 · Mawathagama"], ["Price per kg (LKR)", "240", "number"], ["Listing closes", "2026-10-24T16:00", "datetime-local"],
    ]} actions={["Publish Listing"]} onSubmit={(_, values) => {
      if (Number(values["Quantity (kg)"]) <= 0 || Number(values["Price per kg (LKR)"]) <= 0) return "Enter a quantity and price greater than zero.";
      saveListings([...listings, [values["Produce name"], values["Quantity (kg)"] + " kg", "LKR " + values["Price per kg (LKR)"], mode]]);
      return "Listing published in the demo marketplace.";
    }}>
      <Tabs items={["Direct sale", "Auction"]} active={mode} onChange={setMode} />
      <p className="notice good"><strong>AI Recommended Fair Price · LKR 230–250 / kg</strong><br />Illustrative suggestion from recent regional prices.</p>
    </DemoForm></Panel>
    {listings.length > 0 && <Table columns={["Produce", "Quantity", "Price per kg", "Sale type"]} rows={listings} />}
  </>;
  if (screen === "bids") return <Panel title="Incoming buyer bids"><Table columns={["Bid", "Buyer", "Offer", "Status", "Decision"]} rows={[
    ["BID-591", "Green Basket Market", "LKR 72,000"], ["BID-592", "Kandy Fresh", "LKR 71,000"], ["BID-593", "Harvest Hub", "LKR 69,000"],
  ].map(([id, buyer, price]) => [
    id, buyer, price, bids[id] ?? "Pending", <div className="links">
      <button className="button" disabled={!!bids[id]} onClick={() => saveBids({ ...bids, [id]: "Accepted" })}>Accept {id}</button>
      <button className="secondary" disabled={!!bids[id]} onClick={() => saveBids({ ...bids, [id]: "Rejected" })}>Reject {id}</button>
    </div>,
  ])} /></Panel>;
  if (screen === "dispatch") return <Panel title="Dispatch order · AGR-2036"><p>Green Basket Market · 500 kg tomatoes · Mawathagama</p>
    <Status tone="good">{order}</Status><div className="links">
      <button className="button" disabled={order !== "Awaiting dispatch"} onClick={() => saveOrder("Ready for pickup")}>Mark ready for pickup</button>
      <Link className="secondary" href={previewPath("transport", "book")}>Request transport</Link>
    </div>
  </Panel>;
  if (screen === "marketplace") return <Panel title="Available produce">
    <Table columns={["Produce", "Quantity", "Price per kg", "Sale type", "Action"]} rows={products.map(([name, qty, price, type], index) => [
      name, qty, price, type, <Link className="secondary" href={previewPath("market", "checkout")} onClick={() => chooseProduct(index)}>Review {name}</Link>,
    ])} />
  </Panel>;
  if (screen === "checkout") {
    const listing = product === null ? undefined : products[product];
    const blocked = product === 1 || listing?.[3] === "Auction";
    const ordered = product !== null && Boolean(purchases[product]);
    const total = listing ? Number(listing[1].replace(/[^\d.]/g, "")) * Number(listing[2].replace(/[^\d.]/g, "")) : 0;
    const amount = "LKR " + total.toLocaleString("en-LK", { maximumFractionDigits: 2 });
    return <Panel title={listing?.[0] ?? "Choose produce"}>
      {listing && <p className={"notice " + (blocked ? "warn" : "good")}>{listing[3] === "Auction" ? "Auction listings require an accepted bid." :
        blocked ? "Sale blocked by local demand threshold." : "Within the sample local demand threshold. Total: " + amount + "."}</p>}
      <div className="links"><Link className="secondary" href={previewPath("market", "marketplace")}>Browse listings</Link>
        {listing && product !== null && !blocked && !ordered && <button className="button" onClick={() => savePurchases({ ...purchases, [product]: amount })}>Confirm simulated escrow hold</button>}
        {ordered && <Link className="button" href={previewPath("market", "orders")}>View sample order</Link>}</div>
    </Panel>;
  }
  if (screen === "orders") return <Panel title="Sample purchases">
    <Table columns={["Produce", "Amount", "Payment"]} rows={Object.entries(purchases).map(([index, amount]) => [products[Number(index)]?.[0], amount, "Simulated escrow hold"])} />
    <div><Link className="button" href={previewPath("market", "marketplace")}>Browse marketplace</Link></div>
  </Panel>;
  return <History title="Sales transaction ledger" rows={Object.entries(purchases).map(([index, amount]) => ["DEMO-SALE-" + index, "24 Oct 2026", amount, "Pending"])} />;
}
