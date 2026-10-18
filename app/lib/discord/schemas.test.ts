import { describe, expect, it } from "vitest";

import { displayName } from "./schemas";

describe("displayName", () => {
  const named = { username: "user", global_name: "Global" };

  it.each([
    ["the server nick", named, { nick: "Nick" }, "Nick"],
    ["the global name without a nick", named, { nick: null }, "Global"],
    [
      "the username without either",
      { ...named, global_name: null },
      {},
      "user",
    ],
    [
      "nothing for a user with no name",
      { bot: false, global_name: null },
      { nick: null },
      undefined,
    ],
  ])("should give %s", (_, user, member, expected) => {
    expect(displayName(user, member)).toBe(expected);
  });
});
