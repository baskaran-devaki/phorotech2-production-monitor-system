import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function assertSuperAdmin(context: any) {
  const { data, error } = await context.supabase.rpc("is_super_admin", { _user_id: context.userId });
  if (error) throw new Error("Authorization check failed");
  if (!data) throw new Error("Forbidden: super admin only");
}

async function logAudit(actorId: string, actorEmail: string | null, action: string, entity: string, entityId: string | null, details: Record<string, unknown>) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin.from("audit_logs").insert({
    actor_id: actorId, actor_email: actorEmail, action, entity, entity_id: entityId, details: details as never,
  });
}

export const listAdminUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertSuperAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rolesRows } = await supabaseAdmin.from("user_roles").select("user_id, role, created_at");
    const { data: supers } = await supabaseAdmin.from("super_admins").select("user_id");
    const { data: usersList } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const { data: profiles } = await supabaseAdmin.from("profiles").select("user_id, username, department");
    const { data: permissions } = await supabaseAdmin.from("user_permissions").select("user_id, permission");
    const superSet = new Set((supers ?? []).map((s: { user_id: string }) => s.user_id));
    const roleMap = new Map<string, string[]>();
    const profileMap = new Map((profiles ?? []).map((profile) => [profile.user_id, profile]));
    const permissionMap = new Map<string, string[]>();
    (rolesRows ?? []).forEach((r: { user_id: string; role: string }) => {
      const arr = roleMap.get(r.user_id) ?? [];
      arr.push(r.role); roleMap.set(r.user_id, arr);
    });
    (permissions ?? []).forEach((permission) => {
      const current = permissionMap.get(permission.user_id) ?? [];
      current.push(permission.permission);
      permissionMap.set(permission.user_id, current);
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
  });

export const inviteAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    email: z.string().trim().email().max(255),
    username: z.string().trim().min(2).max(60),
    department: z.enum(["production", "maintenance", "admin"]),
    permissions: z.array(z.enum(["dashboard_view", "production_view", "production_entry", "downtime_view", "downtime_entry", "downtime_close", "reports", "analytics", "tv_mode", "notifications"])),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const redirectTo = `${process.env.SITE_URL ?? ""}/auth`;
    const { data: invited, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(data.email, redirectTo ? { redirectTo } : undefined);
    if (error) throw new Error(error.message);
    const invitedUserId = invited?.user?.id;
    if (!invitedUserId) throw new Error("Invitation did not create an account");
    await supabaseAdmin.from("profiles").upsert({ user_id: invitedUserId, username: data.username, department: data.department }, { onConflict: "user_id" });
    if (data.department === "admin") {
      await supabaseAdmin.from("admin_invites").insert({ email: data.email, invited_by: context.userId });
      await supabaseAdmin.from("user_roles").upsert({ user_id: invitedUserId, role: "admin" }, { onConflict: "user_id,role" });
    }
    if (data.permissions.length) {
      await supabaseAdmin.from("user_permissions").insert(data.permissions.map((permission) => ({ user_id: invitedUserId, permission, granted_by: context.userId })));
    }
    await logAudit(context.userId, context.claims?.email ?? null, "invite_user", "user", invitedUserId, { email: data.email, username: data.username, department: data.department, permissions: data.permissions });
    return { ok: true };
  });

export const updateUserAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    userId: z.string().uuid(),
    username: z.string().trim().min(2).max(60),
    department: z.enum(["production", "maintenance", "admin"]),
    permissions: z.array(z.enum(["dashboard_view", "production_view", "production_entry", "downtime_view", "downtime_entry", "downtime_close", "reports", "analytics", "tv_mode", "notifications"])),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("profiles").upsert({ user_id: data.userId, username: data.username, department: data.department }, { onConflict: "user_id" });
    await supabaseAdmin.from("user_permissions").delete().eq("user_id", data.userId);
    if (data.permissions.length) {
      await supabaseAdmin.from("user_permissions").insert(data.permissions.map((permission) => ({ user_id: data.userId, permission, granted_by: context.userId })));
    }
    if (data.department === "admin") {
      await supabaseAdmin.from("user_roles").upsert({ user_id: data.userId, role: "admin" }, { onConflict: "user_id,role" });
    } else {
      await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId).eq("role", "admin");
      await supabaseAdmin.from("user_roles").upsert({ user_id: data.userId, role: "user" }, { onConflict: "user_id,role" });
    }
    await logAudit(context.userId, context.claims?.email ?? null, "update_user_access", "user", data.userId, { username: data.username, department: data.department, permissions: data.permissions });
    return { ok: true };
  });

export const setUserDisabled = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ userId: z.string().uuid(), disabled: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.userId === context.userId) throw new Error("You cannot disable your own account");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      ban_duration: data.disabled ? "876000h" : "none",
    } as unknown as { ban_duration: string });
    if (error) throw new Error(error.message);
    await logAudit(context.userId, context.claims?.email ?? null, data.disabled ? "disable_user" : "enable_user", "user", data.userId, {});
    return { ok: true };
  });

export const deleteAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ userId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context);
    if (data.userId === context.userId) throw new Error("You cannot delete your own account");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: isSuper } = await supabaseAdmin.from("super_admins").select("user_id").eq("user_id", data.userId).maybeSingle();
    if (isSuper) throw new Error("Cannot delete a Super Admin");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    await logAudit(context.userId, context.claims?.email ?? null, "delete_user", "user", data.userId, {});
    return { ok: true };
  });

export const setAdminRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ userId: z.string().uuid(), makeAdmin: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.makeAdmin) {
      await supabaseAdmin.from("user_roles").upsert({ user_id: data.userId, role: "admin" }, { onConflict: "user_id,role" });
    } else {
      const { data: isSuper } = await supabaseAdmin.from("super_admins").select("user_id").eq("user_id", data.userId).maybeSingle();
      if (isSuper) throw new Error("Cannot remove admin from a Super Admin");
      await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId).eq("role", "admin");
    }
    await logAudit(context.userId, context.claims?.email ?? null, data.makeAdmin ? "grant_admin" : "revoke_admin", "user_role", data.userId, {});
    return { ok: true };
  });
