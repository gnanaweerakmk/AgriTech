"use client";

import Link from "next/link";
import { flows, previewPath, type Flow } from "../../lib/preview";
import { ModuleMenu, governanceGroups } from "../../modules/shared/navigation";
import { ActivityHistory } from "../../modules/shared/insights";
import { useEffect, useState } from "react";
import { GovernanceScreen } from "../../modules/stakeholders-governance/screens";
import { Transport } from "../../modules/transport-logistics/screens";
import { Cultivation } from "../../modules/crop-land/screens";
import { Market } from "../../modules/buyers-sellers/screens";
import { Storage } from "../../modules/storage-inventory/screens";

const operationalScreens = { transport: Transport, cultivation: Cultivation, market: Market, storage: Storage };

export function Preview({ flow, screen }: { flow: Flow; screen: string }) {
  const entry = flows[flow];
  const all = Object.entries(entry.screens);
  const [storageWarning, setStorageWarning] = useState(false);
  useEffect(() => { const warn = () => setStorageWarning(true); window.addEventListener("agritech-storage-warning", warn); return () => window.removeEventListener("agritech-storage-warning", warn); }, []);
  const buyer = flow === "market" && ["marketplace", "checkout", "orders"].includes(screen);
  const persona = buyer ? { person: "Green Basket Co.", role: "Buyer" }
    : screen === "driver" || (flow === "transport" && screen === "assigned") ? { person: "S. Dias", role: "Driver" }
    : screen === "fleet" ? { person: "Demo fleet operator", role: "Vehicle owner" }
    : screen === "owner" ? { person: "Demo landowner", role: "Landowner" } : entry;
  const roleScreens = buyer ? ["marketplace", "checkout", "orders", "history"]
    : flow === "market" ? ["listings", "bids", "dispatch", "history"]
    : persona.role === "Driver" ? ["driver", "assigned", "tracking", "history"]
    : screen === "fleet" || screen === "owner" ? [screen, "history"]
    : flow === "transport" ? ["book", "tracking", "history"]
    : flow === "cultivation" ? all.map(([id]) => id).filter(id => id !== "owner") : undefined;
  const currentGroup = governanceGroups.find(group => group.screens.includes(screen));
  const links = all.filter(([id]) => flow === "governance" ? currentGroup?.screens.includes(id) : !roleScreens || roleScreens.includes(id));
  const footer = <footer className="footer"><div className="shell">AgriTech · Growing better, together.</div></footer>;
  const tabs = links.map(([id, label]) => <Link key={id} href={previewPath(flow, id)}
    aria-current={screen === id ? "page" : undefined}
    className={flow === "governance" ? screen === id ? "button" : "secondary" : undefined}>{label}</Link>);
  const signOut = <Link className="button" href="/">Log Out</Link>;
  const brand = <Link className="brand" href="/">AgriTech</Link>;
  const switcher = <div className="demo-strip"><div className="shell module-bar"><ModuleMenu flow={flow} screen={screen} /><span>{entry.label}</span><small>Interactive demo · sample data</small></div>{storageWarning && <p role="status" className="notice warn">Browser storage is unavailable. Changes will last for this session only.</p>}</div>;

  if (flow === "governance") return <div className="app">
    {switcher}
    <header><div className="shell bar">{brand}<nav className="links" aria-label="Governance">{tabs}</nav>{signOut}</div></header>
    <main className="shell content">
      <p className="eyebrow">{currentGroup?.label}</p>
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
        {screen === "history" && <ActivityHistory module={flow} />}
      </main>{footer}
    </div>
  </div></>;
}

