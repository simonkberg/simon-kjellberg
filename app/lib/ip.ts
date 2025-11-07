"use server";

import { headers } from "next/headers";

export async function ip() {
  const headersList = await headers();
  const forwardedFor = headersList.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0] ?? "unknown";
  }
  return headersList.get("x-real-ip") ?? "unknown";
}
