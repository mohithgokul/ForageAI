import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { lazy, Suspense, useState, useRef, useEffect } from "react";
import { ClientOnly } from "@/components/ClientOnly";
import { useAuth } from "@/context/AuthContext";

const AuthScene = lazy(() => import("@/components/three/AuthScene"));

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — FORGEAI" },
      { name: "description", content: "Access the forge." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { login, register, isLoading: authLoading, user } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      navigate({ to: "/dashboard", replace: true });
    }
  }, [user, authLoading, navigate]);

  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const email = emailRef.current!.value;
      const password = passwordRef.current!.value;
      if (mode === "signup") {
        const name = nameRef.current!.value;
        await register(name, email, password);
      } else {
        await login(email, password);
      }
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Something went wrong";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative" style={{ minHeight: "100vh" }}>
      <ClientOnly>
        <Suspense fallback={null}>
          <AuthScene />
        </Suspense>
      </ClientOnly>

      <div
        className="relative flex items-center justify-center px-4"
        style={{ minHeight: "100vh", zIndex: 10 }}
      >
        <motion.div
          animate={{ y: [-6, 6, -6] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          style={{
            width: 420,
            maxWidth: "100%",
            padding: 36,
            borderRadius: 20,
            background: "rgba(8, 8, 24, 0.7)",
            backdropFilter: "blur(24px) saturate(180%)",
            WebkitBackdropFilter: "blur(24px) saturate(180%)",
            border: "1px solid rgba(168, 85, 247, 0.3)",
            boxShadow: "0 0 60px rgba(124, 58, 237, 0.2), 0 0 120px rgba(124, 58, 237, 0.1)",
          }}
        >
          <div className="eyebrow">// {mode === "signin" ? "access" : "register"}</div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: "2rem",
              marginTop: 8,
              letterSpacing: "-0.02em",
            }}
          >
            {mode === "signin" ? "Re-enter the forge." : "Forge your account."}
          </h1>
          <p className="mt-2 text-sm" style={{ color: "var(--forge-text-secondary)" }}>
            {mode === "signin" ? "Welcome back, operator." : "Join the generative layer."}
          </p>

          {error && (
            <div
              className="mt-4 rounded-lg px-4 py-3 text-sm"
              style={{ background: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)" }}
            >
              {error}
            </div>
          )}

          <form className="mt-7 flex flex-col gap-4" onSubmit={handleSubmit}>
            {mode === "signup" && (
              <div>
                <label className="eyebrow mb-2 block">// name</label>
                <input ref={nameRef} className="input-forge" placeholder="Ada Lovelace" required />
              </div>
            )}
            <div>
              <label className="eyebrow mb-2 block">// email</label>
              <input ref={emailRef} className="input-forge" type="email" placeholder="you@forge.ai" required />
            </div>
            <div>
              <label className="eyebrow mb-2 block">// password</label>
              <input ref={passwordRef} className="input-forge" type="password" placeholder="••••••••" required minLength={8} />
            </div>

            <button type="submit" className="btn-forge mt-2 w-full" disabled={loading || authLoading}>
              {loading ? "// processing..." : mode === "signin" ? "Enter" : "Create account"}
            </button>
          </form>

          <div className="mt-6 text-center text-xs" style={{ color: "var(--forge-text-muted)" }}>
            {mode === "signin" ? "No account?" : "Have an account?"}{" "}
            <button
              onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(""); }}
              style={{ color: "var(--forge-cyan-bright)", background: "none", border: "none" }}
              className="nav-link !text-xs"
            >
              {mode === "signin" ? "Register" : "Sign in"}
            </button>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
