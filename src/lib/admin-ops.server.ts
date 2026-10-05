// Privileged Super Admin operations. Server-only.
// Runs where the service-role key exists (Lovable hosting). Other hosts (e.g. Vercel)
// relay the caller's bearer token to the Lovable-hosted relay, which re-verifies it.
import { z } from "zod";

export const PERMS = ["dashboard_view", "production_view", "production_entry", "downtime_view", "downtime_entry", "downtime_close", "reports", "analytics", "tv_mode", "notifications"] as const;

export const schemas = {
  listAdminUsers: z.object({}).passthrough(),
  inviteAdmin: z.object({
    email: z.string().trim().email().max(255),
    username: z.string().trim().min(2).max(60),
    department: z.enum(["production", "maintenance", "admin"]),
    permissions: z.array(z.enum(PERMS)),
  }),
  updateUserAccess: z.object({
    userId: z.string().uuid(),
    username: z.string().trim().min(2).max(60),
    department: z.enum(["production", "maintenance", "admin"]),
    permissions: z.array(z.enum(PERMS)),
  }),
  setUserDisabled: z.object({ userId: z.string().uuid(), disabled: z.boolean() }),
  deleteAdmin: z.object({ userId: z.string().uuid() }),
  setAdminRole: z.object({ userId: z.string().uuid(), makeAdmin: z.boolean() }),
};
export type AdminOp = keyof typeof schemas;

export const DEFAULT_RELAY_ORIGIN = "https://phorotech2-production-monitor-system.lovable.app";

export function hasServiceKey() {
  return !!process.env["SUPABASE_SERVICE_ROLE_KEY"];
}

export function relayOrigin() {
  return (process.env["PPMS_RELAY_ORIGIN"] || DEFAULT_RELAY_ORIGIN).replace(/\/$/, "");
}

/** Forward an op to the Lovable-hosted relay with the caller's own bearer token. */
export async function relayAdminOp(op: AdminOp, data: unknown, authHeader: string | null) {
  if (!authHeader) throw new Error("Unauthorized");
  const res = await fetch(`${relayOrigin()}/api/public/admin-relay`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: authHeader },
    body: JSON.stringify({ op, data }),
  });
  const body = (await res.json().catch(() => null)) as { ok?: boolean; result?: unknown; error?: string } | null;
  if (!res.ok || !body?.ok) throw new Error(body?.error || `Request failed (${res.status})`);
  return body.result;
}

type Actor = { userId: string; email: string | null };

async function logAudit(actor: Actor, action: string, entity: string, entityId: string | null, details: Record<string, unknown>) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin.from("audit_logs").insert({
    actor_id: actor.userId, actor_email: actor.email, action, entity, entity_id: entityId, details: details as never,
  });
}

