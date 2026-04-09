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
  DramawaveDetailResponse,
  DramawaveLanguageResponse,
  DramawaveListResponse,
  DramawaveStreamResponse,
} from "@/lib/drama/providers/dramawave/types";

export const dramawaveAdapter: ProviderAdapter = {
  provider: "dramawave",
  async execute(context) {
    switch (context.endpoint) {
      case "languages": {
        const payload = await fetchUpstreamJson<DramawaveLanguageResponse>(
          providerUrl("/dramawave/languages"),
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

        const payload = await fetchUpstreamJson<DramawaveListResponse>(
          providerUrl(`/dramawave/${segment}?page=${page}&lang=${lang}`),
        );

        return createEnvelope(context, {
          ...normalizeBookSections(context, payload.data, {
            sectionTitle: () => "Dramawave",
          }),
          page,
        });
      }
      case "search": {
        const page = getPage(context);
        const lang = getLang(context);
        const query = getQuery(context);
        const payload = await fetchUpstreamJson<DramawaveListResponse>(
          providerUrl(
            `/dramawave/search?q=${encodeURIComponent(query)}&page=${page}&lang=${lang}`,
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
        const payload = await fetchUpstreamJson<DramawaveDetailResponse>(
          providerUrl(`/dramawave/detail?id=${id}&lang=${lang}`),
        );

        return createEnvelope(context, {
          id: payload.data.drama_id,
          title: payload.data.drama_name,
          description: payload.data.description,
          posterUrl: payload.data.thumb_url,
          episodeCount: payload.data.episode_count,
          watchCount: payload.data.hot_score,
          tags: payload.data.tags ?? [],
          performers: (payload.data.performers ?? []).map((item) => item.name),
          originalLanguage: payload.data.original_language,
          episodes: (payload.data.episodeList ?? []).map((item) =>
            createDramaEpisode(context, {
              id: item.episode_id,
              number: item.index,
              price: item.episode_price,
            }),
          ),
        });
      }
      case "stream": {
        const id = requireId(context);
        const lang = getLang(context);
        const episode = getNumber(context.searchParams, "episode", 1) ?? 1;
        const payload = await fetchUpstreamJson<DramawaveStreamResponse>(
          providerUrl(`/dramawave/stream?dramaId=${id}&episode=${episode}&lang=${lang}`),
        );

        const candidates = [
          payload.data.video_url,
          payload.data.m3u8_url,
          payload.data.external_audio_h264_m3u8,
          payload.data.external_audio_h265_m3u8,
        ].filter((value): value is string => Boolean(value));

        return createEnvelope(context, {
          dramaId: id,
          episodeId: payload.data.id,
          episodeNumber: episode,
          title: payload.data.name,
          posterUrl: payload.data.cover,
          streams: candidates.map((url, index) =>
            proxiedStreamSource(context.origin, url, {
              label: index === 0 ? "default" : `alt-${index}`,
            }),
          ),
          subtitles: (payload.data.subtitle_list ?? [])
            .filter((item): item is { language?: string; type?: string; subtitle: string; display_name?: string } => Boolean(item.subtitle))
            .map((item) =>
              proxiedSubtitleTrack(context.origin, item.subtitle, {
                language: item.language ?? "unknown",
                label: item.display_name,
                type: item.type,
              }),
            ),
        });
      }
    }
  },
};
