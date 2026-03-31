import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);

export const runtime = "nodejs";

type ImportRequestBody = {
  url?: unknown;
};

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

export async function POST(request: Request) {
  let body: ImportRequestBody;

  try {
    body = (await request.json()) as ImportRequestBody;
  } catch {
    return jsonError("invalid_request_body", 400);
  }

  if (typeof body.url !== "string") {
    return jsonError("invalid_url", 400);
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(body.url);
  } catch {
    return jsonError("invalid_url", 400);
  }

  if (!ALLOWED_PROTOCOLS.has(parsedUrl.protocol)) {
    return jsonError("invalid_protocol", 400);
  }

  if (await resolvesToPrivateAddress(parsedUrl.hostname)) {
    return jsonError("forbidden_url", 400);
  }

  let upstreamResponse: Response;

  try {
    upstreamResponse = await fetch(parsedUrl, {
      cache: "no-store",
      headers: {
        accept: "application/pdf,application/octet-stream;q=0.9,*/*;q=0.1",
      },
      redirect: "follow",
    });
  } catch {
    return jsonError("fetch_failed", 502);
  }

  if (!upstreamResponse.ok || !upstreamResponse.body) {
    return jsonError("fetch_failed", 502);
  }

  const responseHeaders = new Headers();
  const contentType = upstreamResponse.headers.get("content-type");
  const contentDisposition = upstreamResponse.headers.get("content-disposition");
  const contentLength = upstreamResponse.headers.get("content-length");

  if (contentType) {
    responseHeaders.set("content-type", contentType);
  }

  if (contentDisposition) {
    responseHeaders.set("content-disposition", contentDisposition);
  }

  if (contentLength) {
    responseHeaders.set("content-length", contentLength);
  }

  responseHeaders.set("cache-control", "no-store");

  return new Response(upstreamResponse.body, {
    headers: responseHeaders,
    status: 200,
  });
}
