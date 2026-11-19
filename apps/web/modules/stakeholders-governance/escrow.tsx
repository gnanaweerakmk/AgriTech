import Link from "next/link";
import { redirect } from "next/navigation";
import { apiRequest, type Escrow, type Principal } from "../../lib/api";
import { closeEscrow, holdEscrow } from "./escrow-actions";

const dateFormat = new Intl.DateTimeFormat("en-LK", {
  dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Colombo",
});
const currency = new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR" });

export default async function Governance({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await apiRequest<Principal>("/v1/governance/session");
  if (!session.ok && session.status === 401) redirect("/?error=expired");

  const admin = session.ok && session.data.roles.includes("super_admin");
  const escrows = session.ok ? await apiRequest<Escrow[]>("/v1/payments/escrows") : null;
  const error = (await searchParams).error;

  return (
    <>
      <header>
        <div className="shell bar">
          <span className="brand">AgriTech <small>Governance</small></span>
          <form action="/auth/logout" method="post">
            <button className="secondary">Sign out</button>
          </form>
        </div>
      </header>
      <main className="shell content">
        {session.ok && <div><Link className="secondary" href="/governance/demand">Regional demand limits</Link></div>}
        <div className="heading">
          <div>
            <h1>Payment oversight</h1>
            <p>Review escrow activity in the local simulation.</p>
          </div>
          {session.ok && <span className="role">{admin ? "Super Admin" : "Auditor"} · {session.data.preferred_username}</span>}
        </div>
        {!session.ok && <section className="panel" role="alert">{session.message}</section>}
        {error && <p className="feedback" role="alert">{error}</p>}
        {admin && (
          <section className="panel">
            <h2>Record a simulated hold</h2>
            <form action={holdEscrow} className="holdForm">
              <label>Payment reference
                <input name="reference" required maxLength={80} pattern={"[A-Za-z0-9_\\-]{1,80}"} placeholder="ORDER-001" />
              </label>
              <label>Amount (LKR)
                <input name="amount" required inputMode="decimal" maxLength={13} placeholder="2500.00" />
              </label>
              <button className="button">Hold payment</button>
            </form>
          </section>
        )}
        {escrows && (
          <section className="panel">
            <h2>Escrow ledger</h2>
            {!escrows.ok ? <p role="alert">{escrows.message}</p> : (
              escrows.data.length > 0 ? (
                <div className="tableWrap">
                  <table>
                    <thead><tr><th>Reference</th><th>Amount</th><th>Status</th><th>History</th>{admin && <th>Actions</th>}</tr></thead>
                    <tbody>
                      {escrows.data.map((item) => (
                        <tr key={item.id}>
                          <th scope="row">{item.reference}</th>
                          <td>{currency.format(item.amountMinor / 100)}</td>
                          <td><span className={"status " + item.status}>{item.status}</span></td>
                          <td>
                            <details>
                              <summary>View events</summary>
                              <ul>
                                {item.events?.map((event) => (
                                  <li key={event.status}>
                                    <strong>{event.status}</strong> · {dateFormat.format(new Date(event.occurredAt))}
                                    <small>Actor ID: {event.actor}</small>
                                  </li>
                                ))}
                              </ul>
                            </details>
                          </td>
                          {admin && <td>{item.status === "held" && (
                            <form action={closeEscrow} className="rowActions">
                              <input type="hidden" name="id" value={item.id} />
                              <button className="secondary" name="status" value="released">Release</button>
                              <button className="secondary" name="status" value="refunded">Refund</button>
                            </form>
                          )}</td>}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <p>No escrow records yet.</p>
            )}
          </section>
        )}
      </main>
    </>
  );
}
