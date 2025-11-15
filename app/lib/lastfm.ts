import "server-only";

import { env } from "@/lib/env";
import { z } from "zod";

abstract class AbstractLastFmClient {
  static #BASE_URL = "https://ws.audioscrobbler.com/2.0/";
  readonly #apiKey: string;

  constructor(apiKey: string) {
    this.#apiKey = apiKey;
  }

  protected async call<T extends z.ZodType>(
    method: string,
    schema: T,
    params: Record<string, unknown> = {},
  ) {
    const url = new URL(AbstractLastFmClient.#BASE_URL);
    url.searchParams.set("method", method);
    url.searchParams.set("api_key", this.#apiKey);
    url.searchParams.set("format", "json");
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, String(value));
    }

    const response = await fetch(url, { signal: AbortSignal.timeout(3000) });
    const json = await response.json();

    return schema.parse(json);
  }
}

export class LastFmClient extends AbstractLastFmClient {
  #user?: LastFmUserClient;

  get user() {
    if (!this.#user) {
      this.#user = new LastFmUserClient(env.LAST_FM_API_KEY);
    }

    return this.#user;
  }
}

const UserGetRecentTracksResponseSchema = z
  .object({
    recenttracks: z.object({
      track: z.array(
        z
          .object({
            mbid: z.string(),
            name: z.string(),
            artist: z
              .union([
                z.object({ mbid: z.string(), name: z.string() }),
                z.object({ mbid: z.string(), "#text": z.string() }),
              ])
              .transform((artist) =>
                "name" in artist ? artist.name : artist["#text"],
              ),
            album: z
              .object({ mbid: z.string(), "#text": z.string() })
              .transform((album) => album["#text"]),
            date: z
              .object({ uts: z.string(), "#text": z.string() })
              .optional()
              .transform((data) =>
                data ? new Date(Number(data.uts) * 1000) : undefined,
              ),
            loved: z
              .union([z.literal("0"), z.literal("1")])
              .optional()
              .transform((val) => val === "1"),
            "@attr": z.object({ nowplaying: z.string() }).optional(),
          })
          .transform((data) => ({
            id: data.mbid,
            name: data.name,
            artist: data.artist,
            album: data.album,
            playedAt: data.date,
            nowPlaying: !!data["@attr"]?.nowplaying,
            loved: data.loved,
          })),
      ),
    }),
  })
  .transform((data) => data.recenttracks.track);

export type UserGetRecentTracksResponse = z.infer<
  typeof UserGetRecentTracksResponseSchema
>;

class LastFmUserClient extends AbstractLastFmClient {
  async getRecentTracks(
    user: string,
    params?: {
      limit?: number;
      page?: number;
    },
  ): Promise<UserGetRecentTracksResponse> {
    return this.call(
      "user.getrecenttracks",
      UserGetRecentTracksResponseSchema,
      { user, extended: 1, ...params },
    );
  }
}
