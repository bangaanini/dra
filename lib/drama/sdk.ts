import type {
  ApiEnvelope,
  DramaDetailPayload,
  EndpointName,
  ListPayload,
  NormalizedLanguage,
  ProviderName,
  StreamPayload,
} from "@/lib/drama/types";

type QueryValue = string | number | boolean | undefined | null;

export interface ClientOptions {
  baseUrl?: string;
  fetcher?: typeof fetch;
}

function joinUrl(baseUrl: string, path: string) {
  if (!baseUrl) {
    return path;
  }

  return new URL(path, baseUrl).toString();
}

export function createDramaApiPath(
  provider: ProviderName,
  endpoint: EndpointName,
  query?: Record<string, QueryValue>,
) {
  const url = new URL(`http://internal/api/drama/${provider}/${endpoint}`);

  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  return `${url.pathname}${url.search}`;
}

export function createDramaApiClient(options?: ClientOptions) {
  const fetcher = options?.fetcher ?? fetch;
  const baseUrl = options?.baseUrl ?? "";

  async function request<T>(
    provider: ProviderName,
    endpoint: EndpointName,
    query?: Record<string, QueryValue>,
  ) {
    const path = createDramaApiPath(provider, endpoint, query);
    const response = await fetcher(joinUrl(baseUrl, path), {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    const payload = (await response.json()) as ApiEnvelope<T> & {
      error?: string;
      status?: number;
    };

    if (!response.ok) {
      throw new Error(payload.error || payload.message || "Request failed");
    }

    return payload;
  }

  return {
    request,
    getLanguages(provider: ProviderName) {
      return request<NormalizedLanguage[]>(provider, "languages");
    },
    getHome(provider: ProviderName, params?: { page?: number; lang?: string }) {
      return request<ListPayload>(provider, "home", params);
    },
    search(provider: ProviderName, params: { query: string; page?: number; lang?: string }) {
      return request<ListPayload>(provider, "search", params);
    },
    getPopular(provider: ProviderName, params?: { page?: number; lang?: string }) {
      return request<ListPayload>(provider, "popular", params);
    },
    getLatest(provider: ProviderName, params?: { page?: number; lang?: string }) {
      return request<ListPayload>(provider, "latest", params);
    },
    getDetail(provider: ProviderName, params: { id: string; lang?: string }) {
      return request<DramaDetailPayload>(provider, "detail", params);
    },
    getStream(
      provider: ProviderName,
      params: { id: string; episode?: number; lang?: string },
    ) {
      return request<StreamPayload>(provider, "stream", params);
    },
  };
}
