export const transactionCookie = "agritech_oauth";
export const sessionCookie = "agritech_access";
export const webClient = "agritech-web";

export function authConfig() {
  const app = new URL(process.env.APP_URL ?? "http://localhost:3000");
  const realm = process.env.KEYCLOAK_REALM_URL ?? "http://localhost:8080/realms/agritech";
  const secret = process.env.KEYCLOAK_WEB_SECRET;
  if (!secret) throw new Error("Set KEYCLOAK_WEB_SECRET in .env.local.");

  return {
    app,
    secret,
    oidc: realm.replace(/\/$/, "") + "/protocol/openid-connect",
    callback: new URL("/auth/callback", app).toString(),
    cookie: { httpOnly: true, secure: app.protocol === "https:", sameSite: "lax" as const, path: "/" },
  };
}
