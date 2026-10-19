"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Pencil, Trash2, X } from "lucide-react";
import { useToast } from "@/components/toast";

// Edit the title or delete a saved note, from the note detail page.
export default function NoteActions({ id, initialTitle }) {
  const router = useRouter();
  const toast = useToast();

  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [busy, setBusy] = useState(false);

  async function saveTitle() {
    if (!title.trim()) return toast.error("A title is required.");
    setBusy(true);
    try {
      const res = await fetch(`/api/notes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save the title.");
      setEditing(false);
      toast.success("Title updated.");
      router.refresh();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!window.confirm("Delete this note? This cannot be undone.")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/notes/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not delete the note.");
      toast.success("Note deleted.");
      router.push("/notes");
      router.refresh();
    } catch (err) {
      toast.error(err.message);
      setBusy(false);
    }
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <label htmlFor="note-title" className="sr-only">
          Note title
        </label>
        <input
          id="note-title"
          className="input py-1.5"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          autoFocus
        />
        <button onClick={saveTitle} disabled={busy} className="btn-primary px-3 py-1.5">
          <Check className="h-4 w-4" />
        </button>
        <button
          onClick={() => {
            setTitle(initialTitle);
            setEditing(false);
          }}
          className="btn-secondary px-3 py-1.5"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button onClick={() => setEditing(true)} className="btn-secondary">
        <Pencil className="h-4 w-4" />
        Edit title
      </button>
      <button onClick={remove} disabled={busy} className="btn-danger">
        <Trash2 className="h-4 w-4" />
        Delete
      </button>
    </div>
  );
}
