import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseEnv } from "@/lib/config";

// Server-side Supabase client for Server Components, Route Handlers and
// Server Actions. In Next.js 16 the `cookies()` helper is async.
//
// IMPORTANT: never pass a user id in from the browser. Always call
// `supabase.auth.getUser()` to get a verified identity on the server.
export async function createClient() {
  const cookieStore = await cookies();
  const { url, key } = getSupabaseEnv();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // `set` throws when called from a Server Component (read-only cookies).
          // This is safe to ignore because `proxy.js` refreshes the session.
        }
      },
    },
  });
}

// Convenience helper: returns the verified user or null.
export async function getCurrentUser() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user ?? null;
  } catch {
    return null;
  }
}
