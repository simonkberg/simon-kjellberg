"use client";

import { postChatMessage } from "@/actions/chat";
import { useActionState } from "react";

export const ChatInput = () => {
  const [, action, pending] = useActionState(postChatMessage, null);

  return (
    <form action={action} className="chat-input">
      <div className="wrapper">
        <input
          name="text"
          placeholder="Write a message..."
          disabled={pending}
          className="input"
        />
      </div>
    </form>
  );
};
