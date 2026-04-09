import { ApiError } from "@/lib/drama/errors";

export async function fetchUpstreamJson<T>(url: string) {
  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "User-Agent": "dra-internal-proxy/1.0",
    },
  });

  const text = await response.text();
  let payload: T | undefined;

  try {
    payload = JSON.parse(text) as T;
  } catch {
    throw new ApiError("Invalid upstream JSON response", 502, {
      url,
      status: response.status,
      body: text.slice(0, 500),
    });
  }

  if (!response.ok) {
    const message =
      typeof payload === "object" &&
      payload &&
      "message" in payload &&
      typeof payload.message === "string"
        ? payload.message
        : `Upstream request failed with status ${response.status}`;

    throw new ApiError(message, response.status, payload);
  }

  return payload;
}
