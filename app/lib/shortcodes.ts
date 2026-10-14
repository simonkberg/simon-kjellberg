import "server-only";
import { gemoji } from "gemoji";

const EMOJI_BY_NAME = new Map(
  gemoji.flatMap(({ emoji, names }) => names.map((name) => [name, emoji])),
);

// Code, links and Discord custom emoji are left as typed: the capture keeps them as odd-indexed parts.
const VERBATIM = /(`+[\s\S]*?`+|https?:\/\/\S+|<a?:\w+:\d+>)/;

/** Turns `:joy:` into 😂, leaving unknown names as typed; Discord doesn't convert them either. */
export function replaceShortcodes(text: string): string {
  return text
    .split(VERBATIM)
    .map((part, index) =>
      index % 2 === 1
        ? part
        : part.replace(
            /(?<!\w):([\w+-]+):(?!\w)/g,
            (match, name: string) => EMOJI_BY_NAME.get(name) ?? match,
          ),
    )
    .join("");
}
