import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  const pathname = request.nextUrl.pathname;

  // If on elenav.link domain and requesting root, rewrite to /elena
  if (
    (hostname === "elenav.link" || hostname === "www.elenav.link") &&
    pathname === "/"
  ) {
    return NextResponse.rewrite(new URL("/elena", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/"],
};
