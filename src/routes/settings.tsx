import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { Sidebar } from "@/components/Sidebar";
import { cardGridContainer, cardGridItem } from "@/lib/motion";
import { useAuth } from "@/context/AuthContext";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — FORGEAI" },
      { name: "description", content: "Account, billing, and integrations." },
      { property: "og:title", content: "Settings — FORGEAI" },
      { property: "og:description", content: "Account, billing, and integrations." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) window.location.href = "/auth";
  }, [user, authLoading]);

  if (authLoading || !user) return null;

  return (
    <main style={{ minHeight: "100vh", paddingTop: 96 }}>
      <Sidebar />
      <div style={{ marginLeft: 288, paddingRight: 32, paddingBottom: 64, maxWidth: 880 }}>
        <div className="eyebrow mb-2">// settings</div>
        <h1 className="display-xl" style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)" }}>
          Configuration.
        </h1>

        <motion.div
          variants={cardGridContainer}
          initial="initial"
          animate="animate"
          className="mt-10 flex flex-col gap-5"
        >
          {[
            { t: "Account", c: <AccountForm /> },
            { t: "Forge defaults", c: <DefaultsForm /> },
            { t: "Integrations", c: <Integrations /> },
          ].map((s) => (
            <motion.div key={s.t} variants={cardGridItem} className="glass-card p-6">
              <div className="eyebrow mb-4">// {s.t}</div>
              {s.c}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </main>
  );
}

function AccountForm() {
  const { user } = useAuth();
  
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div>
        <label className="eyebrow mb-2 block">// name</label>
        <input className="input-forge" defaultValue={user?.name || ""} />
      </div>
      <div>
        <label className="eyebrow mb-2 block">// email</label>
        <input className="input-forge" defaultValue={user?.email || ""} />
      </div>
    </div>
  );
}

function DefaultsForm() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div>
        <label className="eyebrow mb-2 block">// runtime</label>
        <input className="input-forge" defaultValue="edge" />
      </div>
      <div>
        <label className="eyebrow mb-2 block">// db</label>
        <input className="input-forge" defaultValue="postgres" />
      </div>
    </div>
  );
}

function Integrations() {
  const items = [
    { t: "GitHub", v: "connected", c: "var(--forge-violet-bright)" },
    { t: "Vercel", v: "connected", c: "var(--forge-cyan-bright)" },
    { t: "Stripe", v: "not linked", c: "var(--forge-text-muted)" },
  ];
  return (
    <div className="flex flex-col gap-2">
      {items.map((i) => (
        <div
          key={i.t}
          className="flex items-center justify-between rounded-md px-3 py-2.5"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <span style={{ fontFamily: "var(--font-mono)" }}>{i.t}</span>
          <span className="eyebrow" style={{ color: i.c, fontSize: "0.65rem" }}>
            {i.v}
          </span>
        </div>
      ))}
    </div>
  );
}
