import Link from "next/link";
import { ArrowRight, FileText, ListChecks, Sparkles } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import EmptyState from "@/components/EmptyState";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: notes } = await supabase
    .from("notes")
    .select("id, title, content_type, updated_at")
    .order("updated_at", { ascending: false })
    .limit(100);

  const list = notes || [];
  const summaryCount = list.filter((n) => n.content_type === "summary").length;
  const questionCount = list.filter((n) => n.content_type === "questions").length;
  const recent = list.slice(0, 5);

  const name = (user?.email || "student").split("@")[0];

  const stats = [
    { label: "Saved notes", value: list.length, icon: FileText },
    { label: "Summaries", value: summaryCount, icon: Sparkles },
    { label: "Question sets", value: questionCount, icon: ListChecks },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Welcome back, {name}
        </h1>
        <p className="mt-1 text-slate-600">
          Pick up where you left off, or start something new.
        </p>
      </div>

      {/* Quick actions */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/create"
          className="card group flex items-center gap-4 p-5 transition hover:border-indigo-300 hover:shadow-md"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white">
            <Sparkles className="h-6 w-6" />
          </span>
          <span className="flex-1">
            <span className="block font-semibold text-slate-900">Create a summary</span>
            <span className="block text-sm text-slate-600">
              Paste notes or upload a PDF.
            </span>
          </span>
          <ArrowRight className="h-5 w-5 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-indigo-600" />
        </Link>

        <Link
          href="/questions"
          className="card group flex items-center gap-4 p-5 transition hover:border-emerald-300 hover:shadow-md"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white">
            <ListChecks className="h-6 w-6" />
          </span>
          <span className="flex-1">
            <span className="block font-semibold text-slate-900">Generate exam questions</span>
            <span className="block text-sm text-slate-600">MCQs and short answers.</span>
          </span>
          <ArrowRight className="h-5 w-5 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-emerald-600" />
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="card p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-600">{label}</p>
              <Icon className="h-5 w-5 text-indigo-500" />
            </div>
            <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
          </div>
        ))}
      </div>

      {/* Recent notes */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Recent study material</h2>
          {list.length > 0 && (
            <Link
              href="/notes"
              className="text-sm font-semibold text-indigo-600 hover:underline"
            >
              View all
            </Link>
          )}
        </div>

        {recent.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No saved material yet"
            description="Generate a summary or a set of exam questions, then save it to see it here."
            action={
              <Link href="/create" className="btn-primary">
                <Sparkles className="h-4 w-4" />
                Create your first summary
              </Link>
            }
          />
        ) : (
          <ul className="space-y-3">
            {recent.map((note) => (
              <li key={note.id}>
                <Link
                  href={`/notes/${note.id}`}
                  className="card flex items-center justify-between gap-4 p-4 transition hover:border-indigo-300 hover:shadow-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">{note.title}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {new Date(note.updated_at).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <span
                    className={
                      note.content_type === "questions" ? "badge-emerald" : "badge-indigo"
                    }
                  >
                    {note.content_type === "questions" ? "Questions" : "Summary"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
