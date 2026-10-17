/** Discord's limit on a message's content, which a site post shares with its `username: ` prefix. */
export const MAX_CONTENT_LENGTH = 2000;

/** Leaves room for the longest generated username's prefix, so the input needs no session. */
export const MAX_TEXT_LENGTH = 1970;

export const maxTextLength = (username: string) =>
  MAX_CONTENT_LENGTH - `${username}: `.length;
