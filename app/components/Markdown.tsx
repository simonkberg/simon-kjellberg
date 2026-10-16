import SimpleMarkdown from "@khanacademy/simple-markdown";
import { Fragment, type ReactNode } from "react";

/**
 * Renders inline markdown. We use simple-markdown's parser but not its React
 * output, which builds React 18 elements that React 19 rejects.
 */

/**
 * What `defaultInlineParse()` produces — the library types every node as
 * `{ type: string; [key: string]: any }`. `target` is absent on a `reflink`
 * whose definition never appears.
 */
type InlineNode =
  | { type: "text" | "inlineCode"; content: string }
  | { type: "br" }
  | { type: "em" | "strong" | "u" | "del"; content: InlineNode[] }
  | { type: "link"; content: InlineNode[]; target?: string; title?: string }
  | { type: "image"; alt: string };

/** Strips `javascript:`, `vbscript:` and `data:` targets. */
const sanitizeUrl = (target?: string): string | undefined =>
  SimpleMarkdown.sanitizeUrl(target) ?? undefined;

const renderNodes = (nodes: InlineNode[], tabIndex?: number): ReactNode[] =>
  nodes.map((node, index) => renderNode(node, index, tabIndex));

/** No `default`: excluding `undefined` makes a missing case a compile error. */
const renderNode = (
  node: InlineNode,
  key: number,
  tabIndex?: number,
): Exclude<ReactNode, undefined> => {
  switch (node.type) {
    case "text":
      return node.content;
    case "br":
      return <br key={key} />;
    case "em":
      return <em key={key}>{renderNodes(node.content, tabIndex)}</em>;
    case "strong":
      return <strong key={key}>{renderNodes(node.content, tabIndex)}</strong>;
    case "u":
      return <u key={key}>{renderNodes(node.content, tabIndex)}</u>;
    case "del":
      return <del key={key}>{renderNodes(node.content, tabIndex)}</del>;
    case "inlineCode":
      return <code key={key}>{node.content}</code>;
    case "link": {
      const href = sanitizeUrl(node.target);
      // Not a link: an href-less `<a>` looks like one but has no link role.
      return href === undefined ? (
        <Fragment key={key}>{renderNodes(node.content, tabIndex)}</Fragment>
      ) : (
        <a key={key} href={href} title={node.title} tabIndex={tabIndex}>
          {renderNodes(node.content, tabIndex)}
        </a>
      );
    }
    // Never an `<img>`: message authors choose the URL (tracking pixel, IP
    // logger). Discord doesn't render markdown images either.
    case "image":
      return node.alt;
  }
};

export interface MarkdownProps {
  source: string;
  /** For links, so a container managing its own tab order can take them out of it. */
  linkTabIndex?: number;
}

export const Markdown = ({ source, linkTabIndex }: MarkdownProps) => (
  <>
    {renderNodes(
      SimpleMarkdown.defaultInlineParse(source) as InlineNode[],
      linkTabIndex,
    )}
  </>
);
