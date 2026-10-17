import {
  type CSSProperties,
  type Dispatch,
  type SetStateAction,
  Suspense,
} from "react";

import { Markdown } from "@/components/Markdown";
import { RelativeTime } from "@/components/RelativeTime";
import { Tooltip, useTooltip } from "@/components/Tooltip";
import type { Message } from "@/lib/discord/api";

import { ChatReactionList, ChatReactionPicker } from "./ChatReactions";

export interface ChatMessageProps extends Message {
  replyToId: string | null;
  setReplyToId: Dispatch<SetStateAction<string | null>>;
  /** Shown above the input while replying: just the text, without controls or reactions. */
  preview?: boolean;
}

const ChatReplyButton = ({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled: boolean;
}) => {
  const tooltip = useTooltip();

  return (
    <>
      <button
        aria-labelledby={tooltip.id}
        className="reply"
        onClick={onClick}
        disabled={disabled}
        {...tooltip.trigger}
      >
        ↩
      </button>
      <Tooltip {...tooltip.tooltip}>Reply</Tooltip>
    </>
  );
};

export const ChatMessage = ({
  id,
  user,
  content,
  edited,
  timestamp,
  reactions,
  replyToId,
  setReplyToId,
  preview = false,
}: ChatMessageProps) => (
  <article
    className="chat-message"
    data-id={id}
    style={{ "--user-color": user.color } as CSSProperties}
  >
    <span className="user">{user.name}: </span>
    <div className="text">
      <Markdown source={content} />
    </div>
    {edited && <small className="edited"> (edited) </small>}{" "}
    <small className="timestamp">
      <Suspense>
        <RelativeTime date={timestamp} style="narrow" />
      </Suspense>
    </small>{" "}
    {!preview && (
      <>
        <span className="actions">
          <ChatReplyButton
            onClick={() => setReplyToId(id)}
            disabled={replyToId === id}
          />
          {reactions.length === 0 && <ChatReactionPicker messageId={id} />}
        </span>
        {reactions.length > 0 && (
          <ChatReactionList messageId={id} reactions={reactions} />
        )}
      </>
    )}
  </article>
);

export default ChatMessage;
