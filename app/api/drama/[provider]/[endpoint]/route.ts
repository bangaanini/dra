import type { NextRequest } from "next/server";
import { createCorsHeaders, createOptionsResponse } from "@/lib/drama/cors";
import { asApiError } from "@/lib/drama/errors";
import { getProviderAdapter } from "@/lib/drama/providers";
import { ENDPOINTS, type EndpointName } from "@/lib/drama/types";
import { getAuthorName } from "@/lib/drama/utils";

function isEndpointName(value: string): value is EndpointName {
  return ENDPOINTS.includes(value as EndpointName);
}

export async function GET(
  request: NextRequest,
  context: RouteContext<"/api/drama/[provider]/[endpoint]">,
) {
  const { provider, endpoint } = await context.params;
  const adapter = getProviderAdapter(provider);

  if (!adapter) {
    return Response.json(
      {
        author: getAuthorName(),
        type: "error",
        message: "Provider not found",
        error: `Unsupported provider: ${provider}`,
        status: 404,
      },
      { status: 404, headers: createCorsHeaders() },
    );
  }

  if (!isEndpointName(endpoint)) {
    return Response.json(
      {
        author: getAuthorName(),
        provider: adapter.provider,
        type: "error",
        message: "Endpoint not found",
        error: `Unsupported endpoint: ${endpoint}`,
        status: 404,
      },
      { status: 404, headers: createCorsHeaders() },
    );
  }

  try {
    const payload = await adapter.execute({
      author: getAuthorName(),
      endpoint,
      origin: request.nextUrl.origin,
      provider: adapter.provider,
      searchParams: request.nextUrl.searchParams,
    });

    return Response.json(payload, {
      headers: createCorsHeaders({
        "Cache-Control": "no-store",
      }),
    });
  } catch (error) {
    const apiError = asApiError(error);

    return Response.json(
      {
        author: getAuthorName(),
        provider: adapter.provider,
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
