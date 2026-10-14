import "server-only";
import { gemoji } from "gemoji";

const EMOJI_BY_NAME = new Map(
  gemoji.flatMap(({ emoji, names }) => names.map((name) => [name, emoji])),
);

/** Turns `:joy:` into 😂, leaving unknown names as typed; Discord doesn't convert them either. */
export function replaceShortcodes(text: string): string {
  return text.replace(
    /:([\w+-]+):/g,
    (match, name: string) => EMOJI_BY_NAME.get(name) ?? match,
  );
}
