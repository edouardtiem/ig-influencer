import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  const pathname = request.nextUrl.pathname;

  // Handle elenav.link domain
  if (hostname === "elenav.link" || hostname === "www.elenav.link") {
    // /bio → redirect to root with UTM params (for Instagram bio - clean URL)
    if (pathname === "/bio") {
      const url = new URL("/elena", request.url);
      url.searchParams.set("utm_source", "instagram");
      url.searchParams.set("utm_medium", "bio");
      url.searchParams.set("utm_campaign", "elena");
      return NextResponse.redirect(url, 301);
    }

    // /dm → redirect to root with UTM params (for DM automation - clean URL)
    if (pathname === "/dm") {
      const url = new URL("/elena", request.url);
      url.searchParams.set("utm_source", "instagram");
      url.searchParams.set("utm_medium", "dm");
      url.searchParams.set("utm_campaign", "elena");
      return NextResponse.redirect(url, 301);
    }

    // Root → rewrite to /elena (keeps URL clean)
    if (pathname === "/") {
      return NextResponse.rewrite(new URL("/elena", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/bio", "/dm"],
};