/** Caller must already be verified as a Super Admin. */
export async function runAdminOp(op: AdminOp, raw: unknown, actor: Actor): Promise<unknown> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  switch (op) {
    case "listAdminUsers": {
      const { data: rolesRows } = await supabaseAdmin.from("user_roles").select("user_id, role, created_at");
      const { data: supers } = await supabaseAdmin.from("super_admins").select("user_id");
      const { data: usersList } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
      const { data: profiles } = await supabaseAdmin.from("profiles").select("user_id, username, department");
      const { data: permissions } = await supabaseAdmin.from("user_permissions").select("user_id, permission");
      const superSet = new Set((supers ?? []).map((s: { user_id: string }) => s.user_id));
      const roleMap = new Map<string, string[]>();
      const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p]));
      const permissionMap = new Map<string, string[]>();
      (rolesRows ?? []).forEach((r: { user_id: string; role: string }) => {
        const arr = roleMap.get(r.user_id) ?? []; arr.push(r.role); roleMap.set(r.user_id, arr);
      });
      (permissions ?? []).forEach((p) => {
        const cur = permissionMap.get(p.user_id) ?? []; cur.push(p.permission); permissionMap.set(p.user_id, cur);
      });
      return (usersList?.users ?? []).map((u) => ({
        id: u.id,
        email: u.email ?? "",
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at ?? null,
        banned_until: (u as unknown as { banned_until?: string | null }).banned_until ?? null,
        roles: roleMap.get(u.id) ?? [],
        is_super_admin: superSet.has(u.id),
        username: profileMap.get(u.id)?.username ?? "",
        department: profileMap.get(u.id)?.department ?? null,
        permissions: permissionMap.get(u.id) ?? [],
      }));
    }
    case "inviteAdmin": {
      const data = schemas.inviteAdmin.parse(raw);
      const redirectTo = `${process.env["SITE_URL"] ?? ""}/auth`;
      const { data: invited, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(data.email, redirectTo ? { redirectTo } : undefined);
      if (error) throw new Error(error.message);
      const id = invited?.user?.id;
      if (!id) throw new Error("Invitation did not create an account");
      await supabaseAdmin.from("profiles").upsert({ user_id: id, username: data.username, department: data.department }, { onConflict: "user_id" });
      if (data.department === "admin") {
        await supabaseAdmin.from("admin_invites").insert({ email: data.email, invited_by: actor.userId });
        await supabaseAdmin.from("user_roles").upsert({ user_id: id, role: "admin" }, { onConflict: "user_id,role" });
      }
      if (data.permissions.length) {
        await supabaseAdmin.from("user_permissions").insert(data.permissions.map((permission) => ({ user_id: id, permission, granted_by: actor.userId })));
      }
      await logAudit(actor, "invite_user", "user", id, { email: data.email, username: data.username, department: data.department, permissions: data.permissions });
      return { ok: true };
    }
    case "updateUserAccess": {
      const data = schemas.updateUserAccess.parse(raw);
      await supabaseAdmin.from("profiles").upsert({ user_id: data.userId, username: data.username, department: data.department }, { onConflict: "user_id" });
      await supabaseAdmin.from("user_permissions").delete().eq("user_id", data.userId);
      if (data.permissions.length) {
        await supabaseAdmin.from("user_permissions").insert(data.permissions.map((permission) => ({ user_id: data.userId, permission, granted_by: actor.userId })));
      }
      if (data.department === "admin") {
        await supabaseAdmin.from("user_roles").upsert({ user_id: data.userId, role: "admin" }, { onConflict: "user_id,role" });
      } else {
        await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId).eq("role", "admin");
        await supabaseAdmin.from("user_roles").upsert({ user_id: data.userId, role: "user" }, { onConflict: "user_id,role" });
      }
      await logAudit(actor, "update_user_access", "user", data.userId, { username: data.username, department: data.department, permissions: data.permissions });
      return { ok: true };
    }
    case "setUserDisabled": {
      const data = schemas.setUserDisabled.parse(raw);
      if (data.userId === actor.userId) throw new Error("You cannot disable your own account");
      const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
        ban_duration: data.disabled ? "876000h" : "none",
      } as unknown as { ban_duration: string });
      if (error) throw new Error(error.message);
      await logAudit(actor, data.disabled ? "disable_user" : "enable_user", "user", data.userId, {});
      return { ok: true };
    }
    case "deleteAdmin": {
      const data = schemas.deleteAdmin.parse(raw);
      if (data.userId === actor.userId) throw new Error("You cannot delete your own account");
      const { data: isSuper } = await supabaseAdmin.from("super_admins").select("user_id").eq("user_id", data.userId).maybeSingle();
      if (isSuper) throw new Error("Cannot delete a Super Admin");
      const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
      if (error) throw new Error(error.message);
      await logAudit(actor, "delete_user", "user", data.userId, {});
      return { ok: true };
    }
    case "setAdminRole": {
      const data = schemas.setAdminRole.parse(raw);
      if (data.makeAdmin) {
        await supabaseAdmin.from("user_roles").upsert({ user_id: data.userId, role: "admin" }, { onConflict: "user_id,role" });
      } else {
        const { data: isSuper } = await supabaseAdmin.from("super_admins").select("user_id").eq("user_id", data.userId).maybeSingle();
        if (isSuper) throw new Error("Cannot remove admin from a Super Admin");
        await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId).eq("role", "admin");
      }
      await logAudit(actor, data.makeAdmin ? "grant_admin" : "revoke_admin", "user_role", data.userId, {});
      return { ok: true };
    }
  }
}
