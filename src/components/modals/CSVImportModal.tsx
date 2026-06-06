import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef } from "react";
import { Upload, X, Check, AlertTriangle, ArrowRight } from "lucide-react";
import { easeExpo } from "@/lib/motion";

interface Props {
  open: boolean;
  onClose: () => void;
  tableName: string;
  fields: string[];
  appId: string;
  onImport?: () => void;
}

const STEPS = ["UPLOAD", "MAP COLUMNS", "PREVIEW", "IMPORT"];

export function CSVImportModal({ open, onClose, tableName, fields }: Props) {
  const [step, setStep] = useState(0);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const csvHeaders = ["name", "email_address", "company", "phone", "unknown_col"];
  const previewRows = [
    {
      ok: true,
      vals: ["Ada Lovelace", "ada@analytical.engine", "Babbage Ltd", "+44 20 7946 0958"],
    },
    { ok: true, vals: ["Grace Hopper", "grace@navy.mil", "USN", "+1 202 555 0134"] },
    {
      ok: false,
      vals: ["Linus T.", "not-an-email", "Linux Foundation", "012"],
      err: "Invalid email",
    },
    { ok: true, vals: ["Margaret H.", "margaret@apollo.gov", "NASA", "+1 713 555 9876"] },
    { ok: false, vals: ["", "anon@void", "—", "—"], err: "Missing required: name" },
  ];

  const reset = () => {
    setStep(0);
    setFileName(null);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 flex items-center justify-center p-6"
          style={{ background: "rgba(5,5,15,0.85)", backdropFilter: "blur(16px)", zIndex: 1000 }}
          onClick={() => {
            onClose();
            reset();
          }}
        >
          <motion.div
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.4, ease: easeExpo }}
            onClick={(e) => e.stopPropagation()}
            className="glass-card relative w-full max-w-5xl overflow-hidden"
            style={{ maxHeight: "90vh", display: "flex", flexDirection: "column" }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between border-b px-8 py-5"
              style={{ borderColor: "rgba(255,255,255,0.06)" }}
            >
              <div>
                <div className="eyebrow" style={{ fontSize: "0.65rem" }}>
                  // data import
                </div>
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, marginTop: 4 }}>
                  IMPORT DATA →{" "}
                  <span style={{ color: "var(--forge-cyan-bright)" }}>{tableName}</span>
                </h2>
              </div>
              <button
                onClick={() => {
                  onClose();
                  reset();
                }}
                className="rounded-full p-2"
                style={{ border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Step indicator */}
            <div
              className="flex items-center gap-3 border-b px-8 py-5"
              style={{ borderColor: "rgba(255,255,255,0.06)" }}
            >
              {STEPS.map((s, i) => (
                <div key={s} className="flex items-center gap-3">
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "var(--font-mono)",
                      fontSize: 12,
                      background:
                        i < step
                          ? "var(--forge-violet)"
                          : i === step
                            ? "var(--forge-violet)"
                            : "rgba(255,255,255,0.05)",
                      color: i <= step ? "#fff" : "var(--forge-text-muted)",
                      boxShadow: i === step ? "0 0 16px var(--forge-violet-glow)" : "none",
                    }}
                  >
                    {i < step ? <Check size={14} /> : i + 1}
                  </div>
                  <span
                    className="eyebrow"
                    style={{
                      fontSize: "0.65rem",
                      color: i === step ? "var(--forge-violet-bright)" : "var(--forge-text-muted)",
                    }}
                  >
                    {s}
                  </span>
                  {i < STEPS.length - 1 && <ArrowRight size={14} color="var(--forge-text-muted)" />}
                </div>
              ))}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-auto p-8">
              {step === 0 && (
                <div>
                  <div
                    onClick={() => inputRef.current?.click()}
                    className="flex flex-col items-center justify-center rounded-xl py-16"
                    style={{
                      border: "2px dashed rgba(168,85,247,0.4)",
                      background: "rgba(124,58,237,0.04)",
                      cursor: "pointer",
                    }}
                  >
                    <Upload size={48} color="var(--forge-violet-bright)" strokeWidth={1.5} />
                    <div
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: 22,
                        marginTop: 16,
                        fontWeight: 700,
                      }}
                    >
                      DROP YOUR CSV FILE HERE
                    </div>
                    <div className="mt-3 text-sm" style={{ color: "var(--forge-text-secondary)" }}>
                      or{" "}
                      <span
                        style={{ color: "var(--forge-cyan-bright)", textDecoration: "underline" }}
                      >
                        [ BROWSE FILES ]
                      </span>
                    </div>
                    <div className="mt-2 text-xs" style={{ color: "var(--forge-text-muted)" }}>
                      Accepts .csv files up to 10MB
                    </div>
                    {fileName && (
                      <div className="mt-4 text-xs" style={{ color: "var(--forge-cyan-bright)" }}>
                        ✓ {fileName}
                      </div>
                    )}
                  </div>
                  <input
                    ref={inputRef}
                    type="file"
                    accept=".csv"
                    hidden
                    onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "sample.csv")}
                  />
                  <div className="mt-8">
                    <div className="eyebrow mb-3">// expected columns for this table</div>
                    <div className="flex flex-wrap gap-2">
                      {fields.map((f) => (
                        <span
                          key={f}
                          style={{
                            padding: "6px 12px",
                            borderRadius: 999,
                            border: "1px solid rgba(34,211,238,0.4)",
                            background: "rgba(34,211,238,0.08)",
                            color: "var(--forge-cyan-bright)",
                            fontFamily: "var(--font-mono)",
                            fontSize: 12,
                          }}
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {step === 1 && (
                <div>
                  <div className="eyebrow mb-4">// map your csv columns to table fields</div>
                  <div className="space-y-2">
                    {csvHeaders.map((h, i) => {
                      const matched = fields.find((f) =>
                        h.toLowerCase().includes(f.toLowerCase().slice(0, 3)),
                      );
                      return (
                        <div
                          key={h}
                          className="grid grid-cols-12 gap-3 items-center rounded-lg p-3"
                          style={{
                            background: "rgba(255,255,255,0.02)",
                            border: "1px solid rgba(255,255,255,0.04)",
                          }}
                        >
                          <div
                            className="col-span-5"
                            style={{ fontFamily: "var(--font-mono)", fontSize: 13 }}
                          >
                            {h}
                          </div>
                          <div className="col-span-1 text-center">
                            <ArrowRight size={14} color="var(--forge-text-muted)" />
                          </div>
                          <div className="col-span-5">
                            <select
                              defaultValue={matched ?? ""}
                              className="input-forge"
                              style={{ padding: "8px 12px", fontSize: 13 }}
                            >
                              <option value="">— SKIP THIS COLUMN —</option>
                              {fields.map((f) => (
                                <option key={f} value={f}>
                                  {f}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="col-span-1 flex justify-end">
                            {matched ? (
                              <Check size={16} color="var(--forge-cyan-bright)" />
                            ) : (
                              <AlertTriangle size={16} color="var(--forge-gold-bright)" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <div className="eyebrow">// validation preview</div>
                    <div className="text-xs" style={{ color: "var(--forge-text-secondary)" }}>
                      <span style={{ color: "var(--forge-cyan-bright)" }}>3 valid</span> ·{" "}
                      <span style={{ color: "var(--forge-coral-bright)" }}>2 invalid</span> ·{" "}
                      <span style={{ color: "var(--forge-text-muted)" }}>1 skipped</span>
                    </div>
                  </div>
                  <div
                    className="overflow-hidden rounded-lg"
                    style={{ border: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <table
                      style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        fontFamily: "var(--font-mono)",
                        fontSize: 12,
                      }}
                    >
                      <thead>
                        <tr style={{ background: "rgba(255,255,255,0.03)" }}>
                          <th style={{ width: 32, padding: 10 }} />
                          {fields.slice(0, 4).map((f) => (
                            <th
                              key={f}
                              className="eyebrow"
                              style={{ padding: 10, textAlign: "left", fontSize: "0.6rem" }}
                            >
                              {f}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {previewRows.map((r, i) => (
                          <tr
                            key={i}
                            title={r.err}
                            style={{
                              background: i % 2 ? "#0A0A0F" : "#0F0F1A",
                              borderTop: "1px solid rgba(255,255,255,0.04)",
                            }}
                          >
                            <td style={{ padding: 10 }}>
                              <div
                                style={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: "50%",
                                  background: r.ok
                                    ? "var(--forge-cyan-bright)"
                                    : "var(--forge-coral-bright)",
                                  boxShadow: `0 0 8px ${r.ok ? "var(--forge-cyan-bright)" : "var(--forge-coral-bright)"}`,
                                }}
                              />
                            </td>
                            {r.vals.map((v, j) => (
                              <td
                                key={j}
                                style={{
                                  padding: 10,
                                  color: r.ok ? "var(--forge-text)" : "var(--forge-coral-bright)",
                                }}
                              >
                                {v || "—"}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-4">
                    <button className="btn-ghost !py-2 !px-4 !text-xs">
                      ↓ Download error report
                    </button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="flex flex-col items-center justify-center py-16">
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: "50%",
                      background: "rgba(34,211,238,0.15)",
                      border: "2px solid var(--forge-cyan-bright)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 0 40px var(--forge-cyan-glow)",
                    }}
                  >
                    <Check size={32} color="var(--forge-cyan-bright)" />
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: 24,
                      fontWeight: 800,
                      marginTop: 20,
                      color: "var(--forge-cyan-bright)",
                    }}
                  >
                    ✓ 247 ROWS IMPORTED SUCCESSFULLY
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      reset();
                    }}
                    className="mt-6 nav-link"
                    style={{ color: "var(--forge-cyan-bright)" }}
                  >
                    View imported records →
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            <div
              className="flex items-center justify-between border-t px-8 py-5"
              style={{ borderColor: "rgba(255,255,255,0.06)" }}
            >
              <button
                className="btn-ghost !py-2 !px-4 !text-xs"
                onClick={() => setStep(Math.max(0, step - 1))}
                disabled={step === 0}
                style={{ opacity: step === 0 ? 0.4 : 1 }}
              >
                ← Back
              </button>
              {step < 3 ? (
                <button
                  className="btn-forge"
                  onClick={() => setStep(step + 1)}
                  disabled={step === 0 && !fileName}
                  style={{ opacity: step === 0 && !fileName ? 0.5 : 1 }}
                >
                  {step === 2 ? "[ IMPORT 3 VALID ROWS ]" : "Continue →"}
                </button>
              ) : (
                <button
                  className="btn-forge"
                  onClick={() => {
                    onClose();
                    reset();
                  }}
                >
                  Done
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
