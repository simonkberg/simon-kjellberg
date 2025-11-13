"use server";

import { identifiers } from "@/lib/identifiers";
import { getSession } from "@/lib/session";
import { getHistory, type Message, postMessage } from "@/lib/slack";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { after, connection } from "next/server";
import { z } from "zod";

export type ChatHistoryResult =
  | { status: "ok"; messages: Message[] }
  | { status: "error"; error: string };

export async function getChatHistory(): Promise<ChatHistoryResult> {
  await connection();
  try {
    const messages = await getHistory();
    return { status: "ok", messages };
  } catch (error) {
    console.error("Error fetching chat history:", error);
    return { status: "error", error: "Failed to fetch chat history" };
  }
}

let rateLimiter: Ratelimit | undefined;

function getRateLimiter() {
  if (!rateLimiter) {
    rateLimiter = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(5, "30 s"),
      enableProtection: true,
      analytics: true,
      prefix: "ratelimit:chat",
    });
  }

  return rateLimiter;
}

export type PostChatMessageResult =
  | { status: "initial" }
  | { status: "ok"; message: Message }
  | { status: "error"; error: string; input?: string };

export async function postChatMessage(
  _prevState: PostChatMessageResult,
  formData: FormData,
): Promise<PostChatMessageResult> {
  const input = formData.get("text")?.toString();

  try {
    const text = z.string().parse(input);

    const { username } = await getSession();

    const req = await identifiers();
    const identifier = req.ip ?? username;
    const { success, pending } = await getRateLimiter().limit(identifier, req);

    after(pending);

    if (!success) {
      return {
        status: "error",
        error: "Rate limit exceeded. Please slow down.",
        input,
      };
    }

    const response = await postMessage(text, username);

    void logMessage(text, username);

    return { status: "ok", message: response };
  } catch (error) {
    console.error("Error posting chat message:", error);
    return { status: "error", error: "Failed to post chat message", input };
  }
}

async function logMessage(message: string, username: string) {
  const { ip } = await identifiers();
  console.log(`[Chat] [${ip}] ${username}: ${message}`);
}
