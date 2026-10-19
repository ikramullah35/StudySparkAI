import { CheckCircle2, XCircle } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { isGeminiConfigured, isSupabaseConfigured } from "@/lib/config";

export const metadata = { title: "Settings" };

function StatusRow({ ok, label, hint }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4">
      {ok ? (
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
      ) : (
        <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-500" />
      )}
      <div>
        <p className="font-medium text-slate-900">{label}</p>
        <p className="text-sm text-slate-600">{hint}</p>
      </div>
    </div>
  );
}

export default async function SettingsPage() {
  let email = "Not signed in";
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    email = user?.email || email;
  }

  const supabaseOk = isSupabaseConfigured();
  const geminiOk = isGeminiConfigured();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Settings</h1>
        <p className="mt-1 text-slate-600">Your account and app configuration.</p>
      </div>

      <section className="card p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">Account</h2>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-slate-500">Email</dt>
            <dd className="font-medium text-slate-900">{email}</dd>
          </div>
        </dl>
        <form action="/auth/signout" method="post" className="mt-5">
          <button type="submit" className="btn-secondary">
            Sign out
          </button>
        </form>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Configuration</h2>

        <StatusRow
          ok={supabaseOk}
          label="Supabase (authentication + saved notes)"
          hint={
            supabaseOk
              ? "Connected. Login and saving are available."
              : "Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local."
          }
        />
        <StatusRow
          ok={geminiOk}
          label="Google Gemini (AI generation)"
          hint={
            geminiOk
              ? "API key detected. Summaries and questions will work."
              : "Add GEMINI_API_KEY to .env.local to enable AI features."
          }
        />
      </section>

      <section className="card p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">Setup guide</h2>
        <p className="mt-1 text-sm text-slate-600">
          Create a file named <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs">.env.local</code>{" "}
          in the project root with the values below, then restart the dev server.
        </p>

        <ol className="mt-5 space-y-4 text-sm text-slate-700">
          <li>
            <p className="font-semibold">1. Gemini API key</p>
            <p className="text-slate-600">
              Get a key from{" "}
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-indigo-600 underline"
              >
                Google AI Studio
              </a>
              .
            </p>
            <code className="mt-1 block rounded-lg bg-slate-900 px-3 py-2 font-mono text-xs text-slate-100">
              GEMINI_API_KEY=your_key_here
            </code>
          </li>
          <li>
            <p className="font-semibold">2. Supabase project</p>
            <p className="text-slate-600">
              Create a project at{" "}
              <a
                href="https://supabase.com"
                target="_blank"
                rel="noreferrer"
                className="text-indigo-600 underline"
              >
                supabase.com
              </a>
              . Copy the URL and the anon/publishable key from Project Settings → API.
            </p>
            <code className="mt-1 block rounded-lg bg-slate-900 px-3 py-2 font-mono text-xs text-slate-100">
              NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
              <br />
              NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
            </code>
          </li>
          <li>
            <p className="font-semibold">3. Create the database table</p>
            <p className="text-slate-600">
              In the Supabase SQL editor, run the script in{" "}
              <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs">
                supabase/schema.sql
              </code>{" "}
              from this project. It creates the notes table and the Row Level Security policies.
            </p>
          </li>
        </ol>
      </section>

      <section className="card p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">Privacy note</h2>
        <p className="mt-1 text-sm text-slate-600">
          Your notes are stored in your own Supabase database and protected by Row Level Security,
          so only you can read or edit them. Uploaded PDFs are processed in memory and are never
          stored. Secrets such as GEMINI_API_KEY stay on the server and are never sent to the
          browser.
        </p>
      </section>
    </div>
  );
}
