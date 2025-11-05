import type { BaseMessage } from "@/lib/slack";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ChatMessage } from "./ChatMessage";

describe("ChatMessage", () => {
  const mockUser = {
    name: "TestUser",
    color: "hsl(0 100% 50%)",
  };

  const createMessage = (overrides?: Partial<BaseMessage>): BaseMessage => ({
    ts: "1234567890.123456",
    text: "Hello, world!",
    user: mockUser,
    edited: false,
    ...overrides,
  });

  it("renders the user name", () => {
    const message = createMessage();
    render(<ChatMessage {...message} />);

    expect(screen.getByText(/TestUser:/)).toBeInTheDocument();
  });

  it("renders the message text", () => {
    const message = createMessage({ text: "This is a test message" });
    render(<ChatMessage {...message} />);

    expect(screen.getByText("This is a test message")).toBeInTheDocument();
  });

  it("applies user color as CSS variable", () => {
    const message = createMessage();
    render(<ChatMessage {...message} />);

    const messageElement = screen.getByText(/TestUser:/).parentElement;
    expect(messageElement).toHaveStyle({ "--user-color": "hsl(0 100% 50%)" });
  });

  it("shows edited indicator when edited is true", () => {
    const message = createMessage({ edited: true });
    render(<ChatMessage {...message} />);

    expect(screen.getByText(/\(edited\)/)).toBeInTheDocument();
  });

  it("does not show edited indicator when edited is false", () => {
    const message = createMessage({ edited: false });
    render(<ChatMessage {...message} />);

    expect(screen.queryByText(/\(edited\)/)).not.toBeInTheDocument();
  });

  it("renders HTML content in text using dangerouslySetInnerHTML", () => {
    const message = createMessage({
      text: "<strong>Bold text</strong> and <em>italic text</em>",
    });
    render(<ChatMessage {...message} />);

    expect(screen.getByText("Bold text")).toBeInTheDocument();
    expect(screen.getByText("italic text")).toBeInTheDocument();
  });
});
