import { headers } from "next/headers";
import { describe, expect, it, vi } from "vitest";

import { identifiers, networkOf } from "./identifiers";

vi.mock(import("server-only"), () => ({}));
vi.mock(import("next/headers"), () => ({ headers: vi.fn() }));

describe("identifiers", () => {
  it("should return IP from cf-connecting-ip header", async () => {
    vi.mocked(headers).mockResolvedValue(
      new Headers([["cf-connecting-ip", "172.16.0.1"]]),
    );

    const result = await identifiers();

    expect(result.ip).toBe("172.16.0.1");
  });

  it("should prefer cf-connecting-ip over x-forwarded-for and x-real-ip", async () => {
    vi.mocked(headers).mockResolvedValue(
      new Headers([
        ["cf-connecting-ip", "172.16.0.1"],
        ["x-forwarded-for", "192.168.1.1"],
        ["x-real-ip", "10.0.0.1"],
      ]),
    );

    const result = await identifiers();

    expect(result.ip).toBe("172.16.0.1");
  });

  it("should return IP from x-forwarded-for header", async () => {
    vi.mocked(headers).mockResolvedValue(
      new Headers([["x-forwarded-for", "192.168.1.1"]]),
    );

    const result = await identifiers();

    expect(result.ip).toBe("192.168.1.1");
  });

  it("should return IP from x-real-ip when x-forwarded-for is missing", async () => {
    vi.mocked(headers).mockResolvedValue(
      new Headers([["x-real-ip", "10.0.0.1"]]),
    );

    const result = await identifiers();

    expect(result.ip).toBe("10.0.0.1");
  });

  it("should use first IP when x-forwarded-for contains multiple IPs", async () => {
    vi.mocked(headers).mockResolvedValue(
      new Headers([
        ["x-forwarded-for", "203.0.113.1, 198.51.100.1, 192.0.2.1"],
      ]),
    );

    const result = await identifiers();

    expect(result.ip).toBe("203.0.113.1");
  });

  it("should prefer x-forwarded-for over x-real-ip when both present", async () => {
    vi.mocked(headers).mockResolvedValue(
      new Headers([
        ["x-forwarded-for", "192.168.1.1"],
        ["x-real-ip", "10.0.0.1"],
      ]),
    );

    const result = await identifiers();

    expect(result.ip).toBe("192.168.1.1");
  });

  it("should return user agent from header", async () => {
    vi.mocked(headers).mockResolvedValue(
      new Headers([["user-agent", "Custom User Agent/1.0"]]),
    );

    const result = await identifiers();

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
    vi.mocked(headers).mockResolvedValue(
      new Headers([["cf-connecting-ip", header]]),
    );

    expect((await identifiers()).ip).toBe(ip);
  });

  it("should return undefined when headers are missing", async () => {
    vi.mocked(headers).mockResolvedValue(new Headers());

    const result = await identifiers();

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
