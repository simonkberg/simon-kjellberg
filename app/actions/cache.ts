"use server";

import { refresh } from "next/cache";

export async function refreshClientCache() {
  refresh();
}
