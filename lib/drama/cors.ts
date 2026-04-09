const DEFAULT_ALLOWED_HEADERS = "Content-Type, Accept, Range";
const DEFAULT_ALLOWED_METHODS = "GET, OPTIONS";

export function createCorsHeaders(extra?: HeadersInit) {
  const headers = new Headers(extra);
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", DEFAULT_ALLOWED_METHODS);
  headers.set("Access-Control-Allow-Headers", DEFAULT_ALLOWED_HEADERS);
  headers.set("Access-Control-Expose-Headers", "Content-Length, Content-Range, Content-Type");
  headers.set("Vary", "Origin");
  return headers;
}

export function createOptionsResponse() {
  return new Response(null, {
    status: 204,
    headers: createCorsHeaders(),
  });
}
