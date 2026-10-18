import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ChatMarkdown } from "./ChatMarkdown";

const html = (source: string): string => {
  const { container } = render(<ChatMarkdown source={source} />);
  return container.innerHTML;
};

describe("ChatMarkdown", () => {
  it("renders plain text", () => {
    expect(html("Hello, world!")).toBe("Hello, world!");
  });

  it("renders emphasis and strong", () => {
    expect(html("**Bold** and *italic*")).toBe(
      "<strong>Bold</strong> and <em>italic</em>",
    );
  });

  it("renders underline, strikethrough and inline code", () => {
    expect(html("`code` and ~~del~~ and __u__")).toBe(
      "<code>code</code> and <del>del</del> and <u>u</u>",
    );
  });

  it("renders line breaks", () => {
    expect(html("line one  \nline two")).toBe("line one<br>line two");
  });

  it("renders explicit links, with an optional title", () => {
    expect(
      html('[link](https://simon.dev) and [t](https://x.dev "title")'),
    ).toBe(
      '<a href="https://simon.dev">link</a> and <a href="https://x.dev" title="title">t</a>',
    );
  });

  it("autolinks bare urls", () => {
    expect(html("the source is here: https://github.com/example/repo")).toBe(
      'the source is here: <a href="https://github.com/example/repo">https://github.com/example/repo</a>',
    );
  });

  it("does not autolink a url inside a word", () => {
    expect(html("xhttps://a.dev")).toBe("xhttps://a.dev");
  });

  it("does not autolink a url that is already a link's text", () => {
    expect(html("[https://a.dev](https://b.dev)")).toBe(
      '<a href="https://b.dev">https://a.dev</a>',
    );
  });

  it("autolinks bracketed urls and email addresses", () => {
    expect(html("<https://auto.link> and <a@b.com>")).toBe(
      '<a href="https://auto.link">https://auto.link</a> and <a href="mailto:a@b.com">a@b.com</a>',
    );
    expect(html("<mailto:a@b.com>")).toBe(
      '<a href="mailto:a@b.com">mailto:a@b.com</a>',
    );
  });

  it("does not embed images, keeping only the alt text", () => {
    expect(html("![alt](https://simon.dev/a.png)")).toBe("alt");
    expect(document.querySelector("img")).toBeNull();
  });

  it("honours backslash escapes", () => {
    expect(html("a \\* escaped")).toBe("a * escaped");
  });

  it("nests inline nodes", () => {
    expect(html("**bold with [a link](https://simon.dev)**")).toBe(
      '<strong>bold with <a href="https://simon.dev">a link</a></strong>',
    );
  });

  it("does not treat block syntax as blocks", () => {
    expect(html("# not a heading")).toBe("# not a heading");
  });

  describe("escaping", () => {
    it("renders html in the source as text, not markup", () => {
      expect(html("<script>alert(1)</script>")).toBe(
        "&lt;script&gt;alert(1)&lt;/script&gt;",
      );
    });

    it("escapes ampersands and quotes", () => {
      expect(html("& \"quotes\" 'single'")).toBe("&amp; \"quotes\" 'single'");
    });
  });

  it("leaves reference links as typed, as Discord does", () => {
    expect(html("[ref][9] ![ref][9]")).toBe("[ref][9] ![ref][9]");
  });

  describe("url sanitisation", () => {
    it("drops javascript: link targets, leaving no anchor", () => {
      expect(html("[xss](javascript:alert(1))")).toBe("xss");
      expect(document.querySelector("a")).toBeNull();
    });

    it("drops data: link targets, leaving no anchor", () => {
      expect(html("[x](data:text/html;base64,PHN2Zz4=)")).toBe("x");
      expect(document.querySelector("a")).toBeNull();
    });
  });

  it("gives emoji in text a tooltip, but not in code", () => {
    const { getAllByRole } = render(<ChatMarkdown source="🔥 **🔥** `🔥`" />);

    expect(getAllByRole("tooltip", { hidden: true })).toHaveLength(2);
  });
});
