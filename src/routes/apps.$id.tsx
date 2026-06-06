import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import {
  Upload, Github, Zap, Table as TableIcon, FormInput, LayoutDashboard,
  Plus, Search, ArrowUpDown, Pencil, Trash2, Sparkles,
} from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { CSVImportModal } from "@/components/modals/CSVImportModal";
import { GitHubExportModal } from "@/components/modals/GitHubExportModal";
import { easeExpo } from "@/lib/motion";
import { useApp } from "@/hooks/useApp";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";

export const Route = createFileRoute("/apps/$id")({
  head: ({ params }) => ({
    meta: [{ title: `App — FORGEAI` }],
  }),
  component: AppPage,
});

function AppPage() {
  const { id } = Route.useParams();
  const { user, isLoading: authLoading } = useAuth();
  const { app, isLoading, refetch } = useApp(id);

  const [activeTableIdx, setActiveTableIdx] = useState(0);
  const [csvOpen, setCsvOpen] = useState(false);
  const [ghOpen, setGhOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [records, setRecords] = useState<any[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [newRowData, setNewRowData] = useState<Record<string, string>>({});
  const [addingRow, setAddingRow] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) window.location.href = "/auth";
  }, [user, authLoading]);

  const config = app?.config ? (typeof app.config === "string" ? JSON.parse(app.config) : app.config) : null;
  const tables = config?.tables ?? [];
  const activeTable = tables[activeTableIdx];

  // Fetch records when table changes
  useEffect(() => {
    if (!id || !activeTable) return;
    setRecordsLoading(true);
    api.get(`/api/data/${id}/${activeTable.name}`)
      .then(({ data }) => setRecords(data.records ?? []))
      .catch(() => setRecords([]))
      .finally(() => setRecordsLoading(false));
  }, [id, activeTableIdx, activeTable?.name]);

  async function handleAddRow() {
    if (!activeTable) return;
    setAddingRow(true);
    try {
      await api.post(`/api/data/${id}/${activeTable.name}`, newRowData);
      setNewRowData({});
      const { data } = await api.get(`/api/data/${id}/${activeTable.name}`);
      setRecords(data.records ?? []);
    } catch (e) {
    } finally {
      setAddingRow(false);
    }
  }

  async function handleDeleteRow(rowId: string) {
    if (!activeTable) return;
    await api.delete(`/api/data/${id}/${activeTable.name}/${rowId}`);
    setRecords((r) => r.filter((row) => row.id !== rowId));
  }

  async function handleAiRefine() {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    setAiError("");
    try {
      const { data } = await api.post(`/api/ai/refine-config`, { appId: id, prompt: aiPrompt, currentConfig: config });
      await api.patch(`/api/apps/${id}`, { config: data.config });
      setAiPrompt("");
      refetch();
    } catch (err: any) {
      setAiError(err?.response?.data?.message || "AI refinement failed.");
    } finally {
      setAiLoading(false);
    }
  }

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: "100vh" }}>
        <div className="eyebrow">// loading app...</div>
      </div>
    );
  }

  if (!app) {
    return (
      <main style={{ minHeight: "100vh", paddingTop: 96 }}>
        <Sidebar />
        <div style={{ marginLeft: 288 }} className="flex items-center justify-center py-32">
          <div className="glass-card p-12 text-center">
            <div className="eyebrow mb-4">// not found</div>
            <Link to="/dashboard" className="btn-forge">← Back to dashboard</Link>
          </div>
        </div>
      </main>
    );
  }

  const fields = activeTable?.fields?.map((f: any) => f.name) ?? [];
  const APP_COLORS = ["var(--forge-violet-bright)", "var(--forge-cyan-bright)", "var(--forge-coral-bright)", "var(--forge-gold-bright)"];

  return (
    <main style={{ minHeight: "100vh", paddingTop: 96 }}>
      <Sidebar />
      <div style={{ marginLeft: 288, paddingRight: 24, paddingBottom: 64 }}>

        {/* Title */}
        <div className="eyebrow mb-2">// app / {app.name}</div>
        <h1 className="display-xl" style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>{app.name}</h1>
        <div className="eyebrow mt-1" style={{ color: app.status === "LIVE" ? "var(--forge-cyan-bright)" : "var(--forge-gold-bright)" }}>
          {app.status?.toLowerCase()}
        </div>

        {/* Action bar */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: easeExpo, delay: 0.1 }} className="mt-6 flex flex-wrap gap-3">
          {[
            { Icon: Upload, label: "IMPORT CSV", color: "var(--forge-cyan-bright)", fn: () => setCsvOpen(true) },
            { Icon: Github, label: "GITHUB EXPORT", color: "#F1F0FF", fn: () => setGhOpen(true) },
          ].map((a) => (
            <button key={a.label} onClick={a.fn}
              className="flex items-center gap-2 rounded-lg px-4 py-2.5"
              style={{ border: `1px solid ${a.color}55`, color: a.color, fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.08em", background: "transparent" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = `${a.color}1A`)}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
              <a.Icon size={14} /> {a.label}
            </button>
          ))}
        </motion.div>

        {/* AI Refine */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: easeExpo, delay: 0.2 }} className="glass-card mt-6 p-5">
          <div className="eyebrow mb-3">// refine your app with ai</div>
          {aiError && <div className="mb-3 text-xs rounded px-3 py-2" style={{ background: "rgba(239,68,68,0.15)", color: "#f87171" }}>{aiError}</div>}
          <div className="flex gap-3">
            <textarea value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Add a new table called tasks with title, status, and due_date fields..."
              className="input-forge" style={{ minHeight: 72, resize: "vertical", fontFamily: "var(--font-mono)", background: "#08081A" }} />
            <button onClick={handleAiRefine} disabled={aiLoading || !aiPrompt.trim()}
              className="btn-forge whitespace-nowrap self-start disabled:opacity-40">
              {aiLoading ? "..." : "REFINE →"}
            </button>
          </div>
        </motion.div>

        {/* Three-panel layout */}
        <div className="mt-6 grid gap-4" style={{ gridTemplateColumns: "200px 1fr 260px" }}>

          {/* LEFT — Tables */}
          <div className="glass-card p-4">
            <div className="eyebrow mb-3" style={{ fontSize: "0.6rem" }}>// tables</div>
            <div className="flex flex-col gap-1">
              {tables.length === 0 ? (
                <p className="text-xs" style={{ color: "var(--forge-text-muted)" }}>No tables yet</p>
              ) : (
                tables.map((t: any, i: number) => (
                  <button key={t.name} onClick={() => setActiveTableIdx(i)}
                    className="flex items-center justify-between rounded-md px-3 py-2 text-left"
                    style={{
                      background: activeTableIdx === i ? "rgba(168,85,247,0.08)" : "transparent",
                      borderLeft: activeTableIdx === i ? "2px solid var(--forge-violet-bright)" : "2px solid transparent",
                      color: activeTableIdx === i ? "var(--forge-violet-bright)" : "var(--forge-text-secondary)",
                      fontFamily: "var(--font-mono)", fontSize: 12, transition: "all 200ms ease",
                    }}>
                    <span className="flex items-center gap-2"><TableIcon size={13} />{t.name}</span>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* CENTER — Table data */}
          <div className="glass-card p-5" style={{ minHeight: 480 }}>
            {!activeTable ? (
              <div className="flex items-center justify-center h-full">
                <p className="eyebrow" style={{ color: "var(--forge-text-muted)" }}>No table selected</p>
              </div>
            ) : (
              <>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="eyebrow">{activeTable.name}</div>
                  <button onClick={() => setAddingRow((v) => !v)} className="btn-forge !py-2 !px-4 !text-xs">
                    <Plus size={12} /> ADD ROW
                  </button>
                </div>

                {/* Add row form */}
                {addingRow && fields.length > 0 && (
                  <div className="mb-4 glass-card p-4 flex flex-wrap gap-3">
                    {fields.map((f: string) => (
                      <div key={f} className="flex flex-col gap-1" style={{ flex: "1 1 140px" }}>
                        <label className="eyebrow" style={{ fontSize: "0.55rem" }}>{f}</label>
                        <input className="input-forge" style={{ fontSize: 12, padding: "6px 10px" }}
                          value={newRowData[f] ?? ""}
                          onChange={(e) => setNewRowData((d) => ({ ...d, [f]: e.target.value }))} />
                      </div>
                    ))}
                    <div className="flex items-end gap-2 w-full">
                      <button onClick={handleAddRow} disabled={addingRow} className="btn-forge !py-2 !px-4 !text-xs">Save</button>
                      <button onClick={() => setAddingRow(false)} className="btn-ghost !py-2 !px-4 !text-xs">Cancel</button>
                    </div>
                  </div>
                )}

                {recordsLoading ? (
                  <div className="eyebrow" style={{ color: "var(--forge-text-muted)" }}>// loading...</div>
                ) : (
                  <div className="overflow-x-auto rounded-lg" style={{ border: "1px solid rgba(255,255,255,0.05)" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: "rgba(255,255,255,0.03)" }}>
                          {fields.map((f: string) => (
                            <th key={f} className="eyebrow"
                              style={{ padding: "12px 16px", textAlign: "left", fontSize: "0.6rem", color: "var(--forge-violet-bright)" }}>
                              {f}
                            </th>
                          ))}
                          <th />
                        </tr>
                      </thead>
                      <tbody>
                        {records.length === 0 ? (
                          <tr>
                            <td colSpan={fields.length + 1} style={{ padding: "24px 16px", textAlign: "center", color: "var(--forge-text-muted)", fontFamily: "var(--font-mono)", fontSize: 12 }}>
                              No records yet. Click ADD ROW to start.
                            </td>
                          </tr>
                        ) : (
                          records.map((row: any, i: number) => (
                            <tr key={row.id ?? i} className="group"
                              style={{ background: i % 2 ? "#0A0A0F" : "#0F0F1A", transition: "background 150ms" }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(168,85,247,0.06)")}
                              onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 ? "#0A0A0F" : "#0F0F1A")}>
                              {fields.map((f: string) => (
                                <td key={f} style={{ padding: "12px 16px", fontFamily: "var(--font-mono)" }}>
                                  {String(row[f] ?? "")}
                                </td>
                              ))}
                              <td style={{ padding: "12px 16px", textAlign: "right" }}>
                                <span className="opacity-0 group-hover:opacity-100 inline-flex gap-2 transition-opacity">
                                  <button onClick={() => handleDeleteRow(row.id)}>
                                    <Trash2 size={13} color="var(--forge-coral-bright)" />
                                  </button>
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
                <div className="mt-3 text-xs" style={{ color: "var(--forge-text-muted)", fontFamily: "var(--font-mono)" }}>
                  {records.length} records
                </div>
              </>
            )}
          </div>

          {/* RIGHT — Info */}
          <div className="flex flex-col gap-4">
            <div className="glass-card p-4">
              <div className="eyebrow mb-3" style={{ fontSize: "0.6rem" }}>// app info</div>
              <div className="space-y-2 text-xs font-mono" style={{ color: "var(--forge-text-secondary)" }}>
                {[
                  ["name", app.name],
                  ["status", app.status?.toLowerCase()],
                  ["tables", String(tables.length)],
                  ["created", new Date(app.createdAt).toLocaleDateString()],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span>{k}</span>
                    <span style={{ color: "var(--forge-text)" }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card p-4">
              <div className="eyebrow mb-3" style={{ fontSize: "0.6rem" }}>// tables</div>
              <div className="space-y-1 text-xs font-mono">
                {tables.map((t: any, i: number) => (
                  <button key={t.name} onClick={() => setActiveTableIdx(i)}
                    className="w-full flex items-center justify-between rounded-md px-2 py-2 text-left"
                    style={{ background: "rgba(255,255,255,0.02)" }}>
                    <span style={{ color: APP_COLORS[i % APP_COLORS.length] }}>{t.name}</span>
                    <span style={{ color: "var(--forge-text-muted)" }}>{t.fields?.length ?? 0}f</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="glass-card p-4">
              <div className="eyebrow mb-3" style={{ fontSize: "0.6rem" }}>// quick actions</div>
              <div className="space-y-2 text-xs">
                <button onClick={() => setCsvOpen(true)} className="block nav-link text-left">→ Import CSV data</button>
                <button onClick={() => setGhOpen(true)} className="block nav-link text-left">→ Export to GitHub</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <CSVImportModal open={csvOpen} onClose={() => setCsvOpen(false)}
        tableName={activeTable?.name ?? ""}
        fields={fields}
        appId={id}
        onImport={() => {
          const { data } = api.get(`/api/data/${id}/${activeTable?.name}`) as any;
          if (data) setRecords(data.records ?? []);
        }}
      />
      <GitHubExportModal open={ghOpen} onClose={() => setGhOpen(false)} appName={app.name} appId={id} />
    </main>
  );
}
