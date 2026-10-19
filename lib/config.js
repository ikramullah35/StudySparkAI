// Shared configuration that is safe to import from BOTH server and client code.
// Only variables prefixed with NEXT_PUBLIC_ may be read in the browser.

export const APP_NAME = "StudySpark AI";
export const APP_TAGLINE = "Turn any lecture into clear notes, summaries, and practice questions.";

// ---- Upload limits -------------------------------------------------------
// Default 8 MB, overridable with NEXT_PUBLIC_MAX_UPLOAD_MB (must be public so
// the browser can show the same limit the server enforces).
export const MAX_UPLOAD_MB = Number(process.env.NEXT_PUBLIC_MAX_UPLOAD_MB || 8);
export const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;

// ---- Summarizer options --------------------------------------------------
export const SUMMARY_STYLES = [
  { value: "simple", label: "Simple English", hint: "Plain language, no jargon" },
  { value: "detailed", label: "Detailed Notes", hint: "Thorough, well-structured notes" },
  { value: "exam", label: "Exam Revision", hint: "Focused points to memorise" },
  { value: "bullet", label: "Bullet Points", hint: "Short, scannable list" },
];

export const SUMMARY_LENGTHS = [
  { value: "short", label: "Short", hint: "Quick overview" },
  { value: "medium", label: "Medium", hint: "Balanced detail" },
  { value: "detailed", label: "Detailed", hint: "Full coverage" },
];

export const DIFFICULTIES = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

export const CONTENT_TYPES = {
  summary: { label: "Summary", color: "indigo" },
  questions: { label: "Questions", color: "emerald" },
};

// ---- Supabase ------------------------------------------------------------
// Returns empty strings when the project has not been configured yet, so the
// UI can show friendly setup instructions instead of crashing.
function isValidUrl(value) {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "";
  // Treat a malformed URL as "not configured" so the app shows setup help
  // instead of throwing on every request.
  const configured = Boolean(url && key && isValidUrl(url));
  return { url, key, configured };
}

export function isSupabaseConfigured() {
  return getSupabaseEnv().configured;
}

// ---- Gemini --------------------------------------------------------------
// GEMINI_API_KEY is intentionally NOT public, so this returns false in the
// browser. It is only meaningful on the server.
export function isGeminiConfigured() {
  return Boolean(process.env.GEMINI_API_KEY);
}
