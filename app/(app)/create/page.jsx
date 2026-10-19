"use client";

import { useRef, useState } from "react";
import {
  Copy,
  Download,
  FileUp,
  Loader2,
  Save,
  Sparkles,
  Upload,
  Wand2,
  X,
} from "lucide-react";
import Markdown from "@/components/Markdown";
import Spinner from "@/components/Spinner";
import { useToast } from "@/components/toast";
import { MAX_UPLOAD_MB, SUMMARY_LENGTHS, SUMMARY_STYLES } from "@/lib/config";
import { MAX_INPUT_CHARS } from "@/lib/text";

const LOADING_STEPS = [
  "Reading your material…",
  "Finding the key ideas…",
  "Writing clear notes…",
  "Almost done…",
];

export default function CreateSummaryPage() {
  const toast = useToast();
  const fileInputRef = useRef(null);

  const [mode, setMode] = useState("paste");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [style, setStyle] = useState("simple");
  const [length, setLength] = useState("medium");

  const [file, setFile] = useState(null);
  const [extracting, setExtracting] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [result, setResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const tooLong = text.length > MAX_INPUT_CHARS;
  const canGenerate = text.trim().length >= 20 && !tooLong && !loading;

  // ---- PDF upload --------------------------------------------------------
  async function handleFile(selected) {
    setError("");
    if (!selected) return;

    const isPdf =
      selected.type === "application/pdf" || selected.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      toast.error("Please choose a PDF file.");
      return;
    }
    if (selected.size > MAX_UPLOAD_MB * 1024 * 1024) {
      toast.error(`That file is larger than ${MAX_UPLOAD_MB} MB.`);
      return;
    }

    setFile(selected);
    setExtracting(true);
    try {
      const formData = new FormData();
      formData.append("file", selected);
      const res = await fetch("/api/extract-pdf", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "We could not read that PDF.");
      setText(data.text);
      toast.success(`Extracted ${data.pages} page${data.pages === 1 ? "" : "s"} from your PDF.`);
    } catch (err) {
      setFile(null);
      setError(err.message);
      toast.error(err.message);
    } finally {
      setExtracting(false);
    }
  }

  function onDrop(event) {
    event.preventDefault();
    setDragOver(false);
    const dropped = event.dataTransfer.files?.[0];
    if (dropped) {
      setMode("pdf");
      handleFile(dropped);
    }
  }

  // ---- Generate ----------------------------------------------------------
  async function generate() {
    setError("");
    setResult(null);
    setSaved(false);
    setLoading(true);
    setStep(0);

    const timer = setInterval(() => setStep((s) => Math.min(s + 1, LOADING_STEPS.length - 1)), 2500);

    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, sourceText: text, style, length }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "We could not generate a summary.");
      setResult({ summary: data.summary, meta: data.meta });
      toast.success("Summary ready.");
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      clearInterval(timer);
      setLoading(false);
    }
  }

  // ---- Result actions ----------------------------------------------------
  async function save() {
    if (!result) return;
    setSaving(true);
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim() || "Untitled summary",
          contentType: "summary",
          sourceText: text.slice(0, MAX_INPUT_CHARS),
          content: result.summary,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "We could not save this summary.");
      setSaved(true);
      toast.success("Saved to your notes.");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  function copy() {
    if (!result) return;
    navigator.clipboard.writeText(result.summary).then(
      () => toast.success("Copied to clipboard."),
      () => toast.error("Copy failed. Please select the text manually.")
    );
  }

  function download() {
    if (!result) return;
    const blob = new Blob([result.summary], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(title || "studyspark-summary").replace(/[^\w-]+/g, "-")}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Create a summary
        </h1>
        <p className="mt-1 text-slate-600">
          Paste your notes or upload a lecture PDF, then choose how you want it explained.
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
        {/* Left column: input */}
        <div className="space-y-6">
          <div className="card p-5">
            <label htmlFor="title" className="label">
              Title or topic
            </label>
            <input
              id="title"
              className="input"
              placeholder="e.g. Cell Biology — Lecture 4"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
            />
          </div>

          <div className="card overflow-hidden">
            {/* Mode tabs */}
            <div className="flex border-b border-slate-200">
              {[
                { id: "paste", label: "Paste notes", icon: Wand2 },
                { id: "pdf", label: "Upload PDF", icon: Upload },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setMode(id)}
                  className={`flex flex-1 items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition ${
                    mode === id
                      ? "border-b-2 border-indigo-600 text-indigo-700"
                      : "text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>

            <div className="p-5">
              {mode === "paste" ? (
                <div>
                  <label htmlFor="notes" className="label">
                    Your study material
                  </label>
                  <textarea
                    id="notes"
                    rows={12}
                    className="input min-h-[220px] resize-y font-normal"
                    placeholder="Paste your lecture notes here…"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                  />
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className={tooLong ? "text-rose-600" : "text-slate-400"}>
                      {text.length.toLocaleString()} / {MAX_INPUT_CHARS.toLocaleString()} characters
                    </span>
                    {tooLong && <span className="text-rose-600">Too long — trim it down.</span>}
                  </div>
                </div>
              ) : (
                <div>
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={onDrop}
                    className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition ${
                      dragOver ? "border-indigo-400 bg-indigo-50" : "border-slate-300 bg-slate-50"
                    }`}
                  >
                    <FileUp className="mb-3 h-8 w-8 text-indigo-500" />
                    <p className="text-sm font-medium text-slate-700">
                      Drag & drop a PDF here, or
                    </p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={extracting}
                      className="btn-secondary mt-3"
                    >
                      {extracting ? <Spinner label="Extracting" /> : "Choose a PDF"}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="application/pdf,.pdf"
                      className="sr-only"
                      onChange={(e) => handleFile(e.target.files?.[0])}
                    />
                    <p className="mt-3 text-xs text-slate-500">
                      Text-based PDFs up to {MAX_UPLOAD_MB} MB. Scanned PDFs are not supported.
                    </p>
                  </div>

                  {file && (
                    <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
                      <div className="flex min-w-0 items-center gap-2">
                        {extracting ? (
                          <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                        ) : (
                          <FileUp className="h-4 w-4 text-emerald-600" />
                        )}
                        <span className="truncate text-sm text-slate-700">{file.name}</span>
                      </div>
                      <button
                        onClick={() => {
                          setFile(null);
                          setText("");
                        }}
                        className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        aria-label="Remove file"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  {text && (
                    <div className="mt-4">
                      <p className="mb-1.5 text-xs font-medium text-slate-500">
                        Extracted text (first 500 characters)
                      </p>
                      <p className="max-h-28 overflow-y-auto rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                        {text.slice(0, 500)}
                        {text.length > 500 ? "…" : ""}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right column: options */}
        <div className="space-y-6">
          <div className="card p-5">
            <p className="label">Summary style</p>
            <div className="space-y-2">
              {SUMMARY_STYLES.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setStyle(option.value)}
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-left transition ${
                    style === option.value
                      ? "border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <span className="block text-sm font-medium text-slate-900">{option.label}</span>
                  <span className="block text-xs text-slate-500">{option.hint}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <p className="label">Summary length</p>
            <div className="grid grid-cols-3 gap-2">
              {SUMMARY_LENGTHS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setLength(option.value)}
                  className={`rounded-xl border px-2 py-2 text-center text-sm font-medium transition ${
                    length === option.value
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-500"
                      : "border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={generate}
            disabled={!canGenerate}
            className="btn-primary w-full py-3 text-base"
          >
            {loading ? <Spinner label="Generating" /> : <><Sparkles className="h-5 w-5" /> Generate summary</>}
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="card flex items-center gap-3 p-5">
          <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
          <p className="text-sm text-slate-600">{LOADING_STEPS[step]}</p>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4">
            <div className="min-w-0 flex-1">
              <label htmlFor="result-title" className="sr-only">
                Result title
              </label>
              <input
                id="result-title"
                className="w-full bg-transparent text-lg font-semibold text-slate-900 outline-none"
                value={title}
                placeholder="Untitled summary"
                onChange={(e) => setTitle(e.target.value)}
              />
              {result.meta && (
                <p className="text-xs text-slate-500">
                  {result.meta.chunks > 1
                    ? `Summarised in ${result.meta.chunks} parts`
                    : "Single-pass summary"}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={copy} className="btn-secondary" title="Copy">
                <Copy className="h-4 w-4" />
                <span className="hidden sm:inline">Copy</span>
              </button>
              <button onClick={download} className="btn-secondary" title="Download">
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Download</span>
              </button>
              <button onClick={save} disabled={saving || saved} className="btn-primary">
                {saved ? (
                  "Saved"
                ) : saving ? (
                  <Spinner label="Saving" />
                ) : (
                  <>
                    <Save className="h-4 w-4" /> Save
                  </>
                )}
              </button>
            </div>
          </div>
          <div className="p-5 sm:p-6">
            <Markdown>{result.summary}</Markdown>
          </div>
        </div>
      )}
    </div>
  );
}
