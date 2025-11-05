import "server-only";

import { messageParser } from "@/lib/messageParser/messageParser";
import { RTMClient } from "@slack/rtm-api";
import { WebClient } from "@slack/web-api";
import DataLoader from "dataloader";
import { z } from "zod";
import { env } from "./env";
import { LruMap } from "./LruMap";
import { stringToColor } from "./stringToColor";

export interface User {
  readonly name: string;
  readonly color: string;
}

export interface BaseMessage {
  readonly ts: string;
  readonly text: string;
  readonly user: User;
  readonly edited: boolean;
}

export interface Message extends BaseMessage {
  readonly replies: BaseMessage[];
}

const sortByTs = (a: BaseMessage, b: BaseMessage) =>
  parseInt(a.ts, 10) - parseInt(b.ts, 10);

const flattenSettled = <T>(values: PromiseSettledResult<T>[]): (T | Error)[] =>
  values.map((value) =>
    value.status === "fulfilled" ? value.value : value.reason,
  );

const client = new WebClient(env.SLACK_TOKEN);
const rtmClient = new RTMClient(env.SLACK_TOKEN);
const channel = env.SLACK_CHANNEL;

const eventSchema = z.object({
  channel: z.string().optional(),
  subtype: z.string().optional(),
});

export const EVENT_CHAT_MESSAGE_ADDED = "CHAT_MESSAGE_ADDED" as const;
export const EVENT_CHAT_MESSAGE_EDITED = "CHAT_MESSAGE_EDITED" as const;
export const EVENT_CHAT_MESSAGE_DELETED = "CHAT_MESSAGE_DELETED" as const;

export async function subscribe(
  callback: (
    type:
      | typeof EVENT_CHAT_MESSAGE_ADDED
      | typeof EVENT_CHAT_MESSAGE_EDITED
      | typeof EVENT_CHAT_MESSAGE_DELETED,
  ) => void,
) {
  function subscriber(rawEvent: unknown) {
    const event = eventSchema.parse(rawEvent);

    if (event.channel === channel) {
      if (event.subtype == null || event.subtype === "bot_message") {
        callback(EVENT_CHAT_MESSAGE_ADDED);
      }

      if (event.subtype === "message_changed") {
        callback(EVENT_CHAT_MESSAGE_EDITED);
      }

      if (event.subtype === "message_deleted") {
        callback(EVENT_CHAT_MESSAGE_DELETED);
      }
    }
  }

  rtmClient.on("message", subscriber);

  if (!rtmClient.connected) {
    await rtmClient.start();
  }

  return function unsubscribe() {
    return void rtmClient.off("message", subscriber);
  };
}

export const postMessage = async (
  text: string,
  username: string,
): Promise<Message> => {
  const response = await client.chat.postMessage({
    channel,
    parse: "full",
    text,
    username,
  });

  return parseMessage(response.message);
};

const toUser = (name: string) => ({ name, color: stringToColor(name) });

const userLoader = new DataLoader<string, User>(
  (keys) =>
    Promise.allSettled(
      keys.map(async (user: string) => {
        const response = await client.users.info({ user });
        return toUser(response.user?.name ?? user);
      }),
    ).then(flattenSettled),
  { cacheMap: new LruMap(100) },
);

const slackMessageSchema = z.object({
  ts: z.string(),
  text: z.string(),
  user: z.string().optional(),
  username: z.string().optional(),
  thread_ts: z.string().optional(),
  edited: z.preprocess((arg) => !!arg, z.boolean()),
});
type SlackMessage = z.infer<typeof slackMessageSchema>;

const parseUser = async (slackMessage: SlackMessage): Promise<User> => {
  if (slackMessage.username) return toUser(slackMessage.username);
  if (slackMessage.user) return userLoader.load(slackMessage.user);
  return toUser("unknown");
};

const parseBaseMessage = async (rawMessage: unknown): Promise<BaseMessage> => {
  const slackMessage = slackMessageSchema.parse(rawMessage);
  const user = await parseUser(slackMessage);

  return {
    ts: slackMessage.ts,
    text: messageParser(slackMessage.text),
    edited: slackMessage.edited,
    user,
  };
};

const parseMessage = async (rawMessage: unknown): Promise<Message> => {
  const slackMessage = slackMessageSchema.parse(rawMessage);
  const [user, replies] = await Promise.all([
    parseUser(slackMessage),
    slackMessage.ts === slackMessage.thread_ts
      ? getReplies(slackMessage.ts)
      : [],
  ]);

  return {
    ts: slackMessage.ts,
    text: messageParser(slackMessage.text),
    edited: slackMessage.edited,
    user,
    replies,
  };
};

export const getHistory = async (): Promise<Message[]> => {
  const response = await client.conversations.history({ channel });

  if (response.messages) {
    const messages = await Promise.all(response.messages.map(parseMessage));
    return messages.sort(sortByTs);
  }

  return [];
};

const getReplies = async (ts: string): Promise<BaseMessage[]> => {
  const response = await client.conversations.replies({ channel, ts });

  if (response.messages) {
    const messages = await Promise.all(
      response.messages
        .filter((message) => message.ts !== ts)
        .map(parseBaseMessage),
    );
    return messages.sort(sortByTs);
  }

  return [];
};
