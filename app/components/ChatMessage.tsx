import type { BaseMessage } from "@/lib/slack";
import type { CSSProperties } from "react";

export const ChatMessage = ({ user, text, edited = false }: BaseMessage) => (
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
