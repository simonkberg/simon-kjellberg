import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ExternalLink } from "./ExternalLink";

describe("ExternalLink", () => {
  it("renders with correct attributes", () => {
    render(
      <ExternalLink href="https://example.com">Visit Example</ExternalLink>,
    );

    const link = screen.getByRole("link", { name: "Visit Example" });
    expect(link).toHaveAttribute("href", "https://example.com");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });
});
