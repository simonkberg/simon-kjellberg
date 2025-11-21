import { render, screen } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { describe, expect, it, vi } from "vitest";

import RootLayout from "./layout";

vi.mock(import("@/components/Layout"), () => ({
  Layout: ({ children }: PropsWithChildren) => (
    <div data-testid="layout">{children}</div>
  ),
}));

describe("RootLayout", () => {
  it("should render within Layout component", () => {
    render(<RootLayout>Test Content</RootLayout>);

    expect(screen.getByTestId("layout")).toBeInTheDocument();
  });

  it("should render children", () => {
    render(<RootLayout>Test Content</RootLayout>);

    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });
});
