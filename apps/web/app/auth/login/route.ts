import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { authConfig, transactionCookie, webClient } from "../../../lib/auth";

export function GET(request: Request) {
  if (!process.env.KEYCLOAK_WEB_SECRET) return NextResponse.redirect(new URL("/?error=signin", request.url));
  const config = authConfig();
  const state = randomBytes(32).toString("base64url");
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");

  const authorize = new URL(config.oidc + "/auth");
  authorize.search = new URLSearchParams({
    client_id: webClient,
    redirect_uri: config.callback,
    response_type: "code",
    scope: "openid",
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
  }).toString();

  const response = NextResponse.redirect(authorize);
  response.cookies.set(transactionCookie, state + "." + verifier + (new URL(request.url).searchParams.get("next") === "leasing" ? ".leasing" : ""), { ...config.cookie, maxAge: 300 });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
