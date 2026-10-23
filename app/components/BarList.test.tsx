import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BarList, BarListSkeleton } from "./BarList";

describe("BarList", () => {
  it("renders each bar scaled to the largest", () => {
    render(
      <BarList
        bars={[
          { label: "Oct 22", value: 12 },
          { label: "Oct 23", value: 30 },
        ]}
      />,
    );

    const list = screen.getByRole("list");
    const items = within(list).getAllByRole("listitem");
    expect(list.style.getPropertyValue("--max")).toBe("30");
    expect(items[0]).toHaveTextContent("Oct 22 12");
    expect(items[0]?.style.getPropertyValue("--value")).toBe("12");
  });

  it("formats values with decimals and a unit", () => {
    render(
      <BarList
        bars={[{ label: "TypeScript", value: 45.67 }]}
        decimals={2}
        unit="%"
      />,
    );

    expect(screen.getByRole("listitem")).toHaveTextContent("TypeScript 45.67%");
  });

  it("keeps the bars' scale valid when every value is zero", () => {
    render(<BarList bars={[{ label: "TypeScript", value: 0 }]} />);

    expect(screen.getByRole("list").style.getPropertyValue("--max")).toBe("1");
  });
});

describe("BarListSkeleton", () => {
  it("announces loading without exposing the placeholder list", () => {
    render(<BarListSkeleton labelWidths={[6, 6]} valueWidth={4} />);

    expect(screen.getByRole("status")).toHaveTextContent("Loading");
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });
});
