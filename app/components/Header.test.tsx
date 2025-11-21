import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Header } from "./Header";

describe("Header", () => {
  it("renders title with correct format", () => {
    render(<Header title="test" />);

    const link = screen.getByRole("link");
    expect(link).toHaveTextContent("#!/test");
  });

  it("links to homepage", () => {
    render(<Header title="test" />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/");
  });
});
