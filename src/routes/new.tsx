import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { lazy, Suspense, useEffect, useState } from "react";
import { ClientOnly } from "@/components/ClientOnly";
import { easeExpo } from "@/lib/motion";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";

const BuildScene = lazy(() => import("@/components/three/BuildScene"));

export const Route = createFileRoute("/new")({
  head: () => ({
    meta: [
      { title: "New app — FORGEAI" },
      { name: "description", content: "Forge a new application from a prompt." },
    ],
  }),
  component: NewAppPage,
});

const BUILD_STEPS = [
  "Parsing prompt",
  "Designing schema",
  "Generating config",
  "Provisioning tables",
  "Wiring server logic",
  "App ready",
];

function NewAppPage() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [prompt, setPrompt] = useState("");
  const [config, setConfig] = useState<any>(null);
  const [appId, setAppId] = useState<string | null>(null);
  const [completed, setCompleted] = useState(0);
  const [activeIdx, setActiveIdx] = useState(0);
  const [burst, setBurst] = useState(false);
  const [error, setError] = useState("");
  const [generating, setGenerating] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) window.location.href = "/auth";
  }, [user, authLoading]);

  // Build animation ticker
  useEffect(() => {
    if (step !== 3) return;
    if (completed >= BUILD_STEPS.length) return;
    const t = setTimeout(() => {
      setCompleted((c) => c + 1);
      setActiveIdx((i) => Math.min(i + 1, BUILD_STEPS.length - 1));
    }, 900);
    return () => clearTimeout(t);
  }, [step, completed]);

  // Navigate when done
  useEffect(() => {
    if (completed === BUILD_STEPS.length && appId) {
      setBurst(true);
      const t = setTimeout(() => navigate({ to: "/apps/$id", params: { id: appId } }), 1600);
      return () => clearTimeout(t);
    }
  }, [completed, appId, navigate]);

  async function handleGenerate() {
    setGenerating(true);
    setError("");
    try {
      const { data } = await api.post("/api/ai/generate-config", { prompt });
      setConfig(data.config);
      setStep(2);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to generate config. Check your Gemini API key.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleForge() {
    setStep(3);
    setCompleted(0);
    setActiveIdx(0);
    try {
      const { data } = await api.post("/api/apps", { config });
      setAppId(data.app.id);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to create app.");
      setStep(2);
    }
  }

  if (authLoading) return null;

  return (
    <main className="relative" style={{ minHeight: "100vh", paddingTop: 120 }}>
      {step === 3 && (
        <ClientOnly>
          <Suspense fallback={null}>
            <BuildScene totalSteps={BUILD_STEPS.length} completed={completed} />
          </Suspense>
        </ClientOnly>
      )}

      <div className="relative z-10 mx-auto max-w-3xl px-6 pb-24">
        <div className="eyebrow mb-3">// step {step} of 3</div>
        <h1 className="display-xl" style={{ fontSize: "clamp(2.25rem, 5vw, 3.75rem)" }}>
          {step === 1 && "What are we forging?"}
          {step === 2 && "Confirm the blueprint."}
          {step === 3 && (burst ? "Forge complete." : "Forging…")}
        </h1>

        {error && (
          <div className="mt-4 rounded-lg px-4 py-3 text-sm"
            style={{ background: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)" }}>
            {error}
          </div>
        )}

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.4, ease: easeExpo }} className="mt-8">
              <div className="glass-card p-6">
                <label className="eyebrow mb-3 block">// describe your app</label>
                <textarea
                  className="input-forge" rows={5} value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="A CRM with leads, deals and a Kanban board…"
                />
                <button onClick={handleGenerate} disabled={prompt.trim().length < 4 || generating}
                  className="btn-forge mt-5 w-full disabled:opacity-40">
                  {generating ? "// generating schema..." : "Generate Blueprint →"}
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && config && (
            <motion.div key="s2" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.4, ease: easeExpo }}
              className="mt-8 glass-card p-6">
              <div className="eyebrow mb-3">// blueprint — {config.appName}</div>
              <p style={{ color: "var(--forge-text)", lineHeight: 1.7 }}>{config.description || prompt}</p>

              {config.tables?.length > 0 && (
                <div className="mt-5">
                  <div className="eyebrow mb-2" style={{ fontSize: "0.6rem" }}>// tables</div>
                  <div className="flex flex-wrap gap-2">
                    {config.tables.map((t: any) => (
                      <div key={t.name} className="rounded-md px-3 py-2 text-xs"
                        style={{ border: "1px solid rgba(168,85,247,0.2)", background: "rgba(124,58,237,0.06)",
                          color: "var(--forge-violet-bright)", fontFamily: "var(--font-mono)" }}>
                        {t.name} · {t.fields?.length ?? 0} fields
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-5 flex gap-3">
                <button onClick={() => setStep(1)} className="btn-ghost">Back</button>
                <button onClick={handleForge} className="btn-forge flex-1">Begin forge →</button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="s3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }} className="mt-10 glass-card p-6 relative overflow-hidden">
              <div className="eyebrow mb-4">// build log</div>
              <ul className="flex flex-col gap-3">
                <AnimatePresence>
                  {BUILD_STEPS.slice(0, Math.min(activeIdx + 1, BUILD_STEPS.length)).map((label, i) => {
                    const isDone = i < completed;
                    const isActive = i === completed;
                    return (
                      <motion.li key={label} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.35, ease: easeExpo }} className="flex items-center gap-3">
                        <div style={{ width: 24 }}>
                          {isDone ? (
                            <motion.span key="done" initial={{ scale: 0 }} animate={{ scale: 1 }}
                              style={{ color: "var(--forge-violet-bright)" }}>✓</motion.span>
                          ) : isActive ? (
                            <motion.span key="active" animate={{ scale: [1, 1.3, 1] }}
                              transition={{ duration: 1, repeat: Infinity }}
                              style={{ color: "var(--forge-cyan-bright)", display: "inline-block" }}>●</motion.span>
                          ) : (
                            <span style={{ color: "var(--forge-text-muted)" }}>○</span>
                          )}
                        </div>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.9rem",
                          color: isDone ? "var(--forge-text)" : isActive ? "var(--forge-cyan-bright)" : "var(--forge-text-muted)" }}>
                          {label}
                        </span>
                      </motion.li>
                    );
                  })}
                </AnimatePresence>
              </ul>
              {burst && (
                <motion.div initial={{ scale: 0, opacity: 0.6 }} animate={{ scale: 4, opacity: 0 }}
                  transition={{ duration: 0.6, ease: easeExpo }}
                  style={{ position: "absolute", left: "50%", top: "50%", width: 100, height: 100,
                    marginLeft: -50, marginTop: -50, borderRadius: "50%", background: "#7C3AED",
                    boxShadow: "0 0 60px #7C3AED", pointerEvents: "none" }} />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
