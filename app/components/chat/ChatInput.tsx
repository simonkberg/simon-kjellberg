"use client";

import {
  ChangeEvent,
  FormEvent,
  type PropsWithChildren,
  type SyntheticEvent,
  Suspense,
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
} from "react";
import { requestFormReset } from "react-dom";

import { postChatMessage, PostChatMessageResult } from "@/actions/chat";

import { CaretBuddy } from "./CaretBuddy";
import {
  ChatEmojiSuggestions,
  prefetchShortcodes,
} from "./ChatEmojiSuggestions";
import { ChatToast } from "./ChatToast";

const SHORTCODE = /(?:^|\s):([\w+-]*)$/;

/** The shortcode typed up to the caret, without its colon. */
function typedShortcode(input: HTMLInputElement): string | null {
  const caret = input.selectionStart;
  if (caret === null || caret !== input.selectionEnd) return null;
  return SHORTCODE.exec(input.value.slice(0, caret))?.[1] ?? null;
}

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
  const [shortcode, setShortcode] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const suggestionsId = useId();
  const suggesting = shortcode !== null && !dismissed;

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
          setShortcode(null);
        });
      }

      setResult(result);
    });
  }

  // A dismissal holds only for the shortcode it closed on.
  function trackShortcode(input: HTMLInputElement) {
    const typed = typedShortcode(input);
    if (typed !== shortcode) setDismissed(false);
    setShortcode(typed);
  }

  function onChange(event: ChangeEvent<HTMLInputElement>) {
    setInputValue(event.target.value);
    trackShortcode(event.target);
  }

  function onSelect(event: SyntheticEvent<HTMLInputElement>) {
    trackShortcode(event.currentTarget);
  }

  function pickEmoji(emoji: string) {
    const input = inputRef.current;
    if (!input || shortcode === null) return;
    const caret = input.selectionStart ?? input.value.length;
    input.setRangeText(emoji, caret - shortcode.length - 1, caret, "end");
    setInputValue(input.value);
    setShortcode(null);
    input.focus();
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
          <input
            name="text"
            placeholder={`Write a ${replyToId ? "reply" : "message"}...`}
            disabled={pending}
            className="input"
            ref={inputRef}
            value={inputValue}
            onChange={onChange}
            onSelect={onSelect}
            onFocus={prefetchShortcodes}
            autoComplete="off"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={suggesting}
            aria-controls={suggestionsId}
          />
          {suggesting && (
            <Suspense>
              <ChatEmojiSuggestions
                id={suggestionsId}
                input={inputRef}
                query={shortcode}
                onPick={pickEmoji}
                onDismiss={() => setDismissed(true)}
              />
            </Suspense>
          )}
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
