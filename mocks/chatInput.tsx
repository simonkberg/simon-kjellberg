import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import { ChatInput } from "@/components/chat/ChatInput";

export function renderChatInput(replyToId: string | null = null) {
  const setReplyToId = vi.fn();
  const user = userEvent.setup({ delay: null });
  const element = (replyToId: string | null) => (
    <ChatInput replyToId={replyToId} setReplyToId={setReplyToId}>
      <button type="button">Next</button>
    </ChatInput>
  );
  const view = render(element(replyToId));
  const input = screen.getByRole<HTMLInputElement>("combobox");

  return {
    user,
    input,
    setReplyToId,
    replyTo: (replyToId: string | null) => view.rerender(element(replyToId)),
    send: async (text: string) => {
      await user.type(input, text);
      await user.keyboard("{Enter}");
    },
  };
}
