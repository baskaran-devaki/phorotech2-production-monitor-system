import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type ProductionMode = "AUTO" | "MANUAL";

/**
 * Global, plant-wide production mode.
 * Persisted in the database and shared by all users/devices.
 */
export function useProductionMode() {
  const [mode, setMode] = useState<ProductionMode | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("production_settings")
      .select("mode")
      .maybeSingle();

    if (error) {
      console.error("[production-mode] failed to load mode:", error);
      setMode("MANUAL");
    } else {
      setMode((data?.mode as ProductionMode) ?? "MANUAL");
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /**
   * Only authorized admins/super admins should be able
   * to change production mode through the database policy.
   */
  const setProductionMode = useCallback(
    async (next: ProductionMode) => {
      const { data: userRes, error: userError } =
        await supabase.auth.getUser();

      if (userError || !userRes.user) {
        throw new Error("You must be logged in to change production mode");
      }

      const { data, error } = await supabase
        .from("production_settings")
        .update({
          mode: next,
          updated_by: userRes.user.id,
        })
        .eq("id", true)
        .select("mode");

      if (error) {
        console.error(
          "[production-mode] failed to update mode:",
          error
        );
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error(
          "Not authorized to change production mode"
        );
      }

      setMode(next);
    },
    []
  );

  return {
    mode,
    loading,
    setProductionMode,
    refresh: load,
  };
}
