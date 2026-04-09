import type {
  ApiEnvelope,
  DramaEpisode,
  DramaSummary,
  EndpointContext,
  EndpointName,
  ProviderName,
  StreamSource,
  SubtitleTrack,
} from "@/lib/drama/types";

export function getAuthorName() {
  return process.env.SITE_AUTHOR?.trim() || "Aan";
}

export function createEnvelope<T>(
  context: Pick<EndpointContext, "author" | "provider" | "endpoint">,
  data: T,
): ApiEnvelope<T> {
  return {
    author: context.author,
    provider: context.provider,
    message: "success",
    type: context.endpoint,
    data,
  };
}

export function getString(
  searchParams: URLSearchParams,
  key: string,
  fallback?: string,
) {
  const value = searchParams.get(key)?.trim();
  return value || fallback;
}

export function getNumber(
  searchParams: URLSearchParams,
  key: string,
  fallback?: number,
) {
  const raw = searchParams.get(key);
  if (!raw) {
    return fallback;
  }

  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
}

export function toNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

export function toBoolean(value: unknown) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value !== 0;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["1", "true", "yes"].includes(normalized)) {
      return true;
    }

    if (["0", "false", "no"].includes(normalized)) {
      return false;
    }
  }

  return undefined;
}

export function toStringList(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (typeof item === "string") {
        return item.trim();
      }

      if (item && typeof item === "object" && "name" in item) {
        const name = item.name;
        return typeof name === "string" ? name.trim() : "";
      }

      return "";
    })
    .filter(Boolean);
}

export function detectFormat(url: string): StreamSource["format"] {
  const normalized = url.toLowerCase();
  if (normalized.includes(".m3u8")) {
    return "m3u8";
  }

  if (normalized.includes(".mp4")) {
    return "mp4";
  }

  return "unknown";
}

export function detectSubtitleFormat(url: string): SubtitleTrack["format"] {
  const normalized = url.toLowerCase();
  if (normalized.includes(".vtt")) {
    return "vtt";
  }

  if (normalized.includes(".srt")) {
    return "srt";
  }

  return "unknown";
}

export function isAbsoluteHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function createMediaProxyUrl(origin: string, sourceUrl: string) {
  const url = new URL("/api/drama/media", origin);
  url.searchParams.set("url", sourceUrl);
  return url.toString();
}

export function createEndpointUrl(
  origin: string,
  provider: ProviderName,
  endpoint: EndpointName,
  params: Record<string, string | number | undefined>,
) {
  const url = new URL(`/api/drama/${provider}/${endpoint}`, origin);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  return url.toString();
}

export function createDramaSummary(
  context: EndpointContext,
  input: {
    id: string;
    title: string;
    description?: string;
    posterUrl?: string;
    posterThumbUrl?: string;
    episodeCount?: number;
    watchCount?: string;
    likes?: string;
    followCount?: string;
    tags?: string[];
    language?: string;
    isFinished?: boolean;
    isNew?: boolean;
  },
): DramaSummary {
  return {
    id: input.id,
    title: input.title,
    description: input.description,
    posterUrl: input.posterUrl,
    posterThumbUrl: input.posterThumbUrl,
    episodeCount: input.episodeCount,
    watchCount: input.watchCount,
    likes: input.likes,
    followCount: input.followCount,
    tags: input.tags ?? [],
    language: input.language,
    isFinished: input.isFinished,
    isNew: input.isNew,
    detailUrl: createEndpointUrl(context.origin, context.provider, "detail", {
      id: input.id,
      lang: getString(context.searchParams, "lang"),
    }),
  };
}

export function createDramaEpisode(
  context: EndpointContext,
  input: {
    id: string;
    number: number;
    title?: string;
    coverUrl?: string;
    duration?: number;
    locked?: boolean;
    price?: number;
    qualities?: string[];
  },
): DramaEpisode {
  return {
    id: input.id,
    number: input.number,
    title: input.title,
    coverUrl: input.coverUrl,
    duration: input.duration,
    locked: input.locked,
    price: input.price,
    qualities: input.qualities,
    streamUrl: createEndpointUrl(context.origin, context.provider, "stream", {
      id: getString(context.searchParams, "id"),
      lang: getString(context.searchParams, "lang"),
      episode: input.number,
    }),
  };
}

export function proxiedStreamSource(
  origin: string,
  sourceUrl: string,
  input: Omit<StreamSource, "url" | "format">,
): StreamSource {
  return {
    ...input,
    url: createMediaProxyUrl(origin, sourceUrl),
    format: detectFormat(sourceUrl),
  };
}

export function proxiedSubtitleTrack(
  origin: string,
  sourceUrl: string,
  input: Omit<SubtitleTrack, "url" | "format">,
): SubtitleTrack {
  return {
    ...input,
    url: createMediaProxyUrl(origin, sourceUrl),
    format: detectSubtitleFormat(sourceUrl),
  };
}
