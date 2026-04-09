import { fetchUpstreamJson } from "@/lib/drama/client";
import type { ProviderAdapter } from "@/lib/drama/types";
import {
  createDramaEpisode,
  createEnvelope,
  getNumber,
  proxiedStreamSource,
  proxiedSubtitleTrack,
} from "@/lib/drama/utils";
import {
  getLang,
  getPage,
  getQuery,
  normalizeBookSections,
  normalizeLanguages,
  providerUrl,
  requireId,
} from "@/lib/drama/providers/shared";
import type {
  NetshortDetailResponse,
  NetshortLanguageResponse,
  NetshortListResponse,
  NetshortStreamResponse,
} from "@/lib/drama/providers/netshort/types";

export const netshortAdapter: ProviderAdapter = {
  provider: "netshort",
  async execute(context) {
    switch (context.endpoint) {
      case "languages": {
        const payload = await fetchUpstreamJson<NetshortLanguageResponse>(
          providerUrl("/netshort/languages"),
        );

        return createEnvelope(
          context,
          normalizeLanguages(payload.data, (item) => ({
            code: typeof item.code === "string" ? item.code : "unknown",
            name: typeof item.name === "string" ? item.name : "Unknown",
            locale: typeof item.full === "string" ? item.full : undefined,
          })),
        );
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

        const payload = await fetchUpstreamJson<NetshortListResponse>(
          providerUrl(`/netshort/${segment}?page=${page}&lang=${lang}`),
        );

        return createEnvelope(context, {
          ...normalizeBookSections(context, payload.data, {
            sectionTitle: () => "Netshort",
          }),
          page,
        });
      }
      case "search": {
        const page = getPage(context);
        const lang = getLang(context);
        const query = getQuery(context);
        const payload = await fetchUpstreamJson<NetshortListResponse>(
          providerUrl(
            `/netshort/search?query=${encodeURIComponent(query)}&page=${page}&lang=${lang}`,
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
        const lang = getLang(context);
        const payload = await fetchUpstreamJson<NetshortDetailResponse>(
          providerUrl(`/netshort/detail?dramaId=${id}&lang=${lang}`),
        );

        return createEnvelope(context, {
          id: payload.data.drama_id,
          title: payload.data.drama_name,
          description: payload.data.description,
          posterUrl: payload.data.thumb_url,
          episodeCount: payload.data.episode_count,
          tags: payload.data.tags ?? [],
          performers: [],
          isFinished: payload.data.is_finished,
          episodes: (payload.data.video_list ?? []).map((item) =>
            createDramaEpisode(context, {
              id: item.episode_id,
              number: item.episode,
              coverUrl: item.cover,
              locked: item.isLocked,
            }),
          ),
        });
      }
      case "stream": {
        const id = requireId(context);
        const lang = getLang(context);
        const episode = getNumber(context.searchParams, "episode", 1) ?? 1;
        const payload = await fetchUpstreamJson<NetshortStreamResponse>(
          providerUrl(`/netshort/stream?dramaId=${id}&episode=${episode}&lang=${lang}`),
        );

        return createEnvelope(context, {
          dramaId: payload.data.drama_id ?? id,
          episodeId: payload.data.episode_id,
          episodeNumber: payload.data.episode ?? episode,
          streams: (payload.data.videos ?? [])
            .filter((item) => item.url)
            .map((item) =>
              proxiedStreamSource(context.origin, item.url, {
                label: item.quality ?? "default",
                quality: item.quality,
              }),
            ),
          subtitles: (payload.data.subtitles ?? [])
            .filter((item): item is { language?: string; url: string; type?: string } => Boolean(item.url))
            .map((item) =>
              proxiedSubtitleTrack(context.origin, item.url, {
                language: item.language ?? "unknown",
                type: item.type,
              }),
            ),
        });
      }
    }
  },
};
