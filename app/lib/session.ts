import "server-only";
import { errors, type JWTPayload, jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { z } from "zod";

import { env } from "@/lib/env";
import { log } from "@/lib/log";

export const UsernameSchema = z.string().brand("username");
export const SessionSchema = z.object({ username: UsernameSchema });

export type Username = z.infer<typeof UsernameSchema>;
export type Session = z.infer<typeof SessionSchema>;

const encoder = new TextEncoder();
const encodedKey = encoder.encode(env.SESSION_SECRET);
const previousKey =
  env.SESSION_SECRET_PREVIOUS && encoder.encode(env.SESSION_SECRET_PREVIOUS);

export async function encrypt(payload: Session) {
  return new SignJWT(payload satisfies JWTPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("365d")
    .sign(encodedKey);
}

export async function decrypt(session: string | undefined) {
  if (!session) return;

  try {
    const { payload } = await verify(session);
    return SessionSchema.parse(payload);
  } catch (err) {
    // A bad signature on a well-formed token is what a changed SESSION_SECRET looks like.
    if (err instanceof errors.JWSSignatureVerificationFailed) {
      log.error({ err }, "Session signature didn't match a SESSION_SECRET");
    } else {
      log.warn({ err }, "Failed to verify session");
    }
    return;
  }
}

async function verify(session: string) {
  try {
    return await jwtVerify(session, encodedKey, { algorithms: ["HS256"] });
  } catch (err) {
    if (!previousKey || !(err instanceof errors.JWSSignatureVerificationFailed))
      throw err;
    return jwtVerify(session, previousKey, { algorithms: ["HS256"] });
  }
}

async function readSession() {
  const cookieJar = await cookies();
  return decrypt(cookieJar.get("session")?.value);
}

export async function getSession() {
  const session = await readSession();

  // proxy.ts forwards a session on every request it matches.
  if (!session) throw new Error("No session on the request");

  return session;
}
