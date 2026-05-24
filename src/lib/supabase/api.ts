/**
 * Returns a Supabase client with the user's JWT explicitly set in the
 * Authorization header. This guarantees that RLS policies see the correct
 * auth.uid() on every database and storage request, regardless of how
 * @supabase/ssr threads the session through in a given Next.js context.
 */
import {
  createClient as createRawClient,
  type SupabaseClient,
} from "@supabase/supabase-js";
import { createClient as createServerClient } from "./server";
import { NextResponse } from "next/server";

// Use any-typed client so we don't need generated DB types in route handlers
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = SupabaseClient<any, any, any>;

type AuthSuccess = { client: AnyClient; userId: string; error: null };
type AuthFailure = { client: null; userId: null; error: NextResponse };

export async function getAuthClient(): Promise<AuthSuccess | AuthFailure> {
  // Step 1: read + validate session via the SSR server client (reads cookies)
  const ssrClient = await createServerClient();
  const {
    data: { session },
  } = await ssrClient.auth.getSession();

  if (!session) {
    return {
      client: null,
      userId: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  // Step 2: create a plain supabase-js client with the access token set
  // explicitly in the Authorization header — this is what Supabase uses to
  // resolve auth.uid() inside RLS policies on every DB and storage request.
  const client: AnyClient = createRawClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: { Authorization: `Bearer ${session.access_token}` },
      },
      auth: { persistSession: false, autoRefreshToken: false },
    }
  );

  return { client, userId: session.user.id, error: null };
}
