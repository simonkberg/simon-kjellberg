"use client";

import { postChatMessage, PostChatMessageResult } from "@/actions/chat";
import { FormEvent, useEffect, useRef, useState, useTransition } from "react";
import { requestFormReset } from "react-dom";
import { ChatToast } from "./ChatToast";

export const ChatInput = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<PostChatMessageResult>({
    status: "initial",
  });
  const [pending, startTransition] = useTransition();
  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;

    startTransition(async () => {
      const result = await postChatMessage(new FormData(form));

      if (result.status === "ok") {
        startTransition(() => requestFormReset(form));
      }

      setResult(result);
    });
  }

  useEffect(() => {
    if (!pending && result.status !== "initial") {
      inputRef.current?.focus();
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
      <form onSubmit={onSubmit} className="chat-input">
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
