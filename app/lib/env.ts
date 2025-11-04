import { createEnv } from "@t3-oss/env-nextjs";
import z from "zod";

export const env = createEnv({
  server: {
    UID: z.string().default("UNSAFE"),
    SESSION_SECRET: z.string().default("UNSAFE"),
    SLACK_CHANNEL: z.string(),
    SLACK_TOKEN: z.string(),
  },
  runtimeEnv: {
    UID: process.env["UID"],
    SESSION_SECRET: process.env["SESSION_SECRET"],
    SLACK_CHANNEL: process.env["SLACK_CHANNEL"],
    SLACK_TOKEN: process.env["SLACK_TOKEN"],
  },
});
