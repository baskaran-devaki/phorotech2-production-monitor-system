import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Mail, KeyRound, ArrowLeft } from "lucide-react";
import logoUrl from "@/assets/phorotech-logo.jpeg";
const logoAsset = { url: logoUrl };

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Admin Login · Phorotech ED Plant" },
      { name: "description", content: "Secure admin sign-in for Phorotech Surfin ED Plant production dashboard." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

type Mode = "signin" | "signup" | "forgot";

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Signed in");
        navigate({ to: "/" });
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${window.location.origin}/admin` },
        });
        if (error) throw error;
        toast.success("Account created. You can sign in now.");
        setMode("signin");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("Password reset email sent");
        setMode("signin");
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative z-10 min-h-screen grid place-items-center px-4 py-10">
      <div className="w-full max-w-md fade-up">
        <Link to="/" className="mb-4 inline-flex items-center gap-2 text-xs text-[color:var(--muted-foreground)] hover:text-[color:var(--gold-light)] transition">
          <ArrowLeft className="h-3 w-3" /> Back to dashboard
        </Link>
        <div className="glass-gold rounded-3xl p-6 sm:p-8 gold-glow">
          <div className="flex flex-col items-center text-center">
            <img src={logoAsset.url} alt="Phorotech Surfin India" className="h-16 w-16 rounded-md object-contain bg-background" />
            <h1 className="display gold-text text-2xl sm:text-3xl mt-3">PPMS Sign In</h1>
            <p className="text-xs text-[color:var(--muted-foreground)] mt-1">Phorotech · ED Plant · Irungattukottai</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <Field label="Email" icon={<Mail className="h-4 w-4" />}>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-transparent outline-none text-sm placeholder:text-[color:var(--muted-foreground)]"
                placeholder="admin@phorotech.in" autoComplete="email" />
            </Field>

            {mode !== "forgot" && (
              <Field label="Password" icon={<KeyRound className="h-4 w-4" />}>
                <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent outline-none text-sm placeholder:text-[color:var(--muted-foreground)]"
                  placeholder="••••••••" autoComplete={mode === "signup" ? "new-password" : "current-password"} />
              </Field>
            )}

            <button disabled={loading} className="btn-gold w-full rounded-xl py-3 text-sm inline-flex items-center justify-center gap-2 disabled:opacity-60">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "signin" ? "Sign In" : mode === "signup" ? "Create Account" : "Send Reset Link"}
            </button>
          </form>

          <div className="mt-5 flex flex-col gap-2 text-xs text-center text-[color:var(--muted-foreground)]">
            {mode === "signin" && (
              <button onClick={() => setMode("forgot")} className="hover:text-[color:var(--gold-light)] transition">Forgot password?</button>
            )}
            {mode !== "signin" && (
              <button onClick={() => setMode("signin")} className="hover:text-[color:var(--gold-light)] transition">← Back to sign in</button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function Field({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-[10px] uppercase tracking-widest text-[color:var(--gold-light)] mb-1.5">{label}</div>
      <div className="flex items-center gap-2 rounded-xl border border-[color:var(--border)] bg-[oklch(0.14_0.005_60/60%)] px-3 py-2.5 focus-within:border-[color:var(--gold)] transition">
        <span className="text-[color:var(--muted-foreground)]">{icon}</span>
        {children}
      </div>
    </label>
  );
}
