import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { config } from "@/config";

import GlobalError from "./global-error";

vi.mock(import("@/components/Layout"), () => import("@/mocks/layout"));

describe("GlobalError", () => {
  const retry = vi.fn();

  beforeEach(() => {
    render(
      <GlobalError error={new Error("Test error message")} retry={retry} />,
    );
  });

  it("should have correct title", () => {
    expect(document.title).toEqual(`Error - ${config.title}`);
  });

  it("should display error message", () => {
    expect(screen.getByText("Test error message")).toBeInTheDocument();
  });

  it("should display 'Something went wrong!' heading within Layout", () => {
    expect(
      within(screen.getByTestId("layout")).getByRole("heading", {
        name: "Something went wrong!",
        level: 2,
      }),
    ).toBeInTheDocument();
  });

  it("should call retry function when 'Try again' button is clicked", async () => {
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(retry).toHaveBeenCalledOnce();
  });
});
