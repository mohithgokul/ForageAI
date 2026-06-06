import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { lazy, Suspense, useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { ClientOnly } from "@/components/ClientOnly";
import { cardGridContainer, cardGridItem, easeExpo } from "@/lib/motion";
import { useAuth } from "@/context/AuthContext";
import { useApps } from "@/hooks/useApps";

const DashboardScene = lazy(() => import("@/components/three/DashboardScene"));

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — FORGEAI" },
      { name: "description", content: "Your forged applications." },
    ],
  }),
  component: DashboardPage,
});

const APP_COLORS = [
  "var(--forge-violet-bright)",
  "var(--forge-cyan-bright)",
  "var(--forge-coral-bright)",
  "var(--forge-gold-bright)",
];

function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { apps, isLoading } = useApps();

  useEffect(() => {
    if (!authLoading && !user) window.location.href = "/auth";
  }, [user, authLoading]);

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: "100vh" }}>
        <div className="eyebrow">// loading...</div>
      </div>
    );
  }

  const liveCount = apps.filter((a: any) => a.status === "LIVE").length;
  const totalRecords = apps.reduce((s: number, a: any) => s + (a.totalRecords || 0), 0);
  const totalTables = apps.reduce((s: number, a: any) => s + (a.config?.tables?.length || 0), 0);

  return (
    <main style={{ minHeight: "100vh", paddingTop: 96 }}>
      <Sidebar />
      <div style={{ marginLeft: 288, paddingRight: 32, paddingBottom: 64 }}>

        {/* Header */}
        <div className="flex items-start justify-between gap-8 mb-12">
          <div>
            <div className="eyebrow">// dashboard</div>
            <h1 className="display-xl mt-2" style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)" }}>
              Your forge.
            </h1>
            <p className="mt-3 text-base" style={{ color: "var(--forge-text-secondary)" }}>
              {isLoading ? "Loading..." : `${apps.length} application${apps.length !== 1 ? "s" : ""}.`}
            </p>
          </div>
          <ClientOnly>
            <div className="flex flex-col items-end gap-2">
              <Suspense fallback={<div className="skeleton" style={{ width: 280, height: 280 }} />}>
                <DashboardScene />
              </Suspense>
              <div className="eyebrow" style={{ fontSize: "0.65rem" }}>// forge engine active</div>
            </div>
          </ClientOnly>
        </div>

        {/* Stats */}
        <motion.div
          variants={cardGridContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 gap-4 md:grid-cols-4 mb-10"
        >
          {[
            { l: "Apps", v: String(apps.length) },
            { l: "Live", v: String(liveCount) },
            { l: "Tables", v: String(totalTables) },
            { l: "Records", v: String(totalRecords) },
          ].map((s) => (
            <motion.div key={s.l} variants={cardGridItem} className="glass-card p-5">
              <div className="eyebrow" style={{ fontSize: "0.65rem" }}>// {s.l}</div>
              <div
                style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "2rem", marginTop: 6 }}
                className="text-gradient-violet-cyan"
              >
                {s.v}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* App grid */}
        <div className="flex items-center justify-between mb-4">
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem" }}>Apps</h2>
          <Link to="/new" className="btn-forge !py-2 !px-4 !text-xs">+ New app</Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton" style={{ height: 160, borderRadius: 16 }} />
            ))}
          </div>
        ) : apps.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <div className="eyebrow mb-4">// no apps yet</div>
            <p style={{ color: "var(--forge-text-secondary)" }}>Create your first app to get started.</p>
            <Link to="/new" className="btn-forge mt-6 inline-flex">+ Forge an app</Link>
          </div>
        ) : (
          <motion.div
            variants={cardGridContainer}
            initial="initial"
            animate="animate"
            className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3"
          >
            {apps.map((app: any, idx: number) => {
              const color = APP_COLORS[idx % APP_COLORS.length];
              return (
                <motion.div
                  key={app.id}
                  variants={cardGridItem}
                  whileHover={{ y: -6 }}
                  transition={{ duration: 0.3, ease: easeExpo }}
                  className="glass-card p-6 relative"
                >
                  <Link to="/apps/$id" params={{ id: app.id }} className="block">
                    <div
                      style={{
                        width: 40, height: 40, borderRadius: 8,
                        background: color, boxShadow: `0 0 24px ${color}`, marginBottom: 16,
                      }}
                    />
                    <div className="flex items-center justify-between">
                      <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", fontWeight: 700 }}>
                        {app.name}
                      </h3>
                      <span className="eyebrow" style={{ fontSize: "0.6rem", color }}>
                        {app.status?.toLowerCase()}
                      </span>
                    </div>
                    <p className="mt-2 text-xs" style={{ color: "var(--forge-text-muted)" }}>
                      {app.totalRecords ?? 0} records · {app.config?.tables?.length ?? 0} tables
                    </p>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </main>
  );
}
