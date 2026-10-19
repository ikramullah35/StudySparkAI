import Link from "next/link";
import { AlertTriangle, Settings } from "lucide-react";

// Friendly screen shown when required environment variables are missing,
// instead of crashing. Full setup steps live in the README and Settings page.
export default function SetupNotice({ title = "Setup required", items = [] }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <div className="card p-6 sm:p-8">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">{title}</h1>
        <p className="mt-2 text-sm text-slate-600">
          StudySpark AI is running, but a few keys are still missing. Add them to a{" "}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs">.env.local</code>{" "}
          file in the project root, then restart the dev server.
        </p>

        {items.length > 0 && (
          <ul className="mt-5 space-y-3">
            {items.map((item) => (
              <li key={item.name} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="font-mono text-xs font-semibold text-slate-800">{item.name}</p>
                <p className="mt-1 text-sm text-slate-600">{item.where}</p>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/settings" className="btn-primary">
            <Settings className="h-4 w-4" />
            Open setup guide
          </Link>
        </div>
      </div>
    </div>
  );
}
