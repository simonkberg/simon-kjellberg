"use client";

import { postChatMessage } from "@/actions/chat";
import { useActionState, useEffect, useRef } from "react";
import { ChatToast } from "./ChatToast";

export const ChatInput = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [result, action, pending] = useActionState(postChatMessage, {
    status: "initial",
  });

  useEffect(() => {
    if (!pending && result.status !== "initial") {
      if (inputRef.current) {
        if (result.status === "error" && result.input) {
          inputRef.current.value = result.input;
        }
        inputRef.current.focus();
      }
    }
  }, [pending, result]);

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
            ref={inputRef}
          />
        </div>
      </form>
    </>
  );
};
