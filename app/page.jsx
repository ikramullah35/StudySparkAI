import Link from "next/link";
import {
  ArrowRight,
  Brain,
  FileText,
  ListChecks,
  Sparkles,
  Upload,
  Wand2,
} from "lucide-react";
import { APP_NAME, APP_TAGLINE, isSupabaseConfigured } from "@/lib/config";

const FEATURES = [
  {
    icon: FileText,
    title: "Smart summaries",
    text: "Turn dense lecture material into clear overviews, key concepts and plain-English definitions.",
  },
  {
    icon: ListChecks,
    title: "Exam questions",
    text: "Generate multiple-choice and short-answer questions with answers and explanations — then quiz yourself.",
  },
  {
    icon: Upload,
    title: "Upload PDFs",
    text: "Drop in a text-based lecture PDF or paste your notes. Long documents are handled automatically.",
  },
  {
    icon: Brain,
    title: "Stay grounded",
    text: "Every summary is built only from your material, so you can trust what you revise.",
  },
];

const STEPS = [
  { icon: Upload, title: "Add your material", text: "Upload a PDF or paste your notes." },
  { icon: Wand2, title: "Generate", text: "Pick a style and length, then generate." },
  { icon: Sparkles, title: "Revise & save", text: "Study, quiz yourself, and save for later." },
];

export default function HomePage() {
  const configured = isSupabaseConfigured();

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/60 via-white to-white">
      {/* Header */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
            <Sparkles className="h-5 w-5" />
          </span>
          <span className="text-lg font-bold tracking-tight text-slate-900">{APP_NAME}</span>
        </div>
        <nav className="flex items-center gap-2">
          <Link href="/login" className="btn-ghost">
            Sign in
          </Link>
          <Link href="/signup" className="btn-primary">
            Get started
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pb-12 pt-10 text-center sm:px-6 sm:pt-16">
        <span className="badge badge-indigo mx-auto mb-5">
          <Sparkles className="h-3.5 w-3.5" />
          AI study assistant for students
        </span>
        <h1 className="mx-auto max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl">
          Turn any lecture into clear notes and practice questions
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600">{APP_TAGLINE}</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/signup" className="btn-primary px-5 py-3 text-base">
            Start studying free
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/login" className="btn-secondary px-5 py-3 text-base">
            I already have an account
          </Link>
        </div>

        {!configured && (
          <p className="mx-auto mt-6 max-w-xl rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Heads up: this app still needs Supabase and Gemini API keys. See the{" "}
            <Link href="/settings" className="font-semibold underline">
              setup guide
            </Link>{" "}
            to finish configuration.
          </p>
        )}
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="card p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-semibold text-slate-900">{title}</h3>
              <p className="mt-1.5 text-sm text-slate-600">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Steps */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="card grid gap-8 p-8 sm:grid-cols-3 sm:p-10">
          {STEPS.map(({ icon: Icon, title, text }, i) => (
            <div key={title} className="text-center sm:text-left">
              <div className="mb-3 flex items-center justify-center gap-3 sm:justify-start">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
                  {i + 1}
                </span>
                <Icon className="h-5 w-5 text-indigo-600" />
              </div>
              <h3 className="font-semibold text-slate-900">{title}</h3>
              <p className="mt-1 text-sm text-slate-600">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6 text-center text-sm text-slate-500 sm:px-6">
          {APP_NAME} · Built with Next.js, Supabase and Google Gemini
        </div>
      </footer>
    </div>
  );
}
