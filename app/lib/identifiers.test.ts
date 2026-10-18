import { headers } from "next/headers";
import { describe, expect, it, vi } from "vitest";

import { identifiers, networkOf } from "./identifiers";

vi.mock(import("next/headers"), () => ({ headers: vi.fn() }));

function identifiersFrom(init: HeadersInit) {
  vi.mocked(headers).mockResolvedValue(new Headers(init));
  return identifiers();
}

describe("identifiers", () => {
  it.each<[string, [string, string][], string]>([
    [
      "cf-connecting-ip over x-forwarded-for and x-real-ip",
      [
        ["cf-connecting-ip", "172.16.0.1"],
        ["x-forwarded-for", "192.168.1.1"],
        ["x-real-ip", "10.0.0.1"],
      ],
      "172.16.0.1",
    ],
    [
      "x-forwarded-for over x-real-ip",
      [
        ["x-forwarded-for", "192.168.1.1"],
        ["x-real-ip", "10.0.0.1"],
      ],
      "192.168.1.1",
    ],
    ["x-real-ip on its own", [["x-real-ip", "10.0.0.1"]], "10.0.0.1"],
    [
      "the first of several x-forwarded-for IPs",
      [["x-forwarded-for", "203.0.113.1, 198.51.100.1, 192.0.2.1"]],
      "203.0.113.1",
    ],
  ])("should take the IP from %s", async (_, init, ip) => {
    expect((await identifiersFrom(init)).ip).toBe(ip);
  });

  it("should return user agent from header", async () => {
    const result = await identifiersFrom([
      ["user-agent", "Custom User Agent/1.0"],
    ]);

    expect(result.userAgent).toBe("Custom User Agent/1.0");
  });

  it.each([
    ["::ffff:203.0.113.1", "203.0.113.1"],
    ["::ffff:cb00:7101", "203.0.113.1"],
    ["0:0:0:0:0:FFFF:CB00:7101", "203.0.113.1"],
    ["::ffff:203.0.113.1%eth0", "203.0.113.1"],
    ["::ffff:0:cb00:7101", "::ffff:0:cb00:7101"],
    ["fe80::1%eth0", "fe80::1"],
    ["2001:db8::1", "2001:db8::1"],
  ])("should read %s as %s", async (header, ip) => {
    expect((await identifiersFrom([["cf-connecting-ip", header]])).ip).toBe(ip);
  });

  it("should return undefined when headers are missing", async () => {
    const result = await identifiersFrom([]);

    expect(result.ip).toBeUndefined();
    expect(result.userAgent).toBeUndefined();
  });
});

describe("networkOf", () => {
  it.each([
    ["203.0.113.1", "203.0.113.1"],
    ["2001:db8:1:2:3:4:5:6", "2001:db8:1:2::/64"],
    ["2001:DB8:0001:0002::1", "2001:db8:1:2::/64"],
    ["2001:db8::1", "2001:db8:0:0::/64"],
    ["::1", "0:0:0:0::/64"],
    ["fe80::1", "fe80:0:0:0::/64"],
    ["1::2:3:4:5:1.2.3.4", "1:0:2:3::/64"],
  ])("keys %s as %s", (ip, network) => {
    expect(networkOf(ip)).toBe(network);
  });

  it("keys addresses in one /64 together", () => {
    expect(networkOf("2001:db8:1:2::a")).toBe(
      networkOf("2001:db8:1:2:ffff:ffff:ffff:ffff"),
    );
  });
});
