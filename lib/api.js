import "server-only";

import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { isSupabaseConfigured } from "./config";
import { rateLimit } from "./rate-limit";

// Small helpers shared by all Route Handlers.

export function json(data, status = 200) {
  return NextResponse.json(data, { status });
}

export function errorResponse(message, status = 400, extra = {}) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

// Resolves the verified user from the Supabase session cookie.
// NEVER trust a user id sent from the browser.
//
// Returns { user, supabase } on success, or { error } (a ready-made Response).
export async function requireUser(request, rateLimitOptions) {
  if (!isSupabaseConfigured()) {
    return {
      error: errorResponse(
        "Authentication is not configured on this server. Add your Supabase keys to .env.local (see README).",
        503
      ),
    };
  }

  const supabase = await createClient();

  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    return {
      error: errorResponse(
        "We could not reach the authentication service. Please try again in a moment.",
        503
      ),
    };
  }

  if (!user) {
    return { error: errorResponse("You must be signed in to do that.", 401) };
  }

  if (rateLimitOptions) {
    const result = rateLimit(`${user.id}:${rateLimitOptions.key}`, rateLimitOptions);
    if (!result.allowed) {
      return {
        error: errorResponse("Too many requests. Please wait a moment and try again.", 429, {
          retryAfterMs: result.retryAfterMs,
        }),
      };
    }
  }

  return { user, supabase };
}

// Safely reads a JSON body and returns {} on failure.
export async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}
