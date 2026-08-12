import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type ProductionMode = "AUTO" | "MANUAL";

/** Global, plant-wide production mode (persisted in the database, shared by all users/devices). */
export function useProductionMode() {
  const [mode, setMode] = useState<ProductionMode | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("production_settings")
      .select("mode")
      .maybeSingle();
    if (error) console.error(error);
    setMode(((data?.mode as ProductionMode) ?? "MANUAL") as ProductionMode);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const channel = supabase
      .channel("production_settings_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "production_settings" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  /** Only admins/super admins pass the database policy; others get an error. */
  const setProductionMode = useCallback(async (next: ProductionMode) => {
    const { data: userRes } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("production_settings")
      .update({ mode: next, updated_by: userRes.user?.id ?? null })
      .eq("id", true)
      .select("mode");
    if (error) throw error;
    if (!data || data.length === 0) throw new Error("Not authorized to change production mode");
    setMode(next);
  }, []);

  return { mode, loading, setProductionMode, refresh: load };
}
