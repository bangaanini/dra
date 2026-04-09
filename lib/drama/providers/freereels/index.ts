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
  FreereelsDetailResponse,
  FreereelsLanguageResponse,
  FreereelsListResponse,
  FreereelsStreamResponse,
} from "@/lib/drama/providers/freereels/types";

export const freereelsAdapter: ProviderAdapter = {
  provider: "freereels",
  async execute(context) {
    switch (context.endpoint) {
      case "languages": {
        const payload = await fetchUpstreamJson<FreereelsLanguageResponse>(
          providerUrl("/freereels/languages"),
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

        const payload = await fetchUpstreamJson<FreereelsListResponse>(
          providerUrl(`/freereels/${segment}?page=${page}&lang=${lang}`),
        );

        return createEnvelope(context, {
          ...normalizeBookSections(context, payload.data, {
            sectionTitle: () => "FreeReels",
          }),
          page: payload.page ?? page,
          hasMore: payload.has_more,
        });
      }
      case "search": {
        const page = getPage(context);
        const lang = getLang(context);
        const query = getQuery(context);
        const payload = await fetchUpstreamJson<FreereelsListResponse>(
          providerUrl(
            `/freereels/search?query=${encodeURIComponent(query)}&page=${page}&lang=${lang}`,
          ),
        );

        return createEnvelope(context, {
          ...normalizeBookSections(context, payload.data, {
            sectionTitle: () => `Search: ${query}`,
          }),
          page: payload.page ?? page,
          hasMore: payload.has_more,
          keyword: query,
        });
      }
      case "detail": {
        const id = requireId(context);
        const lang = getLang(context);
        const payload = await fetchUpstreamJson<FreereelsDetailResponse>(
          providerUrl(`/freereels/detail?dramaId=${id}&lang=${lang}`),
        );

        return createEnvelope(context, {
          id: payload.data.drama_id,
          title: payload.data.drama_name,
          description: payload.data.description,
          posterUrl: payload.data.thumb_url,
          episodeCount: payload.data.episode_count,
          watchCount: payload.data.watch_value,
          tags: payload.data.tags ?? [],
          performers: [],
          free: payload.data.free,
          episodes: (payload.data.episode_list ?? []).map((item) =>
            createDramaEpisode(context, {
              id: item.episode_id,
              number: item.episode,
              title: item.name,
              locked: item.unlock === false,
            }),
          ),
        });
      }
      case "stream": {
        const id = requireId(context);
        const lang = getLang(context);
        const episode = getNumber(context.searchParams, "episode", 1) ?? 1;
        const payload = await fetchUpstreamJson<FreereelsStreamResponse>(
          providerUrl(`/freereels/stream?dramaId=${id}&episode=${episode}&lang=${lang}`),
        );

        const candidates = [
          payload.data.video_url,
          payload.data.m3u8_url,
          payload.data.h264_m3u8,
          payload.data.h265_m3u8,
        ].filter((value): value is string => Boolean(value));

        return createEnvelope(context, {
          dramaId: id,
          episodeId: payload.data.episode_id,
          episodeNumber: episode,
          title: payload.data.name,
          posterUrl: payload.data.cover,
          streams: candidates.map((url, index) =>
            proxiedStreamSource(context.origin, url, {
              label: index === 0 ? "default" : `alt-${index}`,
            }),
          ),
          subtitles: (payload.data.subtitles ?? [])
            .filter((item): item is { language?: string; type?: string; url: string; display_name?: string } => Boolean(item.url))
            .map((item) =>
              proxiedSubtitleTrack(context.origin, item.url, {
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
