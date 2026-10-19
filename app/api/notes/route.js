import { errorResponse, json, readJson, requireUser } from "@/lib/api";
import { createNoteSchema, formatZodError } from "@/lib/validation";

export const runtime = "nodejs";

// GET /api/notes?q=search&type=summary|questions
// Lists the signed-in student's saved notes (Row Level Security also applies).
export async function GET(request) {
  const auth = await requireUser(request);
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const { searchParams } = request.nextUrl;
  const q = (searchParams.get("q") || "").trim();
  const type = searchParams.get("type");

  let query = supabase
    .from("notes")
    .select("id, title, content_type, created_at, updated_at")
    .order("updated_at", { ascending: false })
    .limit(100);

  if (q) {
    // Escape % and _ so user input cannot change the LIKE pattern.
    const safe = q.replace(/[%_]/g, "\\$&");
    query = query.ilike("title", `%${safe}%`);
  }
  if (type === "summary" || type === "questions") {
    query = query.eq("content_type", type);
  }

  const { data, error } = await query;
  if (error) {
    return errorResponse("We could not load your notes. Please try again.", 500);
  }

  return json({ notes: data || [] });
}

// POST /api/notes
// Body: { title, contentType, sourceText, content }
export async function POST(request) {
  const auth = await requireUser(request);
  if (auth.error) return auth.error;
  const { user, supabase } = auth;

  const body = await readJson(request);
  const parsed = createNoteSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(formatZodError(parsed.error), 400);
  }

  const { title, contentType, sourceText, content } = parsed.data;

  const { data, error } = await supabase
    .from("notes")
    .insert({
      user_id: user.id, // derived from the session, never from the client
      title,
      content_type: contentType,
      source_text: sourceText || "",
      content,
    })
    .select("id, title, content_type, created_at, updated_at")
    .single();

  if (error) {
    return errorResponse("We could not save this note. Please try again.", 500);
  }

  return json({ note: data }, 201);
}
