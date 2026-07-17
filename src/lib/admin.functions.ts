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
    const superSet = new Set((supers ?? []).map((s: { user_id: string }) => s.user_id));
    const roleMap = new Map<string, string[]>();
    (rolesRows ?? []).forEach((r: { user_id: string; role: string }) => {
      const arr = roleMap.get(r.user_id) ?? [];
      arr.push(r.role); roleMap.set(r.user_id, arr);
    });
    return (usersList?.users ?? []).map((u) => ({
      id: u.id,
      email: u.email ?? "",
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at ?? null,
      banned_until: (u as unknown as { banned_until?: string | null }).banned_until ?? null,
      roles: roleMap.get(u.id) ?? [],
      is_super_admin: superSet.has(u.id),
    }));
  });

export const inviteAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ email: z.string().trim().email().max(255) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const redirectTo = `${process.env.SITE_URL ?? ""}/auth`;
    const { data: invited, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(data.email, redirectTo ? { redirectTo } : undefined);
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("admin_invites").insert({ email: data.email, invited_by: context.userId });
    // If user already exists in the same call, immediately grant admin role
    if (invited?.user?.id) {
      await supabaseAdmin.from("user_roles").upsert({ user_id: invited.user.id, role: "admin" }, { onConflict: "user_id,role" });
    }
    await logAudit(context.userId, context.claims?.email ?? null, "invite_admin", "admin_invite", invited?.user?.id ?? null, { email: data.email });
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
