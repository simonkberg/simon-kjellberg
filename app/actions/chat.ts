"use server";

import { getSession } from "@/lib/session";
import { getHistory, type Message, postMessage } from "@/lib/slack";
import { connection } from "next/server";
import { z } from "zod";

export type ChatHistoryResult =
  | { status: "ok"; messages: Message[] }
  | { status: "error"; error: string };

export const getChatHistory = async (): Promise<ChatHistoryResult> => {
  await connection();
  try {
    const messages = await getHistory();
    return { status: "ok", messages };
  } catch (error) {
    console.error("Error fetching chat history:", error);
    return { status: "error", error: "Failed to fetch chat history" };
  }
};

export type PostChatMessageResult =
  | { status: "ok"; message: Message }
  | { status: "error"; error: string };

export const postChatMessage = async (
  _prevState: PostChatMessageResult | null,
  formData: FormData,
): Promise<PostChatMessageResult> => {
  try {
    const text = z.string().parse(formData.get("text"));

    const { username } = await getSession();
    const response = await postMessage(text, username);

    return { status: "ok", message: response };
  } catch (error) {
    console.error("Error posting chat message:", error);
    return { status: "error", error: "Failed to post chat message" };
  }
};
