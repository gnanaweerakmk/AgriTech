"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { apiRequest, type Escrow } from "../../lib/api";

function showError(message: string): never {
  redirect("/governance?" + new URLSearchParams({ error: message }));
}

export async function holdEscrow(form: FormData) {
  const reference = String(form.get("reference") ?? "").trim();
  const amount = String(form.get("amount") ?? "").trim();
  if (!/^\d{1,10}(\.\d{1,2})?$/.test(amount)) {
    showError("Enter an amount in LKR with up to two decimal places.");
  }
  const [whole, fractional = ""] = amount.split(".");
  const amountMinor = Number(whole) * 100 + Number(fractional.padEnd(2, "0"));
  const result = await apiRequest<Escrow>("/v1/payments/escrows", { reference, amountMinor });
  if (!result.ok) showError(result.message);
  revalidatePath("/governance");
  redirect("/governance");
}

export async function closeEscrow(form: FormData) {
  const id = String(form.get("id") ?? "");
  const status = form.get("status");
  if (!/^[\da-f]{8}(-[\da-f]{4}){3}-[\da-f]{12}$/.test(id) ||
      (status !== "released" && status !== "refunded")) {
    showError("Invalid escrow action.");
  }
  const result = await apiRequest<Escrow>("/v1/payments/escrows/" + id + "/close", { status });
  if (!result.ok) showError(result.message);
  revalidatePath("/governance");
  redirect("/governance");
}
