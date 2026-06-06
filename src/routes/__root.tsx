import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { AnimatePresence } from "framer-motion";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";

import { PageTransition } from "@/components/transitions/PageTransition";
import { Navbar } from "@/components/Navbar";
import { NoiseOverlay } from "@/components/NoiseOverlay";
import { Cursor } from "@/components/Cursor";
import { ClientOnly } from "@/components/ClientOnly";
import { AuthProvider } from "@/context/AuthContext";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass-card max-w-md p-12 text-center">
        <h1 className="display-xl text-gradient-violet-cyan">404</h1>
        <p className="mt-4 text-sm" style={{ color: "var(--forge-text-secondary)" }}>
          This route is not in the forge.
        </p>
        <Link to="/" className="btn-forge mt-6 inline-flex">
          Return home
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => {
    console.log(error);
  }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass-card max-w-md p-12 text-center">
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem" }}>Forge interrupted</h1>
        <p className="mt-2 text-sm" style={{ color: "var(--forge-text-secondary)" }}>
          Something glitched in the render pipeline.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="btn-forge"
          >
            Retry
          </button>
          <a href="/" className="btn-ghost">
            Home
          </a>
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
      { title: "FORGEAI — AI-powered app generator" },
      { name: "description", content: "Generate full-stack applications from a single prompt." },
      { name: "author", content: "FORGEAI" },
      { property: "og:title", content: "FORGEAI" },
      {
        property: "og:description",
        content: "Generate full-stack applications from a single prompt.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Mono:wght@300;400;500&display=swap",
      },
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
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Navbar />
        <NoiseOverlay />
        <ClientOnly>
          <Cursor />
        </ClientOnly>
        <AnimatePresence mode="wait" initial={false}>
          <PageTransition key={path} path={path}>
            <Outlet />
          </PageTransition>
        </AnimatePresence>
      </AuthProvider>
    </QueryClientProvider>
  );
}
