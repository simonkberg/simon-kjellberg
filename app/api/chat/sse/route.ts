import { subscribe } from "@/lib/slack";
import { connection, type NextRequest, NextResponse } from "next/server";

const ping = ": ping\n\n";
const ignoreWriteErrors = () => {};

export async function GET(request: NextRequest) {
  await connection();
  const responseStream = new TransformStream();
  const writer = responseStream.writable.getWriter();
  const encoder = new TextEncoder();
  let aborted = false;

  const pingInterval = setInterval(() => {
    if (aborted) return;
    void writer.write(encoder.encode(ping)).catch(ignoreWriteErrors);
  }, 30_000);

  const unsubscribe = await subscribe((type) => {
    if (aborted) return;
    void writer
      .write(encoder.encode(`data: ${type}\n\n`))
      .catch(ignoreWriteErrors);
  });

  request.signal.addEventListener("abort", () => {
    aborted = true;
    unsubscribe();
    clearInterval(pingInterval);
    writer.close();
  });

  void writer.write(encoder.encode(ping)).catch(ignoreWriteErrors);

  return new NextResponse(responseStream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      Connection: "keep-alive",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}
