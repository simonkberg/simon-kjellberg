/** The longest name `randomName` generates; its test keeps them in step. */
export const MAX_NAME_LENGTH = 28;

/** Discord's limit on a message's content, which a site post shares with its `username: ` prefix. */
export const MAX_CONTENT_LENGTH = 2000;

export const PREFIX_SEPARATOR = ": ";

const roomBeside = (nameLength: number) =>
  MAX_CONTENT_LENGTH - nameLength - PREFIX_SEPARATOR.length;

export const maxTextLength = (username: string) => roomBeside(username.length);

/** Fits beside the longest generated username, so the input needs no session. */
export const MAX_TEXT_LENGTH = roomBeside(MAX_NAME_LENGTH);
