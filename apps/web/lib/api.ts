import { cookies } from "next/headers";
import { sessionCookie } from "./auth";

export type Principal = {
  sub: string;
  preferred_username: string;
  roles: string[];
};

export type Status = "held" | "released" | "refunded";

export type Escrow = {
  id: string;
  reference: string;
  amountMinor: number;
  status: Status;
  createdAt: string;
  events?: { status: Status; actor: string; occurredAt: string }[];
};

export async function apiRequest<T>(
  path: string,
  body?: object,
): Promise<{ ok: true; data: T } | { ok: false; status: number; message: string }> {
  const token = (await cookies()).get(sessionCookie)?.value;
  if (!token) return { ok: false, status: 401, message: "Sign in to continue." };

  const endpoint = process.env.API_URL ?? "http://localhost:8081";
  try {
    const response = await fetch(new URL(path, endpoint), {
      method: body ? "POST" : "GET",
      headers: {
        Authorization: "Bearer " + token,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body && JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) {
      const error = await response.json() as { error?: string };
      return { ok: false, status: response.status, message: error.error ?? "The request failed." };
    }
    return { ok: true, data: await response.json() as T };
  } catch {
    return { ok: false, status: 503, message: "The AgriTech API is currently unavailable." };
  }
}
