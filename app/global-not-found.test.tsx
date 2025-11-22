import { render, screen } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { describe, expect, it, vi } from "vitest";

import { config } from "@/config";

import GlobalNotFound, { metadata } from "./global-not-found";

vi.mock(import("@/components/Layout"), () => ({
  Layout: ({ children }: PropsWithChildren) => (
    <div data-testid="layout">{children}</div>
  ),
}));

describe("metadata", () => {
  it("should have correct title and description", () => {
    expect(metadata).toEqual({
      title: `Not Found - ${config.title}`,
      description: "The page you are looking for does not exist.",
    });
  });
});

describe("GlobalNotFound", () => {
  it("should render within Layout component", () => {
    render(<GlobalNotFound />);

    expect(screen.getByTestId("layout")).toBeInTheDocument();
  });

  it("should display 'Page not found!' heading", () => {
    render(<GlobalNotFound />);

    expect(
      screen.getByRole("heading", { name: "Page not found!", level: 2 }),
    ).toBeInTheDocument();
  });

  it("should display description message", () => {
    render(<GlobalNotFound />);

    expect(
      screen.getByText("The page you are looking for does not exist."),
    ).toBeInTheDocument();
  });
});
