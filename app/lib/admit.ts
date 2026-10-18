import "server-only";
import { isDeniedIp } from "@/lib/ipDenyList";
import { log } from "@/lib/log";
import { rateLimit } from "@/lib/rateLimit";
import type { ErrorResult } from "@/lib/reactionResult";
import type { Username } from "@/lib/session";

/** Why a request was turned away: the error to show it, and the HTTP status a route answers with. */
export interface Denial {
  httpStatus: 403 | 429;
  result: ErrorResult;
}

/** Turns away a listed IP or one over its limit. */
export async function admit(
  action: string,
  verb: string,
  ip: string | undefined,
  username: Username,
  limits: { limit: number; windowMs: number },
): Promise<Denial | null> {
  if (ip !== undefined && isDeniedIp(ip)) {
    log.info({ ip, action }, "Denied a listed IP");
    return {
      httpStatus: 403,
      result: {
        status: "error",
        error: `${verb} from your network is blocked.`,
      },
    };
  }

  const limited = await rateLimit(`${action}:${ip ?? username}`, limits);
  if (!limited.success) {
    return {
      httpStatus: 429,
      result: {
        status: "error",
        error: `Rate limit exceeded. Wait ${limited.retryAfterSeconds} seconds before trying again.`,
      },
    };
  }
  return null;
}
