import { NextRequest, NextResponse } from "next/server";
import { authConfig, sessionCookie, transactionCookie, webClient } from "../../../lib/auth";

export async function GET(request: NextRequest) {
  const config = authConfig();
  const [state, verifier, destination] = (request.cookies.get(transactionCookie)?.value ?? "").split(".");
  const query = request.nextUrl.searchParams;
  const code = query.get("code");
  const response = NextResponse.redirect(new URL("/?error=signin", config.app));
  response.headers.set("Cache-Control", "no-store");

  if (!state || !verifier || !code || query.get("state") !== state) return response;
  response.cookies.set(transactionCookie, "", { ...config.cookie, maxAge: 0 });

  try {
    const tokenResponse = await fetch(config.oidc + "/token", {
      method: "POST",
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: webClient,
        client_secret: config.secret,
        redirect_uri: config.callback,
        code,
        code_verifier: verifier,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });

    if (!tokenResponse.ok) return response;
    const tokens = await tokenResponse.json() as { access_token?: string; expires_in?: number };
    if (!tokens.access_token || !tokens.expires_in || tokens.expires_in <= 0) return response;
    response.cookies.set(sessionCookie, tokens.access_token, { ...config.cookie, maxAge: tokens.expires_in });
    response.headers.set("Location", new URL(destination === "leasing" ? "/leasing" : "/governance", config.app).toString());
  } catch {
    return response;
  }
  return response;
}
