import "server-only";
import { isDeniedIp } from "@/lib/ipDenyList";
import { log } from "@/lib/log";
import { rateLimit } from "@/lib/rateLimit";
import type { ErrorResult } from "@/lib/reactionResult";
import type { Username } from "@/lib/session";

/** Turns away a listed IP or one over its limit, with the error to show it. */
export async function admit(
  action: string,
  verb: string,
  ip: string | undefined,
  username: Username,
  limits: { limit: number; windowMs: number },
): Promise<ErrorResult | null> {
  if (ip !== undefined && isDeniedIp(ip)) {
    log.info({ ip, action }, "Denied a listed IP");
    return { status: "error", error: `${verb} from your network is blocked.` };
  }

  const result = await rateLimit(`${action}:${ip ?? username}`, limits);
  if (!result.success) {
    return {
      status: "error",
      error: `Rate limit exceeded. Wait ${result.retryAfterSeconds} seconds before trying again.`,
    };
  }
  return null;
}
