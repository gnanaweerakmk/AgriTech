"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { flows, previewPath, type Flow } from "../../lib/preview";

export const governanceGroups = [
  { label: "Admin", screens: ["dashboard", "registration", "disputes", "investigations", "identity", "reports", "history"] },
  { label: "Bank Officer", screens: ["offers", "applications", "bank-history"] },
  { label: "Auditor", screens: ["ledger", "audit", "auditor-history"] },
  { label: "Agriculture Department", screens: ["plans", "monitoring", "agriculture-history"] },
  { label: "Land Registration Authority", screens: ["land", "land-history"] },
  { label: "Additional regulatory tools", screens: ["warehouses", "demand", "regulatory-history"] },
];
const groups: { label: string; flow: Flow; screens: string[] }[] = [
  ...governanceGroups.map(group => ({ ...group, flow: "governance" as const })),
  { label: "Crop & Land · Farmer / Landowner", flow: "cultivation", screens: ["overview", "owner", "history"] },
  { label: "Buyers & Sellers · Seller / Buyer", flow: "market", screens: ["listings", "marketplace", "history"] },
  { label: "Transport & Logistics", flow: "transport", screens: ["book", "driver", "fleet", "history"] },
  { label: "Storage & Inventory", flow: "storage", screens: ["settings", "forecast", "history"] },
];
export function ModuleMenu({ flow, screen }: { flow: Flow; screen: string }) {
  const [open, setOpen] = useState(false); const root = useRef<HTMLDivElement>(null); const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const outside = (e: PointerEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    const escape = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); trigger.current?.focus(); } };
    document.addEventListener("pointerdown", outside); document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", escape); };
  }, [open]);
  return <div className="menu-root" ref={root} onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false); }}>
    <button ref={trigger} className="secondary menu-trigger" aria-expanded={open} aria-controls="app-navigation" onClick={() => setOpen(!open)}><span className="hamburger" aria-hidden="true"><i /><i /><i /></span>Menu</button>
    {open && <nav id="app-navigation" className="menu-dropdown" aria-label="Modules and governance destinations">
      <div className="menu-intro"><strong>Explore AgriTech</strong><small>Five connected modules</small></div>
      <p className="menu-category">Stakeholders & Governance</p>
      {groups.map(group => <section key={group.label}><h2>{group.label}</h2>{group.screens.map(id => <Link key={id} href={previewPath(group.flow, id)} aria-current={flow === group.flow && screen === id ? "page" : undefined} onClick={() => { setOpen(false); trigger.current?.focus(); }}>{(flows[group.flow].screens as Record<string, string>)[id]}</Link>)}</section>)}
      <section><h2>Secure services</h2><Link href="/governance">Protected escrow ledger</Link><Link href="/governance/demand">Regional demand limits</Link><Link href="/leasing">Signed-in leasing</Link></section>
    </nav>}
  </div>;
}
