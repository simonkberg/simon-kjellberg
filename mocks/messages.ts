import type { Message } from "@/lib/discord/api";

export const createMessage = (overrides?: Partial<Message>): Message => ({
  id: "msg-1",
  content: "Test message",
  user: { name: "TestUser", color: "hsl(0 100% 50%)" },
  edited: false,
  timestamp: new Date("2025-01-01T00:00:00.000000+00:00"),
  reactions: [],
  replies: [],
  ...overrides,
});
