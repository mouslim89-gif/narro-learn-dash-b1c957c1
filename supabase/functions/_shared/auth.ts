// Shared auth guard for edge functions.
// Validates the caller's Supabase JWT and returns claims, or a Response to short-circuit.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

export async function requireUser(
  req: Request,
  corsHeaders: Record<string, string>,
): Promise<
  | { user: { id: string; email?: string }; token: string }
  | { error: Response }
> {
  const authHeader = req.headers.get("Authorization") ?? req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      error: new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }),
    };
  }
  const token = authHeader.slice("Bearer ".length).trim();
  // Allow service role key to bypass (used by generation scripts)
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (serviceRoleKey && token === serviceRoleKey) {
    return { user: { id: "service-role" }, token };
  }
  const client = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
  );
  const { data, error } = await client.auth.getClaims(token);
  if (error || !data?.claims?.sub) {
    return {
      error: new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }),
    };
  }
  return {
    user: { id: data.claims.sub as string, email: data.claims.email as string | undefined },
    token,
  };
}
