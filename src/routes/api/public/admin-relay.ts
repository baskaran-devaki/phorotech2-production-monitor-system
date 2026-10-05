import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const OPS = ["listAdminUsers", "inviteAdmin", "updateUserAccess", "setUserDisabled", "deleteAdmin", "setAdminRole"] as const;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
}

// Relay for hosts without the privileged key (e.g. Vercel). Every call is re-authenticated
// with the caller's own Supabase token and must belong to a Super Admin.
export const Route = createFileRoute("/api/public/admin-relay")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const auth = request.headers.get("authorization") ?? "";
          const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
          if (!token || token.split(".").length !== 3) return json({ ok: false, error: "Unauthorized" }, 401);

          const url = process.env["SUPABASE_URL"]!;
          const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
          const userClient = createClient<Database>(url, key, {
            global: { headers: { Authorization: `Bearer ${token}` } },
            auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
          });
          const { data: claims, error: claimsError } = await userClient.auth.getClaims(token);
          const userId = claims?.claims?.sub;
          if (claimsError || !userId) return json({ ok: false, error: "Unauthorized" }, 401);

          const { data: isSuper, error: roleError } = await userClient.rpc("is_super_admin", { _user_id: userId });
          if (roleError || !isSuper) return json({ ok: false, error: "Forbidden: super admin only" }, 403);

          const body = (await request.json().catch(() => null)) as { op?: string; data?: unknown } | null;
          const op = OPS.find((o) => o === body?.op);
          if (!op) return json({ ok: false, error: "Unknown operation" }, 400);

          const ops = await import("@/lib/admin-ops.server");
          if (!ops.hasServiceKey()) return json({ ok: false, error: "Server not configured" }, 500);
          const result = await ops.runAdminOp(op, body?.data ?? {}, { userId, email: (claims.claims.email as string | undefined) ?? null });
          return json({ ok: true, result });
        } catch (err) {
          return json({ ok: false, error: (err as Error).message || "Request failed" }, 400);
        }
      },
    },
  },
});
