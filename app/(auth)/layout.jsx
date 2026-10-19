import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function AuthLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-indigo-50/70 to-white px-4 py-10">
      <Link href="/" className="mb-8 flex items-center gap-2.5">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
          <Sparkles className="h-5 w-5" />
        </span>
        <span className="text-xl font-bold tracking-tight text-slate-900">StudySpark AI</span>
      </Link>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
