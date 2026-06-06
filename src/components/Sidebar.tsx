import { Link, useRouterState } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { easeExpo } from "@/lib/motion";

const ITEMS = [
  { to: "/dashboard", label: "Overview", icon: "▣" },
  { to: "/new", label: "New App", icon: "✦" },
  { to: "/apps/$id", params: { id: "demo" }, label: "My Apps", icon: "◈", prefix: "/apps" },
  { to: "/settings", label: "Settings", icon: "⚙" },
];

export function Sidebar() {
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <motion.aside
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: easeExpo, delay: 0.1 }}
      className="glass-card"
      style={{
        position: "fixed",
        top: 96,
        left: 24,
        bottom: 24,
        width: 240,
        padding: 16,
        zIndex: 50,
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <div className="eyebrow mb-4 px-2">// menu</div>
      {ITEMS.map((item, i) => {
        const active = "prefix" in item 
          ? path.startsWith(item.prefix as string)
          : path === item.to || (item.to !== "/dashboard" && path.startsWith(item.to));
        return (
          <motion.div
            key={item.to}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: easeExpo, delay: 0.2 + i * 0.04 }}
            style={{ position: "relative" }}
          >
            <Link
              to={item.to as any}
              params={(item as any).params}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm relative z-10"
              style={{
                color: active ? "var(--forge-text)" : "var(--forge-text-secondary)",
                transition: "color 200ms ease",
              }}
            >
              <span
                style={{
                  color: active ? "var(--forge-violet-bright)" : "var(--forge-text-muted)",
                  fontSize: "1.1rem",
                }}
              >
                {item.icon}
              </span>
              {item.label}
            </Link>
            {active && (
              <motion.div
                layoutId="sidebar-active-bg"
                transition={{ duration: 0.4, ease: easeExpo }}
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: 10,
                  background:
                    "linear-gradient(90deg, rgba(124,58,237,0.18), rgba(124,58,237,0.04))",
                  border: "1px solid rgba(168,85,247,0.25)",
                  zIndex: 0,
                }}
              />
            )}
          </motion.div>
        );
      })}
      <div className="mt-auto px-2 pt-4">
        <div className="eyebrow" style={{ fontSize: "0.65rem" }}>
          // status
        </div>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.7rem",
            color: "var(--forge-cyan-bright)",
            marginTop: 6,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "var(--forge-cyan-bright)",
              boxShadow: "0 0 8px var(--forge-cyan-bright)",
            }}
          />
          engine online
        </div>
      </div>
    </motion.aside>
  );
}
