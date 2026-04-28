import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);
const PRODUCTION_ORIGINS = new Set(["https://croplet.app"]);
const DEVELOPMENT_ORIGINS = new Set([
  "http://127.0.0.1:3000",
  "http://localhost:3000",
]);
const MAX_REQUEST_BODY_BYTES = 2048;
const MAX_REMOTE_BYTES = 1024 * 1024;
const MAX_REMOTE_REDIRECTS = 3;
const REMOTE_FETCH_TIMEOUT_MS = 12_000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 8;
const RATE_LIMIT_LONG_WINDOW_MS = 10 * 60_000;
const RATE_LIMIT_LONG_MAX_REQUESTS = 30;
const RATE_LIMIT_MAX_BUCKETS = 1000;

export const runtime = "nodejs";
export const maxDuration = 15;

type ImportRequestBody = {
  url?: unknown;
};

type RateLimitBucket = {
  longWindowStart: number;
  longWindowCount: number;
  windowStart: number;
  windowCount: number;
};

type RemoteFetchResult =
  | { ok: false; error: string }
  | { ok: true; response: Response; url: URL };

const rateLimitBuckets = new Map<string, RateLimitBucket>();

function logImportEvent(
  level: "info" | "warn",
  event: string,
  details: Record<string, string | number | boolean | null> = {},
) {
  console[level](
    JSON.stringify({
      details,
      event,
      route: "api/import-from-url",
    }),
  );
}

function getRemoteLogDetails(url: URL) {
  const fileExtension = url.pathname.split(".").pop()?.toLowerCase() ?? null;

  return {
    fileExtension:
      fileExtension && fileExtension !== url.pathname ? fileExtension : null,
    hostname: url.hostname,
    protocol: url.protocol,
  };
}

function getAllowedOrigins(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return PRODUCTION_ORIGINS;
  }

  return new Set([
    ...PRODUCTION_ORIGINS,
    ...DEVELOPMENT_ORIGINS,
    new URL(request.url).origin,
  ]);
}

function isAllowedOriginValue(
  value: string | null,
  allowedOrigins: Set<string>,
) {
  if (!value) {
    return false;
  }

  try {
    return allowedOrigins.has(new URL(value).origin);
  } catch {
    return false;
  }
}

function hasAllowedRequestSource(request: Request) {
  const allowedOrigins = getAllowedOrigins(request);
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const secFetchSite = request.headers.get("sec-fetch-site");

  if (
    secFetchSite &&
    secFetchSite !== "same-origin" &&
    secFetchSite !== "none"
  ) {
    return false;
  }

  return (
    isAllowedOriginValue(origin, allowedOrigins) ||
    isAllowedOriginValue(referer, allowedOrigins)
  );
}

function getClientAddress(request: Request) {
  return (
    request.headers.get("x-nf-client-connection-ip") ??
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

function isRateLimited(request: Request) {
  const now = Date.now();
  const clientAddress = getClientAddress(request);
  const bucket = rateLimitBuckets.get(clientAddress) ?? {
    longWindowStart: now,
    longWindowCount: 0,
    windowStart: now,
    windowCount: 0,
  };

  if (now - bucket.windowStart >= RATE_LIMIT_WINDOW_MS) {
    bucket.windowStart = now;
    bucket.windowCount = 0;
  }

  if (now - bucket.longWindowStart >= RATE_LIMIT_LONG_WINDOW_MS) {
    bucket.longWindowStart = now;
    bucket.longWindowCount = 0;
  }

  bucket.windowCount += 1;
  bucket.longWindowCount += 1;
  rateLimitBuckets.set(clientAddress, bucket);

  if (rateLimitBuckets.size > RATE_LIMIT_MAX_BUCKETS) {
    const staleBefore = now - RATE_LIMIT_LONG_WINDOW_MS;

    for (const [key, value] of rateLimitBuckets) {
      if (value.longWindowStart < staleBefore) {
        rateLimitBuckets.delete(key);
      }
    }
  }

  return (
    bucket.windowCount > RATE_LIMIT_MAX_REQUESTS ||
    bucket.longWindowCount > RATE_LIMIT_LONG_MAX_REQUESTS
  );
}

function isPrivateIpv4Address(address: string) {
  const parts = address.split(".").map((segment) => Number(segment));

  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) {
    return false;
  }

  const [first, second] = parts;

  return (
    first === 10 ||
    first === 127 ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168)
  );
}

