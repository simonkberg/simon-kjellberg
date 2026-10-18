import { SHORTCODES } from "@/lib/shortcodes";

export function GET() {
  return Response.json(SHORTCODES);
}
