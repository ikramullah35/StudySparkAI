"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  FileText,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  Settings,
  Sparkles,
  X,
} from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/create", label: "Create Summary", icon: Sparkles },
  { href: "/questions", label: "Exam Questions", icon: ListChecks },
  { href: "/notes", label: "Saved Notes", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
];

function NavLinks({ onNavigate }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1" aria-label="Main navigation">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              active
                ? "bg-indigo-50 text-indigo-700"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <Icon className="h-4.5 w-4.5" style={{ width: 18, height: 18 }} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function Brand() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
        <Sparkles className="h-5 w-5" />
      </span>
      <span className="text-lg font-bold tracking-tight text-slate-900">StudySpark AI</span>
    </Link>
  );
}

function SignOutButton({ full = false }) {
  return (
    <form action="/auth/signout" method="post" className={full ? "w-full" : ""}>
      <button
        type="submit"
        className="btn-secondary w-full justify-start gap-3 text-slate-600"
      >
        <LogOut className="h-4 w-4" />
        Sign out
      </button>
    </form>
  );
}

export default function AppShell({ user, children }) {
  const [open, setOpen] = useState(false);
  const email = user?.email || "student";

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-white px-4 py-5 lg:flex">
        <Brand />
        <div className="mt-8 flex-1">
          <NavLinks />
        </div>
        <div className="border-t border-slate-200 pt-4">
          <p className="mb-2 truncate px-3 text-xs text-slate-500" title={email}>
            {email}
          </p>
          <SignOutButton full />
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
        <Brand />
        <button
          onClick={() => setOpen(true)}
          className="btn-ghost p-2"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            className="absolute inset-0 bg-slate-900/40"
            aria-label="Close navigation menu"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-white p-4 shadow-xl">
            <div className="flex items-center justify-between">
              <Brand />
              <button
                onClick={() => setOpen(false)}
                className="btn-ghost p-2"
                aria-label="Close navigation menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-6 flex-1">
              <NavLinks onNavigate={() => setOpen(false)} />
            </div>
            <div className="border-t border-slate-200 pt-4">
              <p className="mb-2 truncate px-3 text-xs text-slate-500">{email}</p>
              <SignOutButton full />
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="lg:pl-64">
        <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">{children}</div>
      </main>
    </div>
  );
}
