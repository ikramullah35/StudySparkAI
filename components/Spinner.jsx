import { Loader2 } from "lucide-react";

export default function Spinner({ className = "h-5 w-5", label }) {
  return (
    <span className="inline-flex items-center gap-2">
      <Loader2 className={`animate-spin ${className}`} aria-hidden="true" />
      {label ? <span>{label}</span> : null}
      <span className="sr-only">Loading</span>
    </span>
  );
}
