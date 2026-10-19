"use client";

import { useRef, useState } from "react";
import { FileUp, ListChecks, Loader2, Save } from "lucide-react";
import QuestionList from "@/components/QuestionList";
import Spinner from "@/components/Spinner";
import { useToast } from "@/components/toast";
import { DIFFICULTIES, MAX_UPLOAD_MB } from "@/lib/config";
import { MAX_INPUT_CHARS } from "@/lib/text";

export default function QuestionsPage() {
  const toast = useToast();
  const fileInputRef = useRef(null);

  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [mcqCount, setMcqCount] = useState(5);
  const [shortCount, setShortCount] = useState(3);

  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [result, setResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const tooLong = text.length > MAX_INPUT_CHARS;
  const canGenerate = text.trim().length >= 20 && !tooLong && !loading;

  async function handleFile(selected) {
    if (!selected) return;
    setError("");
    const isPdf =
      selected.type === "application/pdf" || selected.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) return toast.error("Please choose a PDF file.");
    if (selected.size > MAX_UPLOAD_MB * 1024 * 1024)
      return toast.error(`That file is larger than ${MAX_UPLOAD_MB} MB.`);

    setExtracting(true);
    try {
      const formData = new FormData();
      formData.append("file", selected);
      const res = await fetch("/api/extract-pdf", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "We could not read that PDF.");
      setText(data.text);
      toast.success("PDF text extracted.");
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setExtracting(false);
    }
  }

  async function generate() {
    setError("");
    setResult(null);
    setSaved(false);
    setLoading(true);
    try {
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          sourceText: text,
          difficulty,
          mcqCount,
          shortAnswerCount: shortCount,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "We could not generate questions.");
      setResult(data.questions);
      toast.success("Questions ready. Try the quiz!");
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    if (!result) return;
    setSaving(true);
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim() || "Untitled questions",
          contentType: "questions",
          sourceText: text.slice(0, MAX_INPUT_CHARS),
          content: JSON.stringify(result),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "We could not save these questions.");
      setSaved(true);
      toast.success("Saved to your notes.");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  const total = result ? (result.mcqs?.length || 0) + (result.shortAnswers?.length || 0) : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Exam question generator
        </h1>
        <p className="mt-1 text-slate-600">
          Create practice questions from your notes, then test yourself.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
        >
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="card p-5">
          <label htmlFor="q-title" className="label">
            Title or topic
          </label>
          <input
            id="q-title"
            className="input"
            placeholder="e.g. Organic Chemistry — Alkenes"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
          />

          <div className="mt-4 flex items-center justify-between">
            <label htmlFor="q-notes" className="label mb-0">
              Source notes
            </label>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={extracting}
              className="btn-ghost px-2 py-1 text-xs"
            >
              {extracting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileUp className="h-3.5 w-3.5" />}
              {extracting ? "Extracting…" : "Upload PDF instead"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,.pdf"
              className="sr-only"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </div>
          <textarea
            id="q-notes"
            rows={11}
            className="input min-h-[220px] resize-y"
            placeholder="Paste the notes you want questions from…"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <p className={`mt-2 text-xs ${tooLong ? "text-rose-600" : "text-slate-400"}`}>
            {text.length.toLocaleString()} / {MAX_INPUT_CHARS.toLocaleString()} characters
          </p>
        </div>

        <div className="space-y-6">
          <div className="card p-5">
            <p className="label">Difficulty</p>
            <div className="grid grid-cols-3 gap-2">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d.value}
                  onClick={() => setDifficulty(d.value)}
                  className={`rounded-xl border px-2 py-2 text-sm font-medium transition ${
                    difficulty === d.value
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-500"
                      : "border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div className="card space-y-4 p-5">
            <div>
              <label htmlFor="mcq" className="label">
                Multiple-choice questions: {mcqCount}
              </label>
              <input
                id="mcq"
                type="range"
                min={1}
                max={10}
                value={mcqCount}
                onChange={(e) => setMcqCount(Number(e.target.value))}
                className="w-full accent-indigo-600"
              />
            </div>
            <div>
              <label htmlFor="short" className="label">
                Short-answer questions: {shortCount}
              </label>
              <input
                id="short"
                type="range"
                min={0}
                max={5}
                value={shortCount}
                onChange={(e) => setShortCount(Number(e.target.value))}
                className="w-full accent-indigo-600"
              />
            </div>
          </div>

          <button
            onClick={generate}
            disabled={!canGenerate}
            className="btn-primary w-full py-3 text-base"
          >
            {loading ? <Spinner label="Generating" /> : <><ListChecks className="h-5 w-5" /> Generate questions</>}
          </button>
        </div>
      </div>

      {loading && (
        <div className="card flex items-center gap-3 p-5">
          <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
          <p className="text-sm text-slate-600">Writing questions grounded in your notes…</p>
        </div>
      )}

      {result && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">
              Your practice set ({total} question{total === 1 ? "" : "s"})
            </h2>
            <button onClick={save} disabled={saving || saved} className="btn-primary">
              {saved ? "Saved" : saving ? <Spinner label="Saving" /> : <><Save className="h-4 w-4" /> Save set</>}
            </button>
          </div>
          <QuestionList mcqs={result.mcqs || []} shortAnswers={result.shortAnswers || []} />
        </div>
      )}
    </div>
  );
}
