import { fetchUpstreamJson } from "@/lib/drama/client";
import type { ProviderAdapter } from "@/lib/drama/types";
import {
  createEnvelope,
  createDramaEpisode,
  getNumber,
  proxiedStreamSource,
} from "@/lib/drama/utils";
import {
  getLang,
  getPage,
  getQuery,
  normalizeBookSections,
  normalizeLanguages,
  providerUrl,
  requireId,
  resolveEpisodeByIndex,
} from "@/lib/drama/providers/shared";
import type {
  MeloloDetailResponse,
  MeloloLanguageResponse,
  MeloloListResponse,
  MeloloStreamResponse,
} from "@/lib/drama/providers/melolo/types";

export const meloloAdapter: ProviderAdapter = {
  provider: "melolo",
  async execute(context) {
    switch (context.endpoint) {
      case "languages": {
        const payload = await fetchUpstreamJson<MeloloLanguageResponse>(
          providerUrl("/melolo/languages"),
        );

        return createEnvelope(context, normalizeLanguages(payload.data));
      }
      case "home":
      case "popular":
      case "latest": {
        const page = getPage(context);
        const lang = getLang(context);
        const segment =
          context.endpoint === "home"
            ? "home"
            : context.endpoint === "popular"
              ? "populer"
              : "new";

        const payload = await fetchUpstreamJson<MeloloListResponse>(
          providerUrl(`/melolo/${segment}?page=${page}&lang=${lang}`),
        );

        return createEnvelope(context, {
          ...normalizeBookSections(context, payload.data, {
            sectionTitle: () => "Melolo",
          }),
          page,
        });
      }
      case "search": {
        const page = getPage(context);
        const lang = getLang(context);
        const query = getQuery(context);
        const result = getNumber(context.searchParams, "result", 10) ?? 10;

        const payload = await fetchUpstreamJson<MeloloListResponse>(
          providerUrl(
            `/melolo/search?q=${encodeURIComponent(query)}&result=${result}&page=${page}&lang=${lang}`,
          ),
        );

        return createEnvelope(context, {
          ...normalizeBookSections(context, payload.data, {
            sectionTitle: () => `Search: ${query}`,
          }),
          page,
          keyword: query,
        });
      }
      case "detail": {
        const id = requireId(context);
        const payload = await fetchUpstreamJson<MeloloDetailResponse>(
          providerUrl(`/melolo/detail/${id}`),
        );

        return createEnvelope(context, {
          id: payload.data.drama_id,
          title: payload.data.drama_name,
          description: payload.data.description,
          episodeCount: payload.data.episode_count,
          tags: payload.data.tags ?? [],
          performers: [],
          episodes: (payload.data.video_list ?? []).map((item) =>
            createDramaEpisode(context, {
              id: item.video_id,
              number: item.episode,
              coverUrl: item.cover,
              duration: item.duration,
            }),
          ),
        });
      }
      case "stream": {
        const id = requireId(context);
        const episode = getNumber(context.searchParams, "episode", 1) ?? 1;
        const episodeId =
          context.searchParams.get("episodeId") ||
          (await resolveEpisodeByIndex<MeloloDetailResponse>(
            providerUrl(`/melolo/detail/${id}`),
            (payload) => payload.data.video_list ?? [],
            (item) =>
              item && typeof item === "object" && "video_id" in item
                ? String(item.video_id)
                : undefined,
            episode,
          ));

        const payload = await fetchUpstreamJson<MeloloStreamResponse>(
          providerUrl(`/melolo/stream/${episodeId}`),
        );

        return createEnvelope(context, {
          dramaId: id,
          episodeId,
          episodeNumber: episode,
          posterUrl: payload.data.poster,
          streams: (payload.data.qualities ?? [])
            .filter((item) => item.url)
            .map((item) =>
              proxiedStreamSource(context.origin, item.url, {
                label: item.label ?? "default",
                quality: item.label,
                codec: item.codec,
                bitrate:
                  typeof item.bitrate === "number"
                    ? String(item.bitrate)
                    : undefined,
              }),
            ),
          subtitles: [],
        });
      }
    }
  },
};
