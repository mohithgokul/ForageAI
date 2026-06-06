import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { X, FolderTree, FileCode, Atom, BookOpen, Download } from "lucide-react";
import { easeExpo } from "@/lib/motion";

interface Props {
  open: boolean;
  onClose: () => void;
  appName: string;
  appId: string;
}

const ARTIFACTS = [
  { Icon: FolderTree, name: "Prisma Schema", desc: "Typed models + relations + indexes" },
  { Icon: FileCode, name: "API Routes", desc: "REST endpoints for every table" },
  { Icon: Atom, name: "React Frontend", desc: "TanStack Start app with all views" },
  { Icon: BookOpen, name: "README.md", desc: "Setup + deploy instructions" },
];

export function GitHubExportModal({ open, onClose, appName }: Props) {
  const [repoName, setRepoName] = useState(appName.toLowerCase().replace(/\s+/g, "-"));
  const [includes, setIncludes] = useState([true, true, true, true]);
  const [seed, setSeed] = useState(true);
  const [pub, setPub] = useState(false);

  const tree = `${repoName}/
├── 📁 prisma/
│   └── 📄 schema.prisma
├── 📁 app/
│   ├── 📁 api/
│   │   ├── 📁 contacts/
│   │   │   └── 📄 route.ts
│   │   └── 📁 deals/
│   │       └── 📄 route.ts
│   └── 📁 (app)/
│       └── 📄 page.tsx
├── 📁 components/
│   └── 📁 renderer/
│       └── 📄 DynamicView.tsx
├── 📄 .env.example
└── 📄 README.md`;

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
          onClick={onClose}
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
            <div
              className="flex items-center justify-between border-b px-8 py-5"
              style={{ borderColor: "rgba(255,255,255,0.06)" }}
            >
              <div>
                <div className="eyebrow" style={{ fontSize: "0.65rem" }}>
                  // repository export
                </div>
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, marginTop: 4 }}>
                  EXPORT TO GITHUB —{" "}
                  <span style={{ color: "var(--forge-violet-bright)" }}>{appName}</span>
                </h2>
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-2"
                style={{ border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-8">
              {/* WHAT WILL BE EXPORTED */}
              <div className="eyebrow mb-3">// what will be exported</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                {ARTIFACTS.map((a, i) => (
                  <label
                    key={a.name}
                    className="cursor-pointer rounded-lg p-4 transition"
                    style={{
                      background: includes[i] ? "rgba(124,58,237,0.08)" : "rgba(255,255,255,0.02)",
                      border: `1px solid ${includes[i] ? "rgba(168,85,247,0.4)" : "rgba(255,255,255,0.06)"}`,
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <a.Icon
                        size={20}
                        color={
                          includes[i] ? "var(--forge-violet-bright)" : "var(--forge-text-muted)"
                        }
                      />
                      <input
                        type="checkbox"
                        checked={includes[i]}
                        onChange={() => setIncludes(includes.map((v, j) => (j === i ? !v : v)))}
                        style={{ accentColor: "var(--forge-violet)" }}
                      />
                    </div>
                    <div
                      style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 700 }}
                    >
                      {a.name}
                    </div>
                    <div className="text-xs mt-1" style={{ color: "var(--forge-text-secondary)" }}>
                      {a.desc}
                    </div>
                  </label>
                ))}
              </div>

              {/* CONFIG */}
              <div className="eyebrow mb-3">// repository configuration</div>
              <div className="grid md:grid-cols-2 gap-4 mb-8">
                <div>
                  <label className="eyebrow mb-2 block" style={{ fontSize: "0.6rem" }}>
                    // repo name
                  </label>
                  <input
                    className="input-forge"
                    value={repoName}
                    onChange={(e) => setRepoName(e.target.value)}
                  />
                </div>
                <div className="flex flex-col justify-end gap-3 text-sm">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={seed}
                      onChange={() => setSeed(!seed)}
                      style={{ accentColor: "var(--forge-violet)" }}
                    />
                    Include sample seed data (seed.ts)
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={pub}
                      onChange={() => setPub(!pub)}
                      style={{ accentColor: "var(--forge-violet)" }}
                    />
                    Make repository public
                  </label>
                </div>
              </div>

              {/* TREE PREVIEW */}
              <div className="eyebrow mb-3">// file tree preview</div>
              <pre
                style={{
                  background: "#0A0A14",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 10,
                  padding: 20,
                  fontFamily: "var(--font-mono)",
                  fontSize: 13,
                  color: "var(--forge-text)",
                  lineHeight: 1.7,
                  whiteSpace: "pre",
                  overflow: "auto",
                }}
              >
                {tree}
              </pre>
            </div>

            <div className="border-t px-8 py-6" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              <button className="btn-forge w-full">
                <Download size={16} /> [ DOWNLOAD AS ZIP ]
              </button>
              <div className="eyebrow mt-3 text-center" style={{ fontSize: "0.6rem" }}>
                // the code is 100% yours. no lock-in.
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
