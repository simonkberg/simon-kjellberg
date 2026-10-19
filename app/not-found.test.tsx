import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import NotFound, { metadata } from "./not-found";

describe("metadata", () => {
  it("should have title and description, and no canonical", () => {
    expect(metadata).toEqual({
      title: "Not Found",
      description: "The page you are looking for does not exist.",
      alternates: { canonical: null },
    });
  });
});

describe("NotFound", () => {
  beforeEach(() => {
    render(<NotFound />);
  });

  it("should display 'Page not found!' heading", () => {
    expect(
      screen.getByRole("heading", { name: "Page not found!", level: 2 }),
    ).toBeInTheDocument();
  });

  it("should display description message", () => {
    expect(
      screen.getByText("The page you are looking for does not exist."),
    ).toBeInTheDocument();
  });
});
