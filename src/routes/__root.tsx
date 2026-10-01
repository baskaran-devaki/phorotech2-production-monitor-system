import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { supabase } from "@/integrations/supabase/client";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass-gold max-w-md text-center rounded-3xl p-8">
        <h1 className="display gold-text text-7xl font-bold">404</h1>
        <h2 className="mt-3 text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-[color:var(--muted-foreground)]">The page you're looking for doesn't exist.</p>
        <a href="/" className="btn-gold mt-6 inline-flex rounded-xl px-4 py-2 text-sm">Go home</a>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  const router = useRouter();
  const normalizedError = error instanceof Error ? error : new Error(String(error));
  useEffect(() => { reportLovableError(normalizedError, { boundary: "tanstack_root_error_component" }); }, [normalizedError]);
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass-gold max-w-md text-center rounded-3xl p-8">
        <h1 className="display gold-text text-2xl">Something went wrong</h1>
        <p className="mt-2 text-sm text-[color:var(--muted-foreground)]">{normalizedError.message}</p>
        <div className="mt-6 flex justify-center gap-2">
          <button onClick={() => { router.invalidate(); reset(); }} className="btn-gold rounded-xl px-4 py-2 text-sm">Try again</button>
          <a href="/" className="rounded-xl px-4 py-2 text-sm border border-[color:var(--border)]">Home</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Phorotech ED Plant · Production Dashboard" },
      { name: "description", content: "Live production monitoring dashboard for Phorotech Surfin India Pvt Ltd, Plant II ED Plant, Irungattukottai. Track shift-wise and hourly load counts in real time." },
      { name: "author", content: "Phorotech Surfin India" },
      { name: "theme-color", content: "#0B0B0B" },
      { property: "og:title", content: "Phorotech ED Plant · Production Dashboard" },
      { property: "og:description", content: "Live shift-wise industrial production monitoring." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700;800&family=Playfair+Display:wght@600;700;900&family=Poppins:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        router.invalidate();
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [router]);

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster theme="dark" position="top-center" toastOptions={{
        style: { background: "#0B0B0B", border: "1px solid #D4AF37", color: "#FFD700" },
      }} />
    </QueryClientProvider>
  );
}
