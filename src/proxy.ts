import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const WEB_SUBDOMAIN = "web.";

export function proxy(request: NextRequest) {
  const host = request.headers.get("host")?.toLowerCase() ?? "";

  if (!host.startsWith(WEB_SUBDOMAIN)) {
    return NextResponse.next();
  }

  const pathname = request.nextUrl.pathname;

  if (pathname === "/web" || pathname.startsWith("/web/")) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = pathname === "/" ? "/web" : `/web${pathname}`;

  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|.*\\..*).*)",
  ],
};
