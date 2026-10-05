import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const PERMS = ["dashboard_view", "production_view", "production_entry", "downtime_view", "downtime_entry", "downtime_close", "reports", "analytics", "tv_mode", "notifications"] as const;

type Op = "listAdminUsers" | "inviteAdmin" | "updateUserAccess" | "setUserDisabled" | "deleteAdmin" | "setAdminRole";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function execute(op: Op, data: unknown, context: any) {
  const { data: isSuper, error } = await context.supabase.rpc("is_super_admin", { _user_id: context.userId });
  if (error) throw new Error("Authorization check failed");
  if (!isSuper) throw new Error("Forbidden: super admin only");
  const ops = await import("./admin-ops.server");
  if (ops.hasServiceKey()) {
    return ops.runAdminOp(op, data, { userId: context.userId, email: context.claims?.email ?? null });
  }
  // Host without the privileged key (e.g. Vercel): relay with the caller's own token.
  return ops.relayAdminOp(op, data, getRequest()?.headers.get("authorization") ?? null);
}

type AdminUserRow = {
  id: string; email: string; created_at: string; last_sign_in_at: string | null; banned_until: string | null;
  roles: string[]; is_super_admin: boolean; username: string; department: "production" | "maintenance" | "admin" | null; permissions: string[];
};

export const listAdminUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => (await execute("listAdminUsers", {}, context)) as AdminUserRow[]);

export const inviteAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    email: z.string().trim().email().max(255),
    username: z.string().trim().min(2).max(60),
    department: z.enum(["production", "maintenance", "admin"]),
    permissions: z.array(z.enum(PERMS)),
  }).parse(d))
  .handler(async ({ data, context }) => (await execute("inviteAdmin", data, context)) as { ok: boolean });

export const updateUserAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    userId: z.string().uuid(),
    username: z.string().trim().min(2).max(60),
    department: z.enum(["production", "maintenance", "admin"]),
    permissions: z.array(z.enum(PERMS)),
  }).parse(d))
  .handler(async ({ data, context }) => (await execute("updateUserAccess", data, context)) as { ok: boolean });

export const setUserDisabled = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ userId: z.string().uuid(), disabled: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => (await execute("setUserDisabled", data, context)) as { ok: boolean });

export const deleteAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ userId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => (await execute("deleteAdmin", data, context)) as { ok: boolean });

export const setAdminRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ userId: z.string().uuid(), makeAdmin: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => (await execute("setAdminRole", data, context)) as { ok: boolean });
