import { NextRequest, NextResponse } from "next/server";
import { authConfig, sessionCookie, transactionCookie, webClient } from "../../../lib/auth";

export function POST(request: NextRequest) {
  const config = authConfig();
  if (request.headers.get("origin") !== config.app.origin) {
    return new NextResponse("Invalid request origin.", { status: 403 });
  }

  const logout = new URL(config.oidc + "/logout");
  logout.search = new URLSearchParams({
    client_id: webClient,
    post_logout_redirect_uri: config.app.origin,
  }).toString();

  const response = NextResponse.redirect(logout, 303);
  response.cookies.set(sessionCookie, "", { ...config.cookie, maxAge: 0 });
  response.cookies.set(transactionCookie, "", { ...config.cookie, maxAge: 0 });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
