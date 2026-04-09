export const PROVIDERS = [
  "melolo",
  "meloshort",
  "goodshort",
  "dramawave",
  "reelshort",
  "freereels",
  "flickreels",
  "netshort",
] as const;

export const ENDPOINTS = [
  "languages",
  "home",
  "search",
  "popular",
  "latest",
  "detail",
  "stream",
] as const;

export type ProviderName = (typeof PROVIDERS)[number];
export type EndpointName = (typeof ENDPOINTS)[number];

export interface ApiEnvelope<T> {
  author: string;
  provider: ProviderName;
  message: string;
  type: EndpointName;
  data: T;
}

export interface ApiErrorEnvelope {
  author: string;
  provider?: ProviderName;
  message: string;
  type: "error";
  error: string;
  status: number;
}

export interface NormalizedLanguage {
  id?: string;
  code: string;
  name: string;
  locale?: string;
}

export interface DramaSummary {
  id: string;
  title: string;
  description?: string;
  posterUrl?: string;
  posterThumbUrl?: string;
  episodeCount?: number;
  watchCount?: string;
  likes?: string;
  followCount?: string;
  tags: string[];
  language?: string;
  isFinished?: boolean;
  isNew?: boolean;
  detailUrl: string;
}

export interface DramaSection {
  id: string;
  title: string;
  items: DramaSummary[];
}

export interface ListPayload {
  items: DramaSummary[];
  sections: DramaSection[];
  page?: number;
  nextPage?: number;
  total?: number;
  hasMore?: boolean;
  keyword?: string;
}

export interface DramaEpisode {
  id: string;
  number: number;
  title?: string;
  coverUrl?: string;
  duration?: number;
  locked?: boolean;
  price?: number;
  qualities?: string[];
  streamUrl: string;
}

export interface DramaDetailPayload {
  id: string;
  title: string;
  description?: string;
  posterUrl?: string;
  episodeCount?: number;
  watchCount?: string;
  likes?: string;
  followCount?: string;
  tags: string[];
  performers: string[];
  originalLanguage?: string;
  isFinished?: boolean;
  free?: boolean;
  episodes: DramaEpisode[];
}

export interface StreamSource {
  label: string;
  url: string;
  format: "m3u8" | "mp4" | "unknown";
  quality?: string;
  codec?: string;
  bitrate?: string;
}

export interface SubtitleTrack {
  language: string;
  label?: string;
  type?: string;
  url: string;
  format: "srt" | "vtt" | "unknown";
}

export interface StreamPayload {
  dramaId?: string;
  episodeId?: string;
  episodeNumber?: number;
  title?: string;
  posterUrl?: string;
  streams: StreamSource[];
  subtitles: SubtitleTrack[];
}

export interface EndpointContext {
  author: string;
  endpoint: EndpointName;
  origin: string;
  provider: ProviderName;
  searchParams: URLSearchParams;
}

export interface ProviderAdapter {
  provider: ProviderName;
  execute: (context: EndpointContext) => Promise<ApiEnvelope<unknown>>;
}
