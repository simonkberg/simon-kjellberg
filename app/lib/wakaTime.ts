import { z } from "zod";

const wakaTimeStatSchema = z
  .object({ name: z.string(), percent: z.number() })
  .readonly();
const wakaTimeStatsSchema = z.array(wakaTimeStatSchema).readonly();
const wakaTimeStatsResponseSchema = z
  .object({ data: wakaTimeStatsSchema })
  .readonly();

export type WakaTimeStats = z.infer<typeof wakaTimeStatsSchema>;

export async function getStats(): Promise<WakaTimeStats> {
  const res = await fetch(
    "https://wakatime.com/share/@simonkberg/4a1baa98-ab8f-436e-ada0-8810ef941f76.json",
    { signal: AbortSignal.timeout(5000) },
  );
  const data = await res.json();
  return wakaTimeStatsResponseSchema.parse(data).data;
}
