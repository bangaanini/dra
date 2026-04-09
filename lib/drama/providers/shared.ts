import { fetchUpstreamJson } from "@/lib/drama/client";
import { ApiError } from "@/lib/drama/errors";
import type {
  DramaSection,
  EndpointContext,
  ListPayload,
  NormalizedLanguage,
} from "@/lib/drama/types";
import {
  createDramaSummary,
  getNumber,
  getString,
  toBoolean,
  toNumber,
  toStringList,
} from "@/lib/drama/utils";

const API_BASE = "https://api.sonzaix.indevs.in";

export function providerUrl(path: string) {
  return `${API_BASE}${path}`;
}

export function requireId(context: EndpointContext) {
  const id = getString(context.searchParams, "id");
  if (!id) {
    throw new ApiError("Missing required query parameter: id", 400);
  }

  return id;
}

export function getLang(context: EndpointContext, fallback = "en") {
  return getString(context.searchParams, "lang", fallback) ?? fallback;
}

export function getPage(context: EndpointContext, fallback = 1) {
  return getNumber(context.searchParams, "page", fallback) ?? fallback;
}

export function getQuery(context: EndpointContext) {
  const query = getString(context.searchParams, "query");
  if (!query) {
    throw new ApiError("Missing required query parameter: query", 400);
  }

  return query;
}

export async function resolveEpisodeByIndex<T>(
  detailUrl: string,
  getList: (payload: T) => unknown[],
  getItemId: (item: unknown) => string | undefined,
  requestedEpisode?: number,
) {
  const detail = await fetchUpstreamJson<T>(detailUrl);
  const list = getList(detail);

  if (!Array.isArray(list) || list.length === 0) {
    throw new ApiError("No episodes found for this drama", 404);
  }

  const index = Math.max((requestedEpisode ?? 1) - 1, 0);
  const item = list[index];
  const id = getItemId(item);

  if (!id) {
    throw new ApiError("Unable to resolve episode identifier", 502);
  }

  return id;
}

export function normalizeLanguages(
  items: unknown[],
  mapper?: (item: Record<string, unknown>) => NormalizedLanguage,
) {
  return items
    .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"))
    .map((item) => {
      if (mapper) {
        return mapper(item);
      }

      return {
        id: typeof item.id === "string" ? item.id : undefined,
        code:
          typeof item.code === "string"
            ? item.code
            : typeof item.full === "string"
              ? item.full
              : "unknown",
        name: typeof item.name === "string" ? item.name : "Unknown",
        locale: typeof item.full === "string" ? item.full : undefined,
      };
    });
}

type GenericBook = Record<string, unknown>;

function mapGenericBook(
  context: EndpointContext,
  book: GenericBook,
  idKey = "drama_id",
) {
  const id = String(book[idKey] ?? "");

  return createDramaSummary(context, {
    id,
    title: String(book.drama_name ?? book.title ?? ""),
    description: typeof book.description === "string"
      ? book.description
      : typeof book.introduce === "string"
        ? book.introduce
        : undefined,
    posterUrl:
      typeof book.thumb_url === "string"
        ? book.thumb_url
        : typeof book.cover === "string"
          ? book.cover
          : undefined,
    posterThumbUrl:
      typeof book.cover_thumb === "string" ? book.cover_thumb : undefined,
    episodeCount: toNumber(book.episode_count ?? book.total_episodes ?? book.upload_num),
    watchCount:
      typeof book.watch_value === "string" ? book.watch_value : undefined,
    likes: typeof book.likes === "string" ? book.likes : undefined,
    followCount:
      typeof book.follow_count === "string" ? book.follow_count : undefined,
    tags: toStringList(book.tags),
    language: typeof book.language === "string" ? book.language : undefined,
    isFinished: toBoolean(book.is_finished ?? book.finish_state),
    isNew: toBoolean(book.is_new_book),
  });
}

export function normalizeBookSections(
  context: EndpointContext,
  sections: unknown[],
  options?: {
    sectionTitle?: (section: Record<string, unknown>, index: number) => string;
    sectionId?: (section: Record<string, unknown>, index: number) => string;
    booksKey?: string;
    bookIdKey?: string;
    bookFilter?: (book: GenericBook, section: Record<string, unknown>, index: number) => boolean;
  },
): ListPayload {
  const booksKey = options?.booksKey ?? "books";
  const bookIdKey = options?.bookIdKey ?? "drama_id";

  const normalizedSections: DramaSection[] = sections
    .filter((section): section is Record<string, unknown> => Boolean(section && typeof section === "object"))
    .map((section, index) => {
      const books = Array.isArray(section[booksKey]) ? section[booksKey] : [];
      const items = books
        .filter((book): book is GenericBook => Boolean(book && typeof book === "object"))
        .filter((book) => options?.bookFilter?.(book, section, index) ?? true)
        .map((book) => mapGenericBook(context, book, bookIdKey));

      return {
        id: options?.sectionId?.(section, index) ?? `section-${index + 1}`,
        title: options?.sectionTitle?.(section, index) ?? `Section ${index + 1}`,
        items,
      };
    })
    .filter((section) => section.items.length > 0);

  return {
    items: normalizedSections.flatMap((section) => section.items),
    sections: normalizedSections,
  };
}
