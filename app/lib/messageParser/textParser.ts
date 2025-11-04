const UID = Math.floor(Math.random() * 0x10000000000).toString(16);
const escapedChars = new Set<number>();
const escapedTags = new Set<string>();

const escapeChars = (string: string, char: string) => {
  const code = char.charCodeAt(0);

  if (!escapedChars.has(code)) {
    escapedChars.add(code);
  }

  const regex = new RegExp(`([${char}])`, "g");

  return string.replace(regex, `@-${UID}${code}-@`);
};

const unescapeChars = (string: string) => {
  if (escapedChars.size > 0) {
    const codes = Array.from(escapedChars.values()).join("|");
    const regex = new RegExp(`@-${UID}(${codes})-@`, "g");

    escapedChars.clear();

    return string.replace(regex, (_match: string, code: number) =>
      String.fromCharCode(code),
    );
  }

  return string;
};

const escapeTags = (source: string, ...tags: string[]) =>
  tags.reduce((acc, tag) => {
    if (!escapedTags.has(tag)) {
      escapedTags.add(tag);
    }

    const regex = new RegExp(`<(/)?(${tag})>`, "g");

    return acc.replace(regex, `@--$1${UID}$2--@`);
  }, source);

const unescapeTags = (string: string) => {
  if (escapedTags.size > 0) {
    const tags = Array.from(escapedTags.values()).join("|");
    const regex = new RegExp(`@--(/)?${UID}(${tags})--@`, "g");

    escapedTags.clear();

    return string.replace(regex, "<$1$2>");
  }

  return string;
};

const escapeCode = (string: string) =>
  string.replace(
    /([:*_~`])/gm,
    (_match, p1: string) => `&#${p1.charCodeAt(0)};`,
  );

type Format = [RegExp, string | ((match: string, ...args: string[]) => string)];

// order is important!
const formats: Format[] = [
  // code blocks
  [
    /\n?```([^]+?)```\n?/gm,
    (_match: string, code: string) =>
      escapeTags(
        `<pre><code>${escapeChars(
          escapeCode(code.replace(/^\n?([^]+?)\n?$/, "$1")),
          "\n",
        )}</code></pre>`,
        "pre",
        "code",
      ),
  ],
  // inline code
  [
    /`(.+?)`/g,
    (_match: string, code: string) =>
      escapeTags(`<code>${escapeCode(code)}</code>`, "code"),
  ],
  // links
  [
    /<([!#@])?(.+?)(?:\|(.+?))?>/g,
    (_match: string, prefix?: string, link?: string, title?: string) => {
      const content = title || link;

      if (prefix) {
        return prefix === "!" ? `@${content}` : `${prefix}${content}`;
      }

      return `<a href="${link}" target="_blank" rel="noopener noreferrer">${content}</a>`;
    },
  ],
  // bold
  [/\*(.+?)\*/g, "<strong>$1</strong>"],
  // escape emojis
  [/(:[\w_\-+]+_[\w_\-+]+:)/g, (match: string) => escapeChars(match, "_")],
  // italic
  [/_(.+?)_/g, "<em>$1</em>"],
  // strike through
  [/~(.+?)~/g, "<s>$1</s>"],
  // blockquotes (multi line)
  [/\n?^&gt;&gt;&gt;([^]+)\n?$/gm, "<blockquote>$1</blockquote>"],
  // blockquotes (single line)
  [/\n?^&gt;(.+?)\n?$/gm, "<blockquote>$1</blockquote>"],
  // line breaks
  [/\n/g, "<br>"],
];

const formatReducer = (
  string: string,
  [matcher, replacer]: [
    RegExp,
    string | ((match: string, ...rest: string[]) => string),
  ],
) =>
  typeof replacer === "string"
    ? string.replace(matcher, replacer)
    : string.replace(matcher, replacer);

export const textParser = (string: string) =>
  unescapeChars(unescapeTags(formats.reduce(formatReducer, string)));
