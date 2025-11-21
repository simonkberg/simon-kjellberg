import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { PropsWithChildren } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { config } from "@/config";

import GlobalError from "./global-error";

vi.mock(import("@/components/Layout"), () => ({
  Layout: ({ children }: PropsWithChildren) => (
    <div data-testid="layout">{children}</div>
  ),
}));

describe("GlobalError", () => {
  const error = new Error("Test error message");
  const reset = vi.fn();

  afterEach(() => {
    reset.mockClear();
  });

  it("should have correct title", () => {
    render(<GlobalError error={error} reset={reset} />);

    expect(document.title).toEqual(`${config.title} - Error`);
  });

  it("should render within Layout component", () => {
    render(<GlobalError error={error} reset={reset} />);

    expect(screen.getByTestId("layout")).toBeInTheDocument();
  });

  it("should display error message", () => {
    render(<GlobalError error={error} reset={reset} />);

    expect(screen.getByText("Test error message")).toBeInTheDocument();
  });

  it("should display 'Something went wrong!' heading", () => {
    render(<GlobalError error={error} reset={reset} />);

    expect(
      screen.getByRole("heading", { name: "Something went wrong!", level: 2 }),
    ).toBeInTheDocument();
  });

  it("should call reset function when 'Try again' button is clicked", async () => {
    const user = userEvent.setup();
    render(<GlobalError error={error} reset={reset} />);

    const button = screen.getByRole("button", { name: "Try again" });
    await user.click(button);

    expect(reset).toHaveBeenCalledTimes(1);
  });
});
