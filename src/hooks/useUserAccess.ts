import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type PermissionKey = Database["public"]["Enums"]["permission_key"];
export type UserDepartment = Database["public"]["Enums"]["user_department"];

export function useUserAccess() {
  const [department, setDepartment] = useState<UserDepartment | null>(null);
  const [permissions, setPermissions] = useState<PermissionKey[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      setDepartment(null);
      setPermissions([]);
      setLoading(false);
      return;
    }
    const [{ data: profile }, { data: grants }] = await Promise.all([
      supabase.from("profiles").select("department").eq("user_id", auth.user.id).maybeSingle(),
      supabase.from("user_permissions").select("permission").eq("user_id", auth.user.id),
    ]);
    setDepartment(profile?.department ?? null);
    setPermissions((grants ?? []).map((grant) => grant.permission));
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);
  return { department, permissions, loading, hasPermission: (permission: PermissionKey) => permissions.includes(permission), reload: load };
}