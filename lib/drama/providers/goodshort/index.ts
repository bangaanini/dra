import { fetchUpstreamJson } from "@/lib/drama/client";
import type { ProviderAdapter } from "@/lib/drama/types";
import {
  createDramaEpisode,
  createEnvelope,
  proxiedStreamSource,
  toNumber,
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
  GoodshortDetailResponse,
  GoodshortLanguageResponse,
  GoodshortListResponse,
  GoodshortStreamResponse,
} from "@/lib/drama/providers/goodshort/types";

export const goodshortAdapter: ProviderAdapter = {
  provider: "goodshort",
  async execute(context) {
    switch (context.endpoint) {
      case "languages": {
        const payload = await fetchUpstreamJson<GoodshortLanguageResponse>(
          providerUrl("/goodshort/languages"),
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

        const payload = await fetchUpstreamJson<GoodshortListResponse>(
          providerUrl(`/goodshort/${segment}?page=${page}&lang=${lang}`),
        );

        return createEnvelope(context, {
          ...normalizeBookSections(context, payload.data, {
            sectionTitle: () => "Goodshort",
          }),
          page,
        });
      }
      case "search": {
        const page = getPage(context);
        const lang = getLang(context);
        const query = getQuery(context);

        const payload = await fetchUpstreamJson<GoodshortListResponse>(
          providerUrl(
            `/goodshort/search?query=${encodeURIComponent(query)}&page=${page}&lang=${lang}`,
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
        const payload = await fetchUpstreamJson<GoodshortDetailResponse>(
          providerUrl(`/goodshort/detail?bookId=${id}&lang=${lang}`),
        );

        return createEnvelope(context, {
          id: payload.data.drama_id,
          title: payload.data.drama_name,
          description: payload.data.description,
          posterUrl: payload.data.thumb_url,
          episodeCount: toNumber(payload.data.episode_count),
          watchCount: payload.data.watch_value,
          tags: payload.data.tags ?? [],
          performers: [],
          episodes: (payload.data.chapter_list ?? []).map((item) =>
            createDramaEpisode(context, {
              id: String(item.id),
              number: item.index + 1,
              title: item.chapterName,
            }),
          ),
        });
      }
      case "stream": {
        const id = requireId(context);
        const lang = getLang(context);
        const payload = await fetchUpstreamJson<GoodshortStreamResponse>(
          providerUrl(`/goodshort/stream?bookId=${id}&lang=${lang}`),
        );

        return createEnvelope(context, {
          dramaId: id,
          streams: (payload.data.downloadList ?? []).flatMap((item) =>
            (item.multiVideos ?? [])
              .filter((video) => video.filePath)
              .map((video) =>
                proxiedStreamSource(context.origin, video.filePath, {
                  label: `${item.chapterName ?? item.index + 1} ${video.type ?? ""}`.trim(),
                  quality: video.type,
                }),
              ),
          ),
          subtitles: [],
        });
      }
    }
  },
};
