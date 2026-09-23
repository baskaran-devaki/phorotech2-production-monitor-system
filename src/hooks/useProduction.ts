import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { ProductionEntry } from "@/lib/production";
import { fetchAllProductionEntries } from "@/lib/production-data";

export function useProductionEntries() {
  const [entries, setEntries] = useState<ProductionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [online, setOnline] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const data = await fetchAllProductionEntries();
        if (!mounted) return;
        setEntries(data);
        setLastUpdated(new Date());
      } catch (error) {
        console.error(error);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();

    const channel = supabase
      .channel("production_entries_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "production_entries" },
        () => load(),
      )
      .subscribe((status) => {
        setOnline(status === "SUBSCRIBED" || status === "CHANNEL_ERROR" ? status === "SUBSCRIBED" : online);
      });

    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    setOnline(navigator.onLine);

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { entries, loading, lastUpdated, online };
}

export function useAuthUser() {
  const [user, setUser] = useState<{ id: string; email: string | null } | null | undefined>(undefined);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function refresh() {
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;
      if (data.user) {
        setUser({ id: data.user.id, email: data.user.email ?? null });
        const [{ data: roles }, { data: sup }] = await Promise.all([
          supabase.from("user_roles").select("role").eq("user_id", data.user.id),
          supabase.from("super_admins").select("user_id").eq("user_id", data.user.id).maybeSingle(),
        ]);
        setIsAdmin(!!roles?.some((r) => r.role === "admin"));
        setIsSuperAdmin(!!sup);
      } else {
        setUser(null); setIsAdmin(false); setIsSuperAdmin(false);
      }
    }
    refresh();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") refresh();
    });
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, []);

  return { user, isAdmin, isSuperAdmin };
}

export function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}