function isPrivateIpAddress(address: string) {
  if (isIP(address) === 4) {
    return isPrivateIpv4Address(address);
  }

  const normalizedAddress = address.toLowerCase();

  return (
    normalizedAddress === "::1" ||
    normalizedAddress.startsWith("fc") ||
    normalizedAddress.startsWith("fd") ||
    normalizedAddress.startsWith("fe8") ||
    normalizedAddress.startsWith("fe9") ||
    normalizedAddress.startsWith("fea") ||
    normalizedAddress.startsWith("feb") ||
    normalizedAddress.startsWith("::ffff:10.") ||
    normalizedAddress.startsWith("::ffff:127.") ||
    normalizedAddress.startsWith("::ffff:169.254.") ||
    normalizedAddress.startsWith("::ffff:192.168.") ||
    /^::ffff:172\.(1[6-9]|2\d|3[0-1])\./.test(normalizedAddress)
  );
}

async function resolvesToPrivateAddress(hostname: string) {
  if (hostname === "localhost" || hostname.endsWith(".local")) {
    return true;
  }

  if (isIP(hostname)) {
    return isPrivateIpAddress(hostname);
  }

  try {
    const addresses = await lookup(hostname, { all: true, verbatim: true });
    return addresses.some(({ address }) => isPrivateIpAddress(address));
  } catch {
    return false;
  }
}

function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

function isAcceptableContentType(contentType: string | null, url: URL) {
  if (url.pathname.toLowerCase().endsWith(".pdf")) {
    return true;
  }

  if (!contentType) {
    return false;
  }

  const normalizedContentType = contentType.toLowerCase();

  return (
    normalizedContentType.includes("application/pdf") ||
    normalizedContentType.includes("application/octet-stream")
  );
}

function isRedirectResponse(response: Response) {
  return [301, 302, 303, 307, 308].includes(response.status);
}

async function validateRemoteUrl(url: URL) {
  if (!ALLOWED_PROTOCOLS.has(url.protocol)) {
    return "invalid_protocol";
  }

  if (await resolvesToPrivateAddress(url.hostname)) {
    return "forbidden_url";
  }

  return null;
}

async function fetchRemoteUrl(
  url: URL,
  signal: AbortSignal,
): Promise<RemoteFetchResult> {
  let currentUrl = url;

  for (
    let redirectCount = 0;
    redirectCount <= MAX_REMOTE_REDIRECTS;
    redirectCount += 1
  ) {
    const validationError = await validateRemoteUrl(currentUrl);

    if (validationError) {
      return { error: validationError, ok: false };
    }

    const response = await fetch(currentUrl, {
      cache: "no-store",
      headers: {
        accept: "application/pdf,application/octet-stream;q=0.9,*/*;q=0.1",
      },
      redirect: "manual",
      signal,
    });

    if (!isRedirectResponse(response)) {
      return { ok: true, response, url: currentUrl };
    }

    const location = response.headers.get("location");

    if (!location) {
      return { error: "fetch_failed", ok: false };
    }

    currentUrl = new URL(location, currentUrl);
  }

  return { error: "too_many_redirects", ok: false };
}

async function readBoundedResponseBody(
  response: Response,
  abortController: AbortController,
) {
  if (!response.body) {
    throw new Error("missing_body");
  }

  const chunks: Uint8Array[] = [];
  const reader = response.body.getReader();
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      totalBytes += value.byteLength;

      if (totalBytes > MAX_REMOTE_BYTES) {
        abortController.abort();
        throw new Error("remote_file_too_large");
      }

      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const body = new Uint8Array(totalBytes);
  let offset = 0;

  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return body.buffer;
}

export async function OPTIONS(request: Request) {
  if (!hasAllowedRequestSource(request)) {
    logImportEvent("warn", "preflight_forbidden_origin");
    return new Response(null, { status: 403 });
  }

  return new Response(null, {
    headers: {
      "access-control-allow-headers": "content-type",
      "access-control-allow-methods": "POST, OPTIONS",
      "access-control-allow-origin": "https://croplet.app",
      "access-control-max-age": "300",
      "cache-control": "no-store",
      vary: "Origin",
    },
    status: 204,
  });
}

