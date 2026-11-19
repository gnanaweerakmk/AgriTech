import Link from "next/link";
import { redirect } from "next/navigation";
import { apiRequest } from "../../lib/api";

const endpoint = "/v1/leasing/workspace";
type Workspace = {
  roles: string[];
  subject: string;
  rows: { plot: string; location: string; farmer: string; start: string; status: string; owned: boolean }[];
};

async function changeLease(form: FormData) {
  "use server";
  const result = await apiRequest(endpoint, Object.fromEntries(
    ["action", "plot", "location", "farmer", "start"].map(key => [key, String(form.get(key) ?? "")]),
  ));
  redirect("/leasing?" + new URLSearchParams(result.ok ? { saved: "1" } : { error: result.message }));
}

export default async function Leasing({ searchParams }: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const [workspace, feedback] = await Promise.all([apiRequest<Workspace>(endpoint), searchParams]);
  return <main className="shell content">
    <div className="links"><Link className="secondary" href="/preview/roles">Role workspaces</Link></div>
    <h1>Land leasing</h1>
    {feedback.saved && <p role="status">Lease workspace updated.</p>}
    {feedback.error && <p role="alert">{feedback.error}</p>}
    {!workspace.ok ? <>
      <p role="alert">{workspace.message}</p>
      <div><Link className="button" href="/auth/login?next=leasing">Sign in</Link></div>
    </> : <>
      {workspace.data.roles.includes("landowner") && <section className="panel">
        <h2>Publish a plot for lease</h2>
        <form action={changeLease} className="panel-form">
          <label>Plot reference<input name="plot" required maxLength={40} /></label>
          <label>Location<input name="location" required maxLength={160} /></label>
          <div><button className="button" name="action" value="Publish">Publish plot</button></div>
        </form>
      </section>}
      <section className="panel"><h2>Plots and requests</h2>
        {!workspace.data.rows.length && <p>No plots are available in your workspace.</p>}
        {workspace.data.rows.map(row => <article className="panel" key={JSON.stringify([row.plot, row.farmer])}>
          <h3>{row.plot} · {row.location}</h3>
          {row.status && <p>{row.start} · {row.status}</p>}
          {row.status === "Pending" && row.owned && row.farmer !== workspace.data.subject && workspace.data.roles.includes("landowner") &&
            <form action={changeLease} className="links">
              <input type="hidden" name="plot" value={row.plot} /><input type="hidden" name="farmer" value={row.farmer} />
              <button className="button" name="action" value="Approved">Approve</button>
              <button className="secondary" name="action" value="Rejected">Reject</button>
            </form>}
          {row.status === "" && !row.owned && workspace.data.roles.includes("farmer") &&
            <form action={changeLease} className="links">
              <input type="hidden" name="plot" value={row.plot} />
              <label>Lease start date<input type="date" name="start" required /></label>
              <button className="button" name="action" value="Request">Request lease</button>
            </form>}
        </article>)}
      </section>
    </>}
  </main>;
}
