"use client";

import { useEffect } from "react";

const WEB_ROUTE_PREFIX = "/web/";

function safelyDecodeUrlPath(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function normalizeImportedUrl(value: string) {
  return value.replace(/^(https?):\/(?!\/)/i, "$1://");
}

function buildImportUrlFromLocation(location: Location) {
  const rawPath = location.pathname.startsWith(WEB_ROUTE_PREFIX)
    ? location.pathname.slice(WEB_ROUTE_PREFIX.length)
    : "";

  if (!rawPath) {
    return null;
  }

  const importedUrl = normalizeImportedUrl(safelyDecodeUrlPath(rawPath));

  if (importedUrl.includes("?")) {
    return importedUrl;
  }

  return `${importedUrl}${location.search}`;
}

export default function WebImportRedirect() {
  useEffect(() => {
    const importUrl = buildImportUrlFromLocation(window.location);

    if (!importUrl) {
      window.location.replace("/web");
      return;
    }

    window.location.replace(`/web?import=${encodeURIComponent(importUrl)}`);
  }, []);

  return null;
}
