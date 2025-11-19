import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Loader } from "./Loader";

describe("Loader", () => {
  it("renders loading status", () => {
    render(<Loader />);
    const loader = screen.getByRole("status");
    expect(loader).toHaveTextContent("Loading");
  });
});
