import "server-only";
import { isIPv6 } from "node:net";

import { headers } from "next/headers";

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

function groupsOf(part: string): number[] {
  if (part === "") return [];
  return part.split(":").flatMap((group) => {
    if (!group.includes(".")) return [Number.parseInt(group, 16)];
    const [a, b, c, d] = group.split(".").map(Number) as [
      number,
      number,
      number,
      number,
    ];
    return [(a << 8) | b, (c << 8) | d];
  });
}

function expand(ip: string): number[] {
  const [head, tail = ""] = ip.split("::") as [string, string?];
  const left = groupsOf(head);
  const right = groupsOf(tail);
  const elided = Array<number>(8 - left.length - right.length).fill(0);
  return [...left, ...elided, ...right];
}

// One IPv6 client usually holds a whole /64, so it could rotate addresses past a per-IP limit.
export function networkOf(ip: string): string {
  if (!isIPv6(ip)) return ip;
  const groups = expand(ip);
  if (
    groups.slice(0, 5).every((group) => group === 0) &&
    groups[5] === 0xffff
  ) {
    return groups
      .slice(6)
      .flatMap((group) => [group >> 8, group & 0xff])
      .join(".");
  }
  const prefix = groups.slice(0, 4).map((group) => group.toString(16));
  return `${prefix.join(":")}::/64`;
}
