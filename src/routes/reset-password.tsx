import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { KeyRound, Loader2 } from "lucide-react";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset Password · Phorotech" },
      { name: "description", content: "Reset your Phorotech PPMS account password." },
      { property: "og:title", content: "Reset Password · Phorotech" },
      { property: "og:description", content: "Reset your Phorotech PPMS account password." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated");
      navigate({ to: "/admin" });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative z-10 min-h-screen grid place-items-center px-4">
      <div className="w-full max-w-md glass-gold rounded-3xl p-6 sm:p-8 fade-up">
        <h1 className="display gold-text text-2xl text-center">Set a new password</h1>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div className="flex items-center gap-2 rounded-xl border border-[color:var(--border)] bg-[oklch(0.14_0.005_60/60%)] px-3 py-2.5">
            <KeyRound className="h-4 w-4 text-[color:var(--muted-foreground)]" />
            <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-transparent outline-none text-sm" placeholder="New password" />
          </div>
          <button disabled={loading} className="btn-gold w-full rounded-xl py-3 text-sm inline-flex items-center justify-center gap-2">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />} Update password
          </button>
        </form>
      </div>
    </main>
  );
}
