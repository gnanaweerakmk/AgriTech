import Link from "next/link";
import { flowEntries, previewPath } from "../../lib/preview";

export default function About() {
  return <main className="shell content">
    <Link href="/" className="brand">AgriTech</Link>
    <h1>About AgriTech</h1>
    <p>AgriTech connects Sri Lanka’s agricultural stakeholders from land registration and cultivation through sales, transport and storage.</p>
    <nav className="links" aria-label="Demo workspaces">
      {flowEntries.map(([flow, entry]) => <Link className="secondary" key={flow} href={previewPath(flow)}>{entry.label}</Link>)}
    </nav>
  </main>;
}

