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

/** The Discord syntax CommonMark lacks or reads differently. */
const extensions = [
  // CommonMark reads `__` as strong; Discord underlines. Only we make this node.
  rule("underline", "_", /__[\s\S]+?__(?!_)/y, ([match], context) => ({
    type: "inlineComponent",
    name: "u",
    attributes: {},
    children: context.parseInline(match.slice(2, -2)),
  })),
  // CommonMark's `*` and `_` open emphasis before a space; Discord's don't.
  rule("looseEmphasis", "*_", /[*_](?=\s)/y, ([match]) => ({
    type: "text",
    value: match,
  })),
  rule("hardBreak", " ", / {2,}\n/y, () => ({ type: "break" })),
  // Only http(s) and mailto, so these never need the parser's URL sanitising.
  rule("autolink", "<", /<https?:\/\/[^\s<>]+>/y, ([match]) =>
    link(match.slice(1, -1)),
  ),
  rule("mailto", "<", /<[^\s<>@]+@[^\s<>]+>/y, ([match]) =>
    link(`mailto:${match.slice(1, -1)}`, match.slice(1, -1)),
  ),
  rule(
    "url",
    "h",
    /(?<!\w)https?:\/\/[^\s<]+[^<.,:;"')\]\s]/y,
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
