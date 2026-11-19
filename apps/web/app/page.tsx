import Link from "next/link";

export default async function Home({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const error = (await searchParams).error;
  return (
    <div className="app">
      <header><div className="shell bar">
        <Link className="brand" href="/">AgriTech</Link>
        <nav className="links" aria-label="Account">
          <Link className="secondary" href="/about">About</Link>
          <Link className="button" href="/auth/login">Login / Sign Up</Link>
        </nav>
      </div></header>
      <main className="login">
        <section className="loginCard">
          <h1>Login to AgriTech</h1>
          {error === "signin" && <p role="alert">Sign-in failed. Check Keycloak is running and try again.</p>}
          {error === "expired" && <p role="status">Your session expired. Sign in to continue.</p>}
          <a className="button" href="/auth/login">Log in securely</a>
          <Link href="/register">Don&apos;t have an account?</Link>
          <Link className="secondary" href="/preview/governance/dashboard">Explore the demo</Link>
        </section>
      </main>
      <footer className="footer"><div className="shell">AgriTech · Growing better, together.</div></footer>
    </div>
  );
}

