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

  it("hides spoilers, with markdown inside, as Discord does", () => {
    expect(html("a ||**b** c|| d ||||")).toBe(
      'a <span class="spoiler" role="button" tabindex="0" aria-label="Spoiler"><span inert=""><strong>b</strong> c</span></span> d ||||',
    );
  });

  it("renders line breaks", () => {
    expect(html("line one\nline two  \nline three")).toBe(
      "line one<br>line two  <br>line three",
    );
  });

  it.each([
    ["2 * 3 * 4 _ 5 _", "2 * 3 * 4 _ 5 _"],
    ["foo *bar *", "foo *bar *"],
    ["*a * b*", "*a * b*"],
    ["*a *b*", "*a <em>b</em>"],
    ["x *a* * b*", "x <em>a</em> * b*"],
    ["*a **b** c*", "<em>a <strong>b</strong> c</em>"],
    ["*a `*` b*", "<em>a `</em>` b*"],
  ])("pairs %j's asterisks as Discord does", (source, expected) => {
    expect(html(source)).toBe(expected);
  });

  it("strikes through only double tildes, as Discord does", () => {
    expect(html("~~a~~ ~b~ ~5 min or ~10 min")).toBe(
      "<del>a</del> ~b~ ~5 min or ~10 min",
    );
  });

  it.each([
    "[xss](javascript:alert(1))",
    "[https://a.dev](https://b.dev)",
    "[<a@b.co>](https://b.com)",
  ])("leaves %j as typed, as Discord does", (source) => {
    expect(html(source)).toBe(
      source.replaceAll("<", "&lt;").replaceAll(">", "&gt;"),
    );
    expect(document.querySelector("a")).toBeNull();
  });

  it("renders explicit links, with an optional title", () => {
    expect(
      html('[a.dev](https://simon.dev) and [t](HTTPS://x.dev "title")'),
    ).toBe(
      '<a href="https://simon.dev">a.dev</a> and <a href="HTTPS://x.dev" title="title">t</a>',
    );
    expect(html("[x](mailto:a@b.com) [y](tel:123)")).toBe(
      '<a href="mailto:a@b.com">x</a> <a href="tel:123">y</a>',
    );
    expect(html("[a@b.co `http://x`](https://b.com)")).toBe(
      '<a href="https://b.com">a@b.co <code>http://x</code></a>',
    );
  });

  it("autolinks bare urls with a lowercase scheme, as Discord does", () => {
    expect(html("the source is here: https://github.com/example/repo")).toBe(
      'the source is here: <a href="https://github.com/example/repo">https://github.com/example/repo</a>',
    );
    expect(html("HTTPS://a.dev")).toBe("HTTPS://a.dev");
  });

  it("keeps balanced parentheses in a bare url", () => {
    expect(html("(see https://a.dev/x_(y))")).toBe(
      '(see <a href="https://a.dev/x_(y)">https://a.dev/x_(y)</a>)',
    );
  });

  it("never nests a link inside a link", () => {
    expect(html("[a [https://a.dev] b](https://b.dev)")).toBe(
      '<a href="https://b.dev">a [https://a.dev] b</a>',
    );
  });

  it("autolinks bracketed urls and email addresses", () => {
    expect(html("<https://auto.link> and <a@b.com>")).toBe(
      '<a href="https://auto.link">https://auto.link</a> and <a href="mailto:a@b.com">a@b.com</a>',
    );
    expect(html("<HTTPS://a.dev>")).toBe(
      '<a href="HTTPS://a.dev">HTTPS://a.dev</a>',
    );
    expect(html("<mailto:a@b.com>")).toBe(
      '<a href="mailto:a@b.com">mailto:a@b.com</a>',
    );
    expect(html("<a@b> a@b.com")).toBe("&lt;a@b&gt; a@b.com");
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

  it("never links an unlinkable target the parser reads differently", () => {
    expect(html("[a [b] c](javascript:alert(1))")).toBe("a [b] c");
    expect(document.querySelector("a")).toBeNull();
  });

  it("gives emoji in text a tooltip, but not in code", () => {
    const { getAllByRole } = render(<ChatMarkdown source="🔥 **🔥** `🔥`" />);

    expect(getAllByRole("tooltip", { hidden: true })).toHaveLength(2);
  });
});
