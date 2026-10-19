import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { getSupabaseEnv } from "@/lib/config";

// Paths that require a logged-in student.
const PROTECTED_PREFIXES = ["/dashboard", "/create", "/questions", "/notes", "/settings"];
// Pages a logged-in student should not see.
const AUTH_PAGES = ["/login", "/signup"];

function isProtected(pathname) {
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

// Refreshes the Supabase session on every request and protects private pages.
// Called from `proxy.js` (Next.js 16 renamed `middleware` to `proxy`).
export async function updateSession(request) {
  let response = NextResponse.next({ request });

  const { url, key, configured } = getSupabaseEnv();

  // If Supabase is not set up yet, let the app run so the setup screen shows.
  if (!configured) {
    return response;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // IMPORTANT: `getUser()` re-validates the token with Supabase Auth.
  // If Supabase is unreachable we fail open (no redirect) so the app still
  // renders and each protected page/route does its own server-side check.
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    return response;
  }

  const { pathname } = request.nextUrl;

  if (!user && isProtected(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (user && AUTH_PAGES.includes(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/dashboard";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}
