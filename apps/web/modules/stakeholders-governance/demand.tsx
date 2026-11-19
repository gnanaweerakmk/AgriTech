import Link from "next/link";
import { redirect } from "next/navigation";
import { apiRequest, type Principal } from "../../lib/api";

type Limit = { region: string; crop: string; limitKg: number };
const route = "/v1/governance/demand-limits";

async function saveLimit(form: FormData) {
  "use server";
  const rawLimit = String(form.get("limit") ?? "");
  if (!/^\d{1,10}$/.test(rawLimit)) redirect("/governance/demand?result=invalid");
  const result = await apiRequest<Limit>(route, {
    region: String(form.get("region") ?? ""), crop: String(form.get("crop") ?? ""), limitKg: Number(rawLimit),
  });
  redirect("/governance/demand?result=" + (result.ok ? "saved" : String(result.status)));
}

export default async function DemandLimits({ searchParams }: { searchParams: Promise<{ result?: string }> }) {
  const session = await apiRequest<Principal>("/v1/governance/session");
  if (!session.ok && session.status === 401) redirect("/?error=expired");
  const limits = session.ok ? await apiRequest<Limit[]>(route) : session;
  const result = (await searchParams).result;
  return <main className="shell content">
    <div className="links"><Link className="secondary" href="/governance">Escrow ledger</Link></div>
    <h1>Regional demand limits</h1>
    {result && <p role={result === "saved" ? "status" : "alert"}>{result === "saved" ? "Demand limit saved." : "The limit could not be saved. Check the fields and your permissions."}</p>}
    {!limits.ok ? <p role="alert">{limits.message}</p> : <section className="panel">
      {session.ok && session.data.roles.includes("super_admin") && <form action={saveLimit} className="panel-form">
        <div className="fields">
          <label>Region<input name="region" required maxLength={80} /></label>
          <label>Crop<input name="crop" required maxLength={80} /></label>
          <label>Limit (kg)<input name="limit" type="number" min={0} max={1000000000} step={1} required /></label>
        </div>
        <div><button className="button">Save limit</button></div>
      </form>}
      <div className="tableWrap"><table>
        <thead><tr><th>Region</th><th>Crop</th><th>Limit (kg)</th></tr></thead>
        <tbody>{limits.data.map(item => <tr key={JSON.stringify([item.region, item.crop])}><td>{item.region}</td><td>{item.crop}</td><td>{item.limitKg}</td></tr>)}</tbody>
      </table></div>
      {limits.data.length === 0 && <p>No demand limits have been configured.</p>}
    </section>}
  </main>;
}
