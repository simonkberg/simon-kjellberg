import {
  type CSSProperties,
  type Dispatch,
  type SetStateAction,
  Suspense,
} from "react";

import { Markdown } from "@/components/Markdown";
import { RelativeTime } from "@/components/RelativeTime";
import type { Message } from "@/lib/discord/api";

import { ChatReactionList, ChatReactionPicker } from "./ChatReactions";

export interface ChatMessageProps extends Message {
  replyToId: string | null;
  setReplyToId: Dispatch<SetStateAction<string | null>>;
  /** Shown above the input while replying: just the text, without controls or reactions. */
  preview?: boolean;
  /** The history's one tab stop; arrow keys move it between messages. */
  active?: boolean;
}

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
  active = false,
}: ChatMessageProps) => (
  <article
    className="chat-message"
    data-id={id}
    style={{ "--user-color": user.color } as CSSProperties}
    tabIndex={preview ? undefined : active ? 0 : -1}
  >
    <span className="user">{user.name}: </span>
    <div className="text">
      <Markdown source={content} linkTabIndex={preview || active ? 0 : -1} />
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
          <button
            aria-label="Reply"
            title="Reply"
            className="reply"
            onClick={() => setReplyToId(id)}
            disabled={replyToId === id}
            tabIndex={active ? 0 : -1}
          >
            ↩
          </button>
          {reactions.length === 0 && (
            <ChatReactionPicker messageId={id} tabIndex={active ? 0 : -1} />
          )}
        </span>
        {reactions.length > 0 && (
          <ChatReactionList
            messageId={id}
            reactions={reactions}
            tabIndex={active ? 0 : -1}
          />
        )}
      </>
    )}
  </article>
);

export default ChatMessage;
