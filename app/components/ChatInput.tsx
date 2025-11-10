"use client";

import { postChatMessage } from "@/actions/chat";
import { useActionState } from "react";
import { ChatToast } from "./ChatToat";

export const ChatInput = () => {
  const [result, action, pending] = useActionState(postChatMessage, {
    status: "pending",
  });

  return (
    <>
      <ChatToast
        variant={result.status === "error" ? "error" : "default"}
        message={
          !pending && result.status === "error" ? result.error : undefined
        }
      />
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
    </>
  );
};
