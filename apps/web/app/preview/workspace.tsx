"use client";

import Link from "next/link";
import { flowEntries, flows, previewPath, type Flow } from "../../lib/preview";
import { GovernanceScreen } from "../../modules/stakeholders-governance/screens";
import { Transport } from "../../modules/transport-logistics/screens";
import { Cultivation } from "../../modules/crop-land/screens";
import { Market } from "../../modules/buyers-sellers/screens";
import { Storage } from "../../modules/storage-inventory/screens";

const operationalScreens = { transport: Transport, cultivation: Cultivation, market: Market, storage: Storage };

export function Preview({ flow, screen }: { flow: Flow; screen: string }) {
  const entry = flows[flow];
  const all = Object.entries(entry.screens);
  const activeGroup = all.findIndex(([id]) => id === screen);
  const buyer = flow === "market" && ["marketplace", "checkout", "orders"].includes(screen);
  const persona = buyer ? { person: "Green Basket Co.", role: "Buyer" }
    : screen === "driver" || (flow === "transport" && screen === "assigned") ? { person: "S. Dias", role: "Driver" }
    : screen === "fleet" ? { person: "Demo fleet operator", role: "Vehicle owner" }
    : screen === "owner" ? { person: "Demo landowner", role: "Landowner" } : entry;
  const roleScreens = buyer ? ["marketplace", "checkout", "orders"]
    : flow === "market" ? ["listings", "bids", "dispatch", "history"]
    : persona.role === "Driver" ? ["driver", "assigned", "tracking"]
    : screen === "fleet" || screen === "owner" ? [screen]
    : flow === "transport" ? ["book", "tracking", "history"]
    : flow === "cultivation" ? all.map(([id]) => id).filter(id => id !== "owner") : undefined;
  const links = flow !== "governance" ? all.filter(([id]) => !roleScreens || roleScreens.includes(id)) : activeGroup < 6 ? all.slice(0, 6)
    : activeGroup < 8 ? all.slice(6, 8) : activeGroup < 10 ? all.slice(8, 10) : all.slice(10);
  const footer = <footer className="footer"><div className="shell">AgriTech · Growing better, together.</div></footer>;
  const tabs = links.map(([id, label]) => <Link key={id} href={previewPath(flow, id)}
    aria-current={screen === id ? "page" : undefined}
    className={flow === "governance" ? screen === id ? "button" : "secondary" : undefined}>{label}</Link>);
  const signOut = <Link className="button" href="/">Log Out</Link>;
  const brand = <Link className="brand" href="/">AgriTech</Link>;
  const switcher = <div className="demo-strip" aria-label="Demo module navigation"><div className="shell module-bar">
    <Link className="secondary" href="/preview/roles">Role workspaces</Link>
    <nav className="module-nav" aria-label="Modules">
      {flowEntries.map(([id, module]) => <Link key={id} href={previewPath(id)} aria-current={flow === id ? "location" : undefined} className={flow === id ? "button" : "secondary"}>{module.label}</Link>)}
    </nav>
  </div></div>;

  if (flow === "governance") return <div className="app">
    {switcher}
    <header><div className="shell bar">{brand}<nav className="links" aria-label="Governance">{tabs}</nav>{signOut}</div></header>
    <main className="shell content">
      <nav className="links portal-links" aria-label="Governance workspaces">
        <Link href={previewPath(flow, "dashboard")}>Admin</Link>
        <Link href={previewPath(flow, "offers")}>Bank officer</Link>
        <Link href={previewPath(flow, "ledger")}>Financial auditor</Link>
        <Link href={previewPath(flow, "plans")}>Authorities</Link>
        <Link href="/governance">Protected escrow ledger</Link>
      </nav>
      <GovernanceScreen screen={screen} />
    </main>{footer}
  </div>;

  const Screen = operationalScreens[flow];
  return <>{switcher}<div className="portal">
    <aside className="sidebar">{brand}
      <p className="notice identity">{persona.person}<br /><strong>{persona.role}</strong></p>
      <nav aria-label={entry.label}>{tabs}</nav>
    </aside>
    <div className="portal-main">
      <header><div className="shell bar">{signOut}</div></header>
      <main className="shell content"><p className="muted">Demo workspace · sample data</p><h1>{all.find(([id]) => id === screen)?.[1]}</h1>
        <Screen screen={screen} />
      </main>{footer}
    </div>
  </div></>;
}

