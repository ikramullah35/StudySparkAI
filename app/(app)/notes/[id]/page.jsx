import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Markdown from "@/components/Markdown";
import NoteActions from "@/components/NoteActions";
import QuestionList from "@/components/QuestionList";
import { createClient } from "@/utils/supabase/server";

export const metadata = { title: "Saved note" };

export default async function NoteDetailPage({ params }) {
  // In Next.js 16, `params` is a Promise and must be awaited.
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: note } = await supabase
    .from("notes")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id) // extra safety on top of Row Level Security
    .maybeSingle();

  if (!note) notFound();

  let questions = null;
  if (note.content_type === "questions") {
    try {
      questions = JSON.parse(note.content);
    } catch {
      questions = null;
    }
  }

  return (
    <div className="space-y-6">
      <Link href="/notes" className="btn-ghost -ml-2 w-fit">
        <ArrowLeft className="h-4 w-4" />
        Back to notes
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <span className={note.content_type === "questions" ? "badge-emerald" : "badge-indigo"}>
            {note.content_type === "questions" ? "Questions" : "Summary"}
          </span>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">{note.title}</h1>
          <p className="mt-1 text-sm text-slate-500">
            Created {new Date(note.created_at).toLocaleDateString()} · Updated{" "}
            {new Date(note.updated_at).toLocaleDateString()}
          </p>
        </div>
        <NoteActions id={note.id} initialTitle={note.title} />
      </div>

      {note.content_type === "summary" ? (
        <div className="card p-5 sm:p-6">
          <Markdown>{note.content}</Markdown>
        </div>
      ) : questions ? (
        <QuestionList mcqs={questions.mcqs || []} shortAnswers={questions.shortAnswers || []} />
      ) : (
        <div className="card p-5 sm:p-6">
          <p className="mb-2 text-sm text-slate-500">
            This question set could not be displayed, so here is the saved content:
          </p>
          <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-xs text-slate-600">
            {note.content}
          </pre>
        </div>
      )}
    </div>
  );
}
