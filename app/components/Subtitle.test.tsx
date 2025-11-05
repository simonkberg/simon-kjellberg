import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Subtitle } from "./Subtitle";

describe("Subtitle", () => {
  it("renders children content", () => {
    render(<Subtitle>Test subtitle</Subtitle>);
    expect(screen.getByText("Test subtitle")).toBeInTheDocument();
  });
});
