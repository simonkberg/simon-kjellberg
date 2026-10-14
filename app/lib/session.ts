import "server-only";
import { type JWTPayload, jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { forbidden } from "next/navigation";
import { z } from "zod";

import { env } from "@/lib/env";
import { log } from "@/lib/log";

export const UsernameSchema = z.string().brand("username");
export const SessionSchema = z.object({ username: UsernameSchema });

export type Username = z.infer<typeof UsernameSchema>;
export type Session = z.infer<typeof SessionSchema>;

const secretKey = env.SESSION_SECRET;
const encodedKey = new TextEncoder().encode(secretKey);

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
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ["HS256"],
    });
    return SessionSchema.parse(payload);
  } catch (err) {
    log.error({ err }, "Failed to verify session");
    return;
  }
}

async function readSession() {
  const cookieJar = await cookies();
  return decrypt(cookieJar.get("session")?.value);
}

export async function getSession() {
  const session = await readSession();

  if (!session) {
    return forbidden();
  }

  return session;
}

/** The visitor's username, or null before the proxy has set their session cookie. */
export async function getUsername(): Promise<Username | null> {
  return (await readSession())?.username ?? null;
}
