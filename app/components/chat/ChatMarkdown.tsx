import {
  type InlineNode,
  type InlineParseContext,
  type MarkdownExtension,
  parseInline,
} from "@tanstack/markdown";
import type { ReactNode } from "react";

import { EmojiText } from "./EmojiText";

const link = (href: string, text = href): InlineNode => ({
  type: "link",
  href,
  children: [{ type: "text", value: text }],
});

/** An inline parser for the text matching sticky `pattern` at the current index. */
const rule = (
  name: string,
  markers: string,
  pattern: RegExp,
  toNode: (
    match: RegExpExecArray,
    context: InlineParseContext,
  ) => InlineNode | undefined,
): MarkdownExtension => ({
  name,
  inlineParser: {
    markers,
    parse: (context) => {
      pattern.lastIndex = context.index;
      const match = pattern.exec(context.source);
      if (!match) return;
      const node = toNode(match, context);
      return node && { node, length: match[0].length };
    },
  },
});

const literal = ([value]: RegExpExecArray): InlineNode => ({
  type: "text",
  value,
});

const extensions = [
  // CommonMark reads `__` as strong; Discord underlines. Only we make this node.
  rule("underline", "_", /__[\s\S]+?__(?!_)/y, ([match], context) => ({
    type: "inlineComponent",
    name: "u",
    attributes: {},
    children: context.parseInline(match.slice(2, -2)),
  })),
  // Discord breaks every line; CommonMark only after two spaces.
  rule("break", "\n", /\n/y, () => ({ type: "break" })),
  // Discord pairs `*` only around non-spaces and leaves an unpaired one as typed.
  rule(
    "emphasis",
    "*",
    /\*(?=\S)(?:\*\*|\\[\s\S]|\s+(?:\\[\s\S]|[^\s*\\]|\*\*)|[^\s*\\])+?\*(?!\*)|\*(?!\*)/y,
    (match, context) =>
      match[0].length === 1
        ? literal(match)
        : {
            type: "emphasis",
            children: context.parseInline(match[0].slice(1, -1)),
          },
  ),
  // CommonMark (GFM) strikes `~a~`; Discord only strikes `~~a~~`.
  rule("singleTilde", "~", /~(?!~)/y, literal),
  // Discord shows a link as typed unless it targets http(s), mailto or tel and its text has no url.
  rule("unlinkable", "[", /\[[^\]]*\]\([^)]*\)/y, (match) =>
    /^\[[^\]]*https?:\/\//i.test(match[0]) ||
    !/\]\(\s*<?(?:https?|mailto|tel):/i.test(match[0])
      ? literal(match)
      : undefined,
  ),
  // Only http(s) and mailto, so these never need the parser's URL sanitising.
  rule("autolink", "<", /<https?:\/\/[^\s<>]+>/iy, ([match]) =>
    link(match.slice(1, -1)),
  ),
  rule(
    "mailto",
    "<",
    /<(?:mailto:)?[^\s<>@:]+@[^\s<>@]+\.[^\s<>@]+>/iy,
    ([match]) => {
      const text = match.slice(1, -1);
      return link(`mailto:${text.replace(/^mailto:/i, "")}`, text);
    },
  ),
  rule(
    "url",
    "h",
    // Unlike `<…>`, Discord links a bare url only with a lowercase scheme.
    // Balanced parentheses stay in the url, as in Wikipedia's `Foo_(bar)`.
    /https?:\/\/(?:\([^\s<()]*\)|[^\s<()])*(?:\([^\s<()]*\)|[^\s<().,:;"'\]])/y,
    ([url], { inLink }) => (inLink ? undefined : link(url)),
  ),
] satisfies MarkdownExtension[];

const renderNodes = (nodes: InlineNode[]): ReactNode[] =>
  nodes.map((node, index) => renderNode(node, index));

/** No `default`: excluding `undefined` makes a missing case a compile error. */
const renderNode = (
  node: InlineNode,
  key: number,
): Exclude<ReactNode, undefined> => {
  switch (node.type) {
    case "text":
      return <EmojiText key={key} text={node.value} />;
    case "break":
      return <br key={key} />;
    case "emphasis":
      return <em key={key}>{renderNodes(node.children)}</em>;
    case "strong":
      return <strong key={key}>{renderNodes(node.children)}</strong>;
    case "inlineComponent":
      return <u key={key}>{renderNodes(node.children)}</u>;
    case "strike":
      return <del key={key}>{renderNodes(node.children)}</del>;
    case "inlineCode":
      return <code key={key}>{node.value}</code>;
    // The parser turns a link with an unsafe target into its text.
    case "link":
      return (
        <a key={key} href={node.href} title={node.title}>
          {renderNodes(node.children)}
        </a>
      );
    // Never an `<img>`: message authors choose the URL (tracking pixel, IP
    // logger). Discord doesn't render markdown images either.
    case "image":
      return node.alt;
    // Only parsed with the `footnotes` and `allowHtml` options.
    /* v8 ignore start */
    case "footnoteReference":
    case "inlineHtml":
      return null;
    /* v8 ignore stop */
  }
};

export interface ChatMarkdownProps {
  source: string;
}

export const ChatMarkdown = ({ source }: ChatMarkdownProps) => (
  <>{renderNodes(parseInline(source, { extensions }))}</>
);
