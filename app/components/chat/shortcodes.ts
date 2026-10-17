import { type EmojiShortcodes, REACTION_EMOJI } from "@/lib/emoji";

const REACTION_SHORTCODES: EmojiShortcodes[] = REACTION_EMOJI.map(
  ({ emoji, name }) => [emoji, name],
);

let shortcodes: Promise<EmojiShortcodes[]> | undefined;
let failed = false;

/** Fetched on first use, so the full set never ships with the page; after a failure the next call retries. */
export function loadShortcodes(): Promise<EmojiShortcodes[]> {
  if (failed) {
    failed = false;
    shortcodes = undefined;
  }
  shortcodes ??= fetch("/api/emoji", { signal: AbortSignal.timeout(10_000) })
    .then((response) => {
      if (!response.ok) throw new Error(String(response.status));
      return response.json() as Promise<EmojiShortcodes[]>;
    })
    .catch(() => {
      failed = true;
      return REACTION_SHORTCODES;
    });
  return shortcodes;
}
