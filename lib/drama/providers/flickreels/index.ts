import { fetchUpstreamJson } from "@/lib/drama/client";
import type { DramaSection, ProviderAdapter } from "@/lib/drama/types";
import {
  createDramaEpisode,
  createDramaSummary,
  createEnvelope,
  getNumber,
  proxiedStreamSource,
} from "@/lib/drama/utils";
import {
  getLang,
  getPage,
  getQuery,
  normalizeLanguages,
  providerUrl,
  requireId,
} from "@/lib/drama/providers/shared";
import type {
  FlickreelsDetailResponse,
  FlickreelsHomeResponse,
  FlickreelsLanguageResponse,
  FlickreelsPopularResponse,
  FlickreelsSearchResponse,
  FlickreelsStreamResponse,
} from "@/lib/drama/providers/flickreels/types";

function mapPlaylet(
  context: Parameters<typeof createDramaSummary>[0],
  playlet: {
    id: string;
    title: string;
    cover?: string;
    cover_thumb?: string;
    total_episodes?: number;
    likes?: string;
    tags?: string[];
    introduce?: string;
  },
) {
  return createDramaSummary(context, {
    id: playlet.id,
    title: playlet.title,
    description: playlet.introduce,
    posterUrl: playlet.cover,
    posterThumbUrl: playlet.cover_thumb,
    episodeCount: playlet.total_episodes,
    likes: playlet.likes,
    tags: playlet.tags,
  });
}

export const flickreelsAdapter: ProviderAdapter = {
  provider: "flickreels",
  async execute(context) {
    switch (context.endpoint) {
      case "languages": {
        const payload = await fetchUpstreamJson<FlickreelsLanguageResponse>(
          providerUrl("/flickreels/languages"),
        );

        return createEnvelope(
          context,
          normalizeLanguages(payload.data, (item) => ({
            id: typeof item.id === "string" ? item.id : undefined,
            code: typeof item.code === "string" ? item.code : "unknown",
            name: typeof item.name === "string" ? item.name : "Unknown",
          })),
        );
      }
      case "home": {
        const page = getPage(context);
        const lang = getLang(context);
        const payload = await fetchUpstreamJson<FlickreelsHomeResponse>(
          providerUrl(`/flickreels/home?page=${page}&lang=${lang}`),
        );
        const items = payload.data.map((playlet) => mapPlaylet(context, playlet));

        return createEnvelope(context, {
          items,
          sections: [{ id: "home", title: "FlickReels", items }],
          page,
          nextPage: payload.next_page,
          total: payload.total,
        });
      }
      case "search": {
        const page = getPage(context);
        const lang = getLang(context);
        const query = getQuery(context);
        const payload = await fetchUpstreamJson<FlickreelsSearchResponse>(
          providerUrl(
            `/flickreels/search?query=${encodeURIComponent(query)}&page=${page}&lang=${lang}`,
          ),
        );
        const items = payload.data.map((playlet) => mapPlaylet(context, playlet));

        return createEnvelope(context, {
          items,
          sections: [{ id: "search", title: `Search: ${query}`, items }],
          page,
          total: payload.total,
          keyword: payload.keyword ?? query,
        });
      }
      case "popular": {
        const lang = getLang(context);
        const payload = await fetchUpstreamJson<FlickreelsPopularResponse>(
          providerUrl(`/flickreels/populer?lang=${lang}`),
        );

        const sections: DramaSection[] = payload.data.map((section, index) => {
          const items = (section.playlets ?? []).map((playlet) =>
            mapPlaylet(context, playlet),
          );

          return {
            id: String(section.rank_type ?? index + 1),
            title: section.name,
            items,
          };
        });

        return createEnvelope(context, {
          items: sections.flatMap((section) => section.items),
          sections,
        });
      }
      case "latest": {
        const page = getPage(context);
        const lang = getLang(context);
        const payload = await fetchUpstreamJson<FlickreelsHomeResponse>(
          providerUrl(`/flickreels/new?page=${page}&lang=${lang}`),
        );
        const items = payload.data.map((playlet) => mapPlaylet(context, playlet));

        return createEnvelope(context, {
          items,
          sections: [{ id: "latest", title: "Latest", items }],
          page,
          total: payload.total,
        });
      }
      case "detail": {
        const id = requireId(context);
        const lang = getLang(context);
        const payload = await fetchUpstreamJson<FlickreelsDetailResponse>(
          providerUrl(`/flickreels/detail?playlet_id=${id}&lang=${lang}`),
        );

        return createEnvelope(context, {
          id: payload.data.playlet_id,
          title: payload.data.title,
          description: payload.data.introduce,
          posterUrl: payload.data.cover,
          episodeCount: payload.data.upload_num ? Number(payload.data.upload_num) : undefined,
          tags: payload.data.tags ?? [],
          performers: [],
          episodes: (payload.data.episode_list ?? []).map((item) =>
            createDramaEpisode(context, {
              id: item.chapter_id,
              number: item.chapter_num,
              title: item.chapter_name,
            }),
          ),
        });
      }
      case "stream": {
        const id = requireId(context);
        const lang = getLang(context);
        const payload = await fetchUpstreamJson<FlickreelsStreamResponse>(
          providerUrl(`/flickreels/stream?playlet_id=${id}&lang=${lang}`),
        );

        const episode = getNumber(context.searchParams, "episode");
        const selected = payload.data.list?.find((item) =>
          episode ? item.chapter_num === episode : true,
        );

        const list = selected ? [selected] : payload.data.list ?? [];

        return createEnvelope(context, {
          dramaId: id,
          episodeId: selected?.chapter_id,
          episodeNumber: selected?.chapter_num,
          title: payload.data.title,
          posterUrl: payload.data.cover,
          streams: list
            .filter((item) => item.play_url)
            .map((item) =>
              proxiedStreamSource(context.origin, item.play_url, {
                label: `Episode ${item.chapter_num}`,
              }),
            ),
          subtitles: [],
        });
      }
    }
  },
};
