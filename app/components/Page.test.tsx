import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { config } from "@/config";

import { Page } from "./Page";

describe("Page", () => {
  it("renders Header with config title", () => {
    render(
      <Page>
        <div>Page content</div>
      </Page>,
    );

    const heading = screen.getByRole("heading", { level: 1 });
    const link = screen.getByRole("link");

    expect(heading).toContainElement(link);
    expect(link).toHaveTextContent(`#!/${config.title}`);
    expect(link).toHaveAttribute("href", "/");
  });

  it("renders Header with section", () => {
    render(
      <Page section="Listening">
        <div>Page content</div>
      </Page>,
    );

    const link = screen.getByRole("link");
    expect(link).toHaveTextContent(`#!/${config.title}/Listening`);
  });

  it("renders children content", () => {
    render(
      <Page>
        <div>Page content</div>
      </Page>,
    );

    expect(screen.getByText("Page content")).toBeInTheDocument();
  });
});
