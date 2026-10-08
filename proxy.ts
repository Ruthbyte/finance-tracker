import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth";

const PUBLIC_PAGE_PREFIXES = ["/sign-in", "/sign-up"];
const PUBLIC_API_PREFIXES = ["/api/auth", "/api/notifications", "/api/webhooks"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublicPage = PUBLIC_PAGE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
  const isPublicApi = PUBLIC_API_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (isPublicApi) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = verifySessionToken(token);

  if (isPublicPage) {
    if (session) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (!session) {
    const signInUrl = new URL("/sign-in", request.url);
    if (pathname !== "/" && pathname !== "/dashboard") {
      signInUrl.searchParams.set("redirect_url", pathname);
    }
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export default proxy;

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|json|webmanifest|fontawesome|svg|png|jpg|jpeg|gif|webp|ttf|woff2?|ico|csv|docx?|xlsx?|zip|musl)).*)",
    "/(api|trpc)(.*)",
  ],
};

