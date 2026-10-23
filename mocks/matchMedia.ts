import { vi } from "vitest";

/** Stubs `prefers-reduced-motion`; the returned function changes it and fires `change`. */
export function mockReducedMotion(matches: boolean) {
  const query = matchMedia("(prefers-reduced-motion: reduce)");
  const get = vi.spyOn(query, "matches", "get").mockReturnValue(matches);
  vi.spyOn(window, "matchMedia").mockReturnValue(query);
  return (next: boolean) => {
    get.mockReturnValue(next);
    query.dispatchEvent(new Event("change"));
  };
}
