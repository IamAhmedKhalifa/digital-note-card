import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

// Temporary diagnostic route — delete after debugging
export async function GET() {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();

  // Only show cookie names, never values (they contain auth tokens)
  const cookieNames = allCookies.map((c) => c.name);
  const supabaseCookies = cookieNames.filter((n) => n.startsWith("sb-"));

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return NextResponse.json({
    totalCookies: allCookies.length,
    allCookieNames: cookieNames,
    supabaseCookieNames: supabaseCookies,
    getSession: {
      hasSession: !!session,
      userId: session?.user?.id ?? null,
      email: session?.user?.email ?? null,
    },
    getUser: {
      hasUser: !!user,
      userId: user?.id ?? null,
      email: user?.email ?? null,
    },
  });
}
