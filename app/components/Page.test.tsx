import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Page } from "./Page";

describe("Page", () => {
  it("renders Header with title", () => {
    render(
      <Page title="test">
        <div>Page content</div>
      </Page>,
    );

    const heading = screen.getByRole("heading", { level: 1 });
    const link = screen.getByRole("link");

    expect(heading).toContainElement(link);
    expect(link).toHaveTextContent("#!/test");
    expect(link).toHaveAttribute("href", "/");
  });

  it("renders children content", () => {
    render(
      <Page title="test">
        <div>Page content</div>
      </Page>,
    );

    expect(screen.getByText("Page content")).toBeInTheDocument();
  });
});
