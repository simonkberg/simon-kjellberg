import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { config } from "@/config";

import GlobalNotFound, { metadata, viewport } from "./global-not-found";

vi.mock(import("@/components/Layout"), () => import("@/mocks/layout"));

describe("metadata", () => {
  it("should have correct title and description", () => {
    expect(metadata).toEqual({
      title: `Not Found - ${config.title}`,
      description: "The page you are looking for does not exist.",
    });
  });
});

describe("viewport", () => {
  it("covers the safe areas", () => {
    expect(viewport).toEqual({ viewportFit: "cover" });
  });
});

describe("GlobalNotFound", () => {
  beforeEach(() => {
    render(<GlobalNotFound />);
  });

  it("should display 'Page not found!' heading within Layout", () => {
    expect(
      within(screen.getByTestId("layout")).getByRole("heading", {
        name: "Page not found!",
        level: 2,
      }),
    ).toBeInTheDocument();
  });

  it("should display description message", () => {
    expect(
      screen.getByText("The page you are looking for does not exist."),
    ).toBeInTheDocument();
  });
});
