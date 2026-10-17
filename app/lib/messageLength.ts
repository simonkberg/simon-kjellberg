/** The longest name `randomName` generates; its test keeps them in step. */
export const MAX_NAME_LENGTH = 28;

/** Discord's limit on a message's content, which a site post shares with its `username: ` prefix. */
export const MAX_CONTENT_LENGTH = 2000;

export const PREFIX_SEPARATOR = ": ";

export const maxTextLength = (nameLength: number) =>
  MAX_CONTENT_LENGTH - nameLength - PREFIX_SEPARATOR.length;

/** Fits beside the longest generated username, so the input needs no session. */
export const MAX_TEXT_LENGTH = maxTextLength(MAX_NAME_LENGTH);
