import "server-only";
import { isIPv6 } from "node:net";

import { headers } from "next/headers";

const IPV4_MAPPED = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i;

export async function identifiers() {
  const headersList = await headers();
  return {
    ip:
      headersList.get("cf-connecting-ip") ??
      headersList.get("x-forwarded-for")?.split(",")[0] ??
      headersList.get("x-real-ip") ??
      undefined,
    userAgent: headersList.get("user-agent") ?? undefined,
  } as const;
}

// One IPv6 client usually holds a whole /64, so it could rotate addresses past a per-IP limit.
export function networkOf(ip: string): string {
  if (!isIPv6(ip)) return ip;
  const mapped = IPV4_MAPPED.exec(ip)?.[1];
  if (mapped !== undefined) return mapped;

  const [head = "", tail] = ip.split("::");
  const left = head === "" ? [] : head.split(":");
  const right = tail === undefined || tail === "" ? [] : tail.split(":");
  // A trailing dotted IPv4 part fills two groups.
  const rightGroups = right.length + (right.at(-1)?.includes(".") ? 1 : 0);
  const elided = tail === undefined ? 0 : 8 - left.length - rightGroups;
  const groups = [...left, ...Array<string>(elided).fill("0"), ...right];
  const prefix = groups
    .slice(0, 4)
    .map((group) => Number.parseInt(group, 16).toString(16));
  return `${prefix.join(":")}::/64`;
}
