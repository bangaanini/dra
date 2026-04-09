import { fetchUpstreamJson } from "@/lib/drama/client";
import type { ProviderAdapter } from "@/lib/drama/types";
import {
  createDramaEpisode,
  createEnvelope,
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
  ReelshortDetailResponse,
  ReelshortLanguageResponse,
  ReelshortListResponse,
  ReelshortStreamResponse,
} from "@/lib/drama/providers/reelshort/types";

export const reelshortAdapter: ProviderAdapter = {
  provider: "reelshort",
  async execute(context) {
    switch (context.endpoint) {
      case "languages": {
        const payload = await fetchUpstreamJson<ReelshortLanguageResponse>(
          providerUrl("/reelshort/languages"),
        );

        return createEnvelope(context, normalizeLanguages(payload.data));
      }
      case "home":
      case "popular":
      case "latest": {
        const lang = getLang(context);
        const segment =
          context.endpoint === "home"
            ? "home"
            : context.endpoint === "popular"
              ? "populer"
              : "new";

        const payload = await fetchUpstreamJson<ReelshortListResponse>(
          providerUrl(`/reelshort/${segment}?lang=${lang}`),
        );

        return createEnvelope(context, {
          ...normalizeBookSections(context, payload.data, {
            sectionTitle: () => "Reelshort",
          }),
        });
      }
      case "search": {
        const page = getPage(context);
        const lang = getLang(context);
        const query = getQuery(context);
        const payload = await fetchUpstreamJson<ReelshortListResponse>(
          providerUrl(
            `/reelshort/search?query=${encodeURIComponent(query)}&page=${page}&lang=${lang}`,
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
        const payload = await fetchUpstreamJson<ReelshortDetailResponse>(
          providerUrl(`/reelshort/detail?bookId=${id}&lang=${lang}`),
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
          episodes: (payload.data.video_list ?? []).map((item) =>
            createDramaEpisode(context, {
              id: item.chapterId,
              number: item.serialNumber ?? item.index,
              title: item.title,
              locked: item.isLocked,
            }),
          ),
        });
      }
      case "stream": {
        const id = requireId(context);
        const lang = getLang(context);
        const episode = getNumber(context.searchParams, "episode", 1) ?? 1;
        const chapterId =
          context.searchParams.get("chapterId") ||
          (await resolveEpisodeByIndex<ReelshortDetailResponse>(
            providerUrl(`/reelshort/detail?bookId=${id}&lang=${lang}`),
            (payload) => payload.data.video_list ?? [],
            (item) =>
              item && typeof item === "object" && "chapterId" in item
                ? String(item.chapterId)
                : undefined,
            episode,
          ));

        const payload = await fetchUpstreamJson<ReelshortStreamResponse>(
          providerUrl(
            `/reelshort/stream?bookId=${id}&chapterId=${chapterId}&lang=${lang}`,
          ),
        );

        return createEnvelope(context, {
          dramaId: id,
          episodeId: chapterId,
          episodeNumber: episode,
          streams: (payload.data.videoList ?? [])
            .filter((item) => item.playUrl)
            .map((item) =>
              proxiedStreamSource(context.origin, item.playUrl, {
                label: item.encode ?? "default",
                quality: item.dpi ? `${item.dpi}p` : undefined,
                codec: item.encode,
                bitrate: item.bitrate,
              }),
            ),
          subtitles: [],
        });
      }
    }
  },
};
