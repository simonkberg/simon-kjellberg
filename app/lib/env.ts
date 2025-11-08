import { createEnv } from "@t3-oss/env-nextjs";
import z from "zod";

export const env = createEnv({
  server: {
    SESSION_SECRET: z.string().default("UNSAFE"),
    SLACK_CHANNEL: z.string().default("DUMMY"),
    SLACK_TOKEN: z.string().default("DUMMY"),
  },
  runtimeEnv: {
    SESSION_SECRET: process.env["SESSION_SECRET"],
    SLACK_CHANNEL: process.env["SLACK_CHANNEL"],
    SLACK_TOKEN: process.env["SLACK_TOKEN"],
  },
});
