import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import SetupNotice from "@/components/SetupNotice";
import { isSupabaseConfigured } from "@/lib/config";
import { getCurrentUser } from "@/utils/supabase/server";

// Every page inside this route group requires a signed-in student.
export default async function ProtectedLayout({ children }) {
  if (!isSupabaseConfigured()) {
    return (
      <SetupNotice
        title="Connect Supabase to use StudySpark AI"
        items={[
          {
            name: "NEXT_PUBLIC_SUPABASE_URL",
            where: "Supabase dashboard → Project Settings → API → Project URL.",
          },
          {
            name: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
            where: "Supabase dashboard → Project Settings → API → anon / publishable key.",
          },
        ]}
      />
    );
  }

  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return <AppShell user={user}>{children}</AppShell>;
}
