"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Search, Sparkles, Trash2 } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import Spinner from "@/components/Spinner";
import { useToast } from "@/components/toast";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "summary", label: "Summaries" },
  { value: "questions", label: "Questions" },
];

export default function NotesPage() {
  const toast = useToast();
  const [notes, setNotes] = useState([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      if (filter !== "all") params.set("type", filter);
      const res = await fetch(`/api/notes?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "We could not load your notes.");
      setNotes(data.notes || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [query, filter]);

  // Debounce so typing in the search box does not spam the server.
  useEffect(() => {
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
  }, [load]);

  async function remove(id, title) {
    if (!window.confirm(`Delete “${title}”? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/notes/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "We could not delete that note.");
      setNotes((list) => list.filter((n) => n.id !== id));
      toast.success("Note deleted.");
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Saved notes
        </h1>
        <p className="mt-1 text-slate-600">
          Everything you have generated and saved, in one place.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <label htmlFor="search" className="sr-only">
            Search notes by title
          </label>
          <input
            id="search"
            className="input pl-9"
            placeholder="Search by title…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                filter === f.value
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
        >
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16 text-slate-500">
          <Spinner label="Loading notes" />
        </div>
      ) : notes.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={query || filter !== "all" ? "No matching notes" : "No saved notes yet"}
          description={
            query || filter !== "all"
              ? "Try a different search or filter."
              : "Generate a summary or question set and save it to see it here."
          }
          action={
            <Link href="/create" className="btn-primary">
              <Sparkles className="h-4 w-4" />
              Create a summary
            </Link>
          }
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {notes.map((note) => (
            <li key={note.id} className="card group relative p-5">
              <Link href={`/notes/${note.id}`} className="block">
                <span
                  className={
                    note.content_type === "questions" ? "badge-emerald" : "badge-indigo"
                  }
                >
                  {note.content_type === "questions" ? "Questions" : "Summary"}
                </span>
                <h2 className="mt-3 line-clamp-2 pr-8 font-semibold text-slate-900">
                  {note.title}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Updated{" "}
                  {new Date(note.updated_at).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </Link>
              <button
                onClick={() => remove(note.id, note.title)}
                className="absolute right-4 top-5 rounded-lg p-1.5 text-slate-400 opacity-0 transition hover:bg-rose-50 hover:text-rose-600 focus:opacity-100 group-hover:opacity-100"
                aria-label={`Delete ${note.title}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
