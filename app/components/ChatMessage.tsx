import type { CSSProperties } from "react";

import type { BaseMessage } from "@/lib/slack";

export const ChatMessage = ({ user, text, edited }: BaseMessage) => (
  <div
    className="chat-message"
    style={{ "--user-color": user.color } as CSSProperties}
  >
    <span className="user">{user.name}: </span>
    <div className="text" dangerouslySetInnerHTML={{ __html: text }} />
    {edited && <small className="edited"> (edited) </small>}
  </div>
);

export default ChatMessage;
