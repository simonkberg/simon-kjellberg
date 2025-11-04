"use strict";

import { emojiParser } from "./emojiParser";
import { textParser } from "./textParser";

export const messageParser = (input: string) => emojiParser(textParser(input));
