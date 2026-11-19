import Link from "next/link";
import { previewPath, type Flow } from "../../../lib/preview";

const workspaces: { title: string; roles: [string, Flow, string][] }[] = [
  { title: "Stakeholders & Governance", roles: [
    ["Super Admin", "governance", "dashboard"],
    ["Bank Officer", "governance", "offers"],
    ["Financial Auditor", "governance", "ledger"],
    ["Agricultural Officer", "governance", "plans"],
    ["Consumer Affairs Authority", "governance", "demand"],
    ["Land Registry and Environmental Authority", "governance", "land"],
  ] },
  { title: "Crop & Land", roles: [["Farmer", "cultivation", "overview"], ["Landowner", "cultivation", "owner"]] },
  { title: "Buyers & Sellers", roles: [["Seller", "market", "listings"], ["Buyer", "market", "marketplace"]] },
  { title: "Transport & Logistics", roles: [["Transport requester", "transport", "book"], ["Driver", "transport", "driver"], ["Vehicle owner", "transport", "fleet"]] },
  { title: "Storage & Inventory", roles: [["Warehouse operator", "storage", "settings"]] },
];

export default function RoleDirectory() {
  return <main className="shell content">
    <div><Link className="secondary" href={previewPath("governance", "registration")}>Registration Verification</Link></div>
    <h1>Role workspaces</h1>
    <p>Choose a role to open its sample web workspace.</p><div className="links"><Link className="button" href="/leasing">Open signed-in leasing workspace</Link><Link className="secondary" href="/governance">Protected escrow ledger</Link><Link className="secondary" href="/governance/demand">Protected regional demand limits</Link></div>
    <div className="split">{workspaces.map(({ title, roles }) => <section className="panel" key={title}>
      <h2>{title}</h2>
      <nav className="links" aria-label={title}>{roles.map(([role, flow, screen]) =>
        <Link className="secondary" href={previewPath(flow, screen)} key={role}>{role}</Link>
      )}</nav>
    </section>)}</div>
  </main>;
}
