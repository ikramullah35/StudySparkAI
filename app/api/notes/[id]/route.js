import { errorResponse, json, readJson, requireUser } from "@/lib/api";
import { formatZodError, updateNoteSchema } from "@/lib/validation";

export const runtime = "nodejs";

// In Next.js 16 route params are a Promise that must be awaited.
async function loadNoteById(supabase, user, id) {
  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id) // defense in depth on top of RLS
    .maybeSingle();

  if (error) return { error: "lookup_failed" };
  return { note: data };
}

// GET /api/notes/:id
export async function GET(request, { params }) {
  const auth = await requireUser(request);
  if (auth.error) return auth.error;
  const { user, supabase } = auth;

  const { id } = await params;
  const { note, error } = await loadNoteById(supabase, user, id);
  if (error) return errorResponse("We could not load that note.", 500);
  if (!note) return errorResponse("Note not found.", 404);

  return json({ note });
}

// PATCH /api/notes/:id  (edit the title and/or content)
export async function PATCH(request, { params }) {
  const auth = await requireUser(request);
  if (auth.error) return auth.error;
  const { user, supabase } = auth;

  const { id } = await params;
  const body = await readJson(request);
  const parsed = updateNoteSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(formatZodError(parsed.error), 400);
  }

  const updates = { ...parsed.data, updated_at: new Date().toISOString() };

  const { data, error } = await supabase
    .from("notes")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id, title, content_type, created_at, updated_at")
    .maybeSingle();

  if (error) return errorResponse("We could not update that note.", 500);
  if (!data) return errorResponse("Note not found.", 404);

  return json({ note: data });
}

// DELETE /api/notes/:id
export async function DELETE(request, { params }) {
  const auth = await requireUser(request);
  if (auth.error) return auth.error;
  const { user, supabase } = auth;

  const { id } = await params;

  const { data, error } = await supabase
    .from("notes")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (error) return errorResponse("We could not delete that note.", 500);
  if (!data) return errorResponse("Note not found.", 404);

  return json({ deleted: data.id });
}
