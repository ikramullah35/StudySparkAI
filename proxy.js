import { updateSession } from "@/utils/supabase/proxy";

// Next.js 16 renamed the `middleware` convention to `proxy`.
// This runs on the Node.js runtime and refreshes the Supabase session before
// routes render, and redirects unauthenticated students away from private pages.
export async function proxy(request) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Run on everything except Next.js internals, static assets and favicon.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
