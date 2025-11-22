import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { config } from "@/config";

import { Header } from "./Header";

describe("Header", () => {
  it("renders config title with correct format", () => {
    render(<Header />);

    const link = screen.getByRole("link");
    expect(link).toHaveTextContent(`#!/${config.title}`);
  });

  it("renders section when provided", () => {
    render(<Header section="Listening" />);

    const link = screen.getByRole("link");
    expect(link).toHaveTextContent(`#!/${config.title}/Listening`);
  });

  it("links to homepage", () => {
    render(<Header />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/");
  });
});
