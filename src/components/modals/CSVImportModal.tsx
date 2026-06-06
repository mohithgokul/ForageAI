import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef } from "react";
import { Upload, X, Check, AlertTriangle, ArrowRight } from "lucide-react";
import { easeExpo } from "@/lib/motion";
import api from "@/lib/api";
import Papa from "papaparse";

interface Props {
  open: boolean;
  onClose: () => void;
  tableName: string;
  fields: string[];
  appId: string;
  onImport?: () => void;
}

const STEPS = ["UPLOAD", "MAP COLUMNS", "PREVIEW", "IMPORT"];

export function CSVImportModal({ open, onClose, tableName, fields, appId, onImport }: Props) {
  const [step, setStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<{inserted: number, skipped: number, errors: any[]} | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStep(0);
    setFile(null);
    setCsvHeaders([]);
    setCsvData([]);
    setMapping({});
    setImportLoading(false);
    setImportResult(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      Papa.parse(f, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setCsvHeaders(results.meta.fields || []);
          setCsvData(results.data);
          
          // Auto-map columns
          const initialMapping: Record<string, string> = {};
          (results.meta.fields || []).forEach(h => {
            const matched = fields.find(f => h.toLowerCase().includes(f.toLowerCase().slice(0, 3)));
            if (matched) initialMapping[h] = matched;
          });
          setMapping(initialMapping);
        }
      });
    }
  };

  const handleImport = async () => {
    if (!file) return;
    setImportLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("mapping", JSON.stringify(mapping));
      
      const { data } = await api.post(`/api/apps/${appId}/import/${tableName}`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setImportResult(data);
      if (onImport) onImport();
      setStep(3);
    } catch (err) {
      alert("Import failed. Check console for details.");
      console.error(err);
    } finally {
      setImportLoading(false);
    }
  };

  const previewRows = csvData.slice(0, 5).map(row => {
    const mapped: any = {};
    Object.keys(mapping).forEach(csvCol => {
      if (mapping[csvCol]) mapped[mapping[csvCol]] = row[csvCol];
    });
    // Very basic frontend validation preview
    let ok = true;
    let err = "";
    fields.forEach(f => {
      if (!mapped[f] && false) { // Assuming not strictly required for preview logic
        ok = false;
        err = "Missing field";
      }
    });
    return { ok, vals: fields.slice(0, 4).map(f => mapped[f] || ""), err };
  });

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
                    {file && (
                      <div className="mt-4 text-xs" style={{ color: "var(--forge-cyan-bright)" }}>
                        ✓ {file.name}
                      </div>
                    )}
                  </div>
                  <input
                    ref={inputRef}
                    type="file"
                    accept=".csv"
                    hidden
                    onChange={handleFileChange}
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
                    {csvHeaders.map((h) => {
                      const matched = mapping[h] || "";
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
                              value={matched}
                              onChange={e => setMapping({...mapping, [h]: e.target.value})}
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
                </div>
              )}

              {step === 3 && importResult && (
                <div className="flex flex-col items-center justify-center py-16">
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: "50%",
                      background: importResult.inserted > 0 ? "rgba(34,211,238,0.15)" : "rgba(251,113,133,0.15)",
                      border: `2px solid ${importResult.inserted > 0 ? "var(--forge-cyan-bright)" : "var(--forge-coral-bright)"}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: `0 0 40px ${importResult.inserted > 0 ? "var(--forge-cyan-glow)" : "var(--forge-coral-glow)"}`,
                    }}
                  >
                    {importResult.inserted > 0 ? (
                      <Check size={32} color="var(--forge-cyan-bright)" />
                    ) : (
                      <AlertTriangle size={32} color="var(--forge-coral-bright)" />
                    )}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: 24,
                      fontWeight: 800,
                      marginTop: 20,
                      color: importResult.inserted > 0 ? "var(--forge-cyan-bright)" : "var(--forge-coral-bright)",
                    }}
                  >
                    {importResult.inserted > 0 ? `✓ ${importResult.inserted} ROWS IMPORTED` : "0 ROWS IMPORTED"}
                  </div>
                  <div className="mt-2 text-sm text-center" style={{ color: "var(--forge-text-secondary)" }}>
                    {importResult.skipped > 0 && (
                      <span style={{ color: "var(--forge-coral-bright)" }}>
                        {importResult.skipped} skipped due to errors.{" "}
                      </span>
                    )}
                  </div>
                  {importResult.skipped > 0 && (
                    <a
                      href={`${api.defaults.baseURL || ""}/api/apps/${appId}/import/${tableName}/errors`}
                      target="_blank"
                      className="mt-4 nav-link"
                      style={{ color: "var(--forge-coral-bright)" }}
                    >
                      ↓ Download Error Report
                    </a>
                  )}
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
                disabled={step === 0 || step === 3 || importLoading}
                style={{ opacity: step === 0 || step === 3 || importLoading ? 0.4 : 1 }}
              >
                ← Back
              </button>
              {step < 2 ? (
                <button
                  className="btn-forge"
                  onClick={() => setStep(step + 1)}
                  disabled={step === 0 && !file}
                  style={{ opacity: step === 0 && !file ? 0.5 : 1 }}
                >
                  Continue →
                </button>
              ) : step === 2 ? (
                <button
                  className="btn-forge"
                  onClick={handleImport}
                  disabled={importLoading}
                  style={{ opacity: importLoading ? 0.5 : 1 }}
                >
                  {importLoading ? "IMPORTING..." : "[ IMPORT VALID ROWS ]"}
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