export async function POST(request: Request) {
  let body: ImportRequestBody;

  if (!hasAllowedRequestSource(request)) {
    logImportEvent("warn", "forbidden_origin", {
      hasOrigin: Boolean(request.headers.get("origin")),
      hasReferer: Boolean(request.headers.get("referer")),
      secFetchSite: request.headers.get("sec-fetch-site"),
    });
    return jsonError("forbidden_origin", 403);
  }

  if (isRateLimited(request)) {
    logImportEvent("warn", "rate_limited", {
      clientAddress: getClientAddress(request),
    });
    return jsonError("rate_limited", 429);
  }

  const requestContentLength = Number(
    request.headers.get("content-length") ?? "0",
  );

  if (
    requestContentLength > MAX_REQUEST_BODY_BYTES ||
    requestContentLength < 0
  ) {
    logImportEvent("warn", "request_body_too_large", {
      contentLength: requestContentLength,
    });
    return jsonError("request_body_too_large", 413);
  }

  try {
    const requestText = await request.text();

    if (
      new TextEncoder().encode(requestText).byteLength > MAX_REQUEST_BODY_BYTES
    ) {
      logImportEvent("warn", "request_body_too_large_after_read");
      return jsonError("request_body_too_large", 413);
    }

    body = JSON.parse(requestText) as ImportRequestBody;
  } catch {
    logImportEvent("warn", "invalid_request_body");
    return jsonError("invalid_request_body", 400);
  }

  if (typeof body.url !== "string") {
    logImportEvent("warn", "invalid_url_type");
    return jsonError("invalid_url", 400);
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(body.url);
  } catch {
    logImportEvent("warn", "invalid_url_parse");
    return jsonError("invalid_url", 400);
  }

  logImportEvent("info", "import_started", getRemoteLogDetails(parsedUrl));

  let upstreamResponse: Response;
  let finalUrl: URL;
  const abortController = new AbortController();
  const timeout = setTimeout(
    () => abortController.abort(),
    REMOTE_FETCH_TIMEOUT_MS,
  );

  try {
    const remoteResult = await fetchRemoteUrl(
      parsedUrl,
      abortController.signal,
    );

    if (!remoteResult.ok) {
      clearTimeout(timeout);
      logImportEvent("warn", "remote_fetch_rejected", {
        error: remoteResult.error,
        ...getRemoteLogDetails(parsedUrl),
      });
      return jsonError(remoteResult.error, 400);
    }

    upstreamResponse = remoteResult.response;
    finalUrl = remoteResult.url;
  } catch {
    clearTimeout(timeout);
    logImportEvent("warn", "remote_fetch_failed", getRemoteLogDetails(parsedUrl));
    return jsonError("fetch_failed", 502);
  }

  if (!upstreamResponse.ok || !upstreamResponse.body) {
    clearTimeout(timeout);
    logImportEvent("warn", "remote_bad_status", {
      status: upstreamResponse.status,
      ...getRemoteLogDetails(finalUrl),
    });
    return jsonError("fetch_failed", 502);
  }

  const responseHeaders = new Headers();
  const contentType = upstreamResponse.headers.get("content-type");
  const contentDisposition = upstreamResponse.headers.get(
    "content-disposition",
  );
  const contentLength = upstreamResponse.headers.get("content-length");

  if (!isAcceptableContentType(contentType, finalUrl)) {
    clearTimeout(timeout);
    logImportEvent("warn", "invalid_content_type", {
      contentType,
      ...getRemoteLogDetails(finalUrl),
    });
    return jsonError("invalid_content_type", 415);
  }

  if (contentLength && Number(contentLength) > MAX_REMOTE_BYTES) {
    clearTimeout(timeout);
    logImportEvent("warn", "remote_file_too_large_by_header", {
      contentLength: Number(contentLength),
      maxBytes: MAX_REMOTE_BYTES,
      ...getRemoteLogDetails(finalUrl),
    });
    return jsonError("remote_file_too_large", 413);
  }

  let responseBody: ArrayBuffer;

  try {
    responseBody = await readBoundedResponseBody(
      upstreamResponse,
      abortController,
    );
  } catch {
    clearTimeout(timeout);
    logImportEvent("warn", "remote_file_too_large_while_reading", {
      maxBytes: MAX_REMOTE_BYTES,
      ...getRemoteLogDetails(finalUrl),
    });
    return jsonError("remote_file_too_large", 413);
  }

  clearTimeout(timeout);

  if (contentType) {
    responseHeaders.set("content-type", contentType);
  }

  if (contentDisposition) {
    responseHeaders.set("content-disposition", contentDisposition);
  }

  responseHeaders.set("content-length", String(responseBody.byteLength));

  responseHeaders.set("cache-control", "no-store");

  logImportEvent("info", "import_succeeded", {
    bytes: responseBody.byteLength,
    contentType,
    ...getRemoteLogDetails(finalUrl),
  });

  return new Response(responseBody, {
    headers: responseHeaders,
    status: 200,
  });
}
