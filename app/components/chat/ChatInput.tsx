"use client";

import {
  FormEvent,
  type PropsWithChildren,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { requestFormReset } from "react-dom";

import { postChatMessage, PostChatMessageResult } from "@/actions/chat";

import { CaretBuddy } from "./CaretBuddy";
import { ChatEmojiInput } from "./ChatEmojiInput";
import { ChatToast } from "./ChatToast";

export interface ChatInputProps extends PropsWithChildren {
  replyToId: string | null;
  setReplyToId: (id: string | null) => void;
}

export const ChatInput = ({
  replyToId,
  setReplyToId,
  children,
}: ChatInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<PostChatMessageResult>({
    status: "initial",
  });
  const [pending, startTransition] = useTransition();
  const [inputValue, setInputValue] = useState("");

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!inputValue.trim()) return;
    const form = event.currentTarget;

    startTransition(async () => {
      const formData = new FormData(form);
      if (replyToId) {
        formData.append("replyToId", replyToId);
      }
      const result = await postChatMessage(formData);

      if (result.status === "ok") {
        // Nested startTransition required: after await, we're outside the original transition context
        startTransition(() => {
          requestFormReset(form);
          setReplyToId(null);
          setInputValue("");
        });
      }

      setResult(result);
    });
  }

  useEffect(() => {
    if (!pending && result.status !== "initial") {
      inputRef.current?.focus();
    }
  }, [pending, result.status]);

  useEffect(() => {
    if (replyToId) {
      inputRef.current?.focus();
      const keyDownHandler = (event: KeyboardEvent) => {
        // A tooltip's Escape closes only the tooltip.
        if (event.key === "Escape" && !event.defaultPrevented) {
          setReplyToId(null);
        }
      };
      window.addEventListener("keydown", keyDownHandler);
      return () => {
        window.removeEventListener("keydown", keyDownHandler);
      };
    }

    return;
  }, [replyToId, setReplyToId]);

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
          <ChatEmojiInput
            name="text"
            placeholder={`Write a ${replyToId ? "reply" : "message"}...`}
            disabled={pending}
            className="input"
            ref={inputRef}
            value={inputValue}
            onValueChange={setInputValue}
            autoComplete="off"
          />
          <CaretBuddy
            inputValue={inputValue}
            isPending={pending}
            resultStatus={result.status}
          />
        </div>
        {children}
      </form>
    </>
  );
};
