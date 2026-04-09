import type { NextRequest } from "next/server";
import { createCorsHeaders, createOptionsResponse } from "@/lib/drama/cors";
import { ApiError, asApiError } from "@/lib/drama/errors";
import { createMediaProxyUrl, getAuthorName } from "@/lib/drama/utils";

const FORWARDED_HEADERS = [
  "accept",
  "accept-encoding",
  "accept-language",
  "cache-control",
  "if-none-match",
  "if-modified-since",
  "range",
  "user-agent",
] as const;

function sanitizeTargetUrl(value: string | null) {
  if (!value) {
    throw new ApiError("Missing required query parameter: url", 400);
  }

  const url = new URL(value);

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new ApiError("Only http(s) media URLs are supported", 400);
  }

  return url;
}

function rewriteM3u8Manifest(origin: string, manifestUrl: URL, body: string) {
  const rewriteUriAttribute = (line: string) =>
    line.replace(/URI="([^"]+)"/g, (_match, uri) => {
      const absolute = new URL(uri, manifestUrl);
      return `URI="${createMediaProxyUrl(origin, absolute.toString())}"`;
    });

  return body
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) {
        return line;
      }

      if (trimmed.startsWith("#")) {
        return rewriteUriAttribute(line);
      }

      const absolute = new URL(trimmed, manifestUrl);
      return createMediaProxyUrl(origin, absolute.toString());
    })
    .join("\n");
}

function buildForwardHeaders(request: NextRequest) {
  const headers = new Headers();

  FORWARDED_HEADERS.forEach((key) => {
    const value = request.headers.get(key);
    if (value) {
      headers.set(key, value);
    }
  });

  return headers;
}

export async function GET(request: NextRequest) {
  try {
    const targetUrl = sanitizeTargetUrl(request.nextUrl.searchParams.get("url"));
    const upstream = await fetch(targetUrl, {
      cache: "no-store",
      headers: buildForwardHeaders(request),
    });

    const contentType =
      upstream.headers.get("content-type") ||
      (targetUrl.pathname.toLowerCase().endsWith(".m3u8")
        ? "application/vnd.apple.mpegurl"
        : "application/octet-stream");

    if (
      contentType.includes("mpegurl") ||
      targetUrl.pathname.toLowerCase().endsWith(".m3u8")
    ) {
      const body = await upstream.text();
      const rewritten = rewriteM3u8Manifest(
        request.nextUrl.origin,
        targetUrl,
        body,
      );

      return new Response(rewritten, {
        status: upstream.status,
        headers: createCorsHeaders({
          "Cache-Control": "no-store",
          "Content-Type": "application/vnd.apple.mpegurl; charset=utf-8",
        }),
      });
    }

    const headers = new Headers();
    [
      "accept-ranges",
      "cache-control",
      "content-length",
      "content-range",
      "content-type",
      "etag",
      "last-modified",
    ].forEach((key) => {
      const value = upstream.headers.get(key);
      if (value) {
        headers.set(key, value);
      }
    });
    headers.set("Cache-Control", "no-store");

    return new Response(upstream.body, {
      status: upstream.status,
      headers: createCorsHeaders(headers),
    });
  } catch (error) {
    const apiError = asApiError(error);

    return Response.json(
      {
        author: getAuthorName(),
        type: "error",
        message: apiError.message,
        error: apiError.message,
        status: apiError.status,
      },
      { status: apiError.status, headers: createCorsHeaders() },
    );
  }
}

export function OPTIONS() {
  return createOptionsResponse();
}
