import { expect, test } from "vitest";
import * as emojiData from "./emojiData";

test("emojiData", () => {
  [...emojiData.keys].forEach((key) => {
    expect(emojiData.getEmoji(key)).toMatchSnapshot(key);
  });
});
