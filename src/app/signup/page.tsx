"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Film, Loader2 } from "lucide-react";

export default function SignUp() {
  const router = useRouter();
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 1. Create account
      const res = await fetch("/api/signup", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); setLoading(false); return; }

      // 2. Auto sign in
      const result = await signIn("credentials", {
        email, password, redirect: false,
      });
      if (result?.error) { setError("Account created but sign in failed. Try signing in."); setLoading(false); return; }

      router.refresh();
      router.push("/dashboard");
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%", background: "#040d21",
    border: "0.5px solid #1e3a8a", borderRadius: "9px",
    padding: "11px 14px", fontSize: "14px",
    color: "#e2e8f0", outline: "none",
    fontFamily: "var(--font-display)",
    transition: "border-color 0.15s",
  };

  return (
    <main style={{ maxWidth: "420px", margin: "0 auto", padding: "60px 20px 80px" }}>
      <div style={{ textAlign: "center", marginBottom: "32px" }}>
        <div style={{
          width: "48px", height: "48px", background: "#3b82f6",
          borderRadius: "12px", display: "flex", alignItems: "center",
          justifyContent: "center", margin: "0 auto 14px",
        }}>
          <Film size={22} color="#fff" />
        </div>
        <h1 style={{ fontSize: "24px", fontWeight: "800",
                     letterSpacing: "-0.03em", color: "#e2e8f0", marginBottom: "6px" }}>
          Create your account
        </h1>
        <p style={{ fontSize: "14px", color: "#64748b" }}>
          Start dubbing videos in any language
        </p>
      </div>

      <div style={{
        background: "#071330", border: "0.5px solid #1e3a8a",
        borderRadius: "16px", padding: "28px",
      }}>
        {error && (
          <div style={{
            background: "rgba(239,68,68,0.1)",
            border: "0.5px solid rgba(239,68,68,0.3)",
            borderRadius: "8px", padding: "10px 14px",
            fontSize: "13px", color: "#f87171",
            marginBottom: "16px", fontFamily: "var(--font-mono)",
          }}>
            ⚠ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Name */}
          <div style={{ marginBottom: "14px" }}>
            <label style={{ fontSize: "12px", fontWeight: "600",
                            color: "#64748b", display: "block", marginBottom: "7px" }}>
              Full name
            </label>
            <input type="text" required value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Siddhesh Patil"
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = "#3b82f6"}
              onBlur={e  => e.target.style.borderColor = "#1e3a8a"}
            />
          </div>

          {/* Email */}
          <div style={{ marginBottom: "14px" }}>
            <label style={{ fontSize: "12px", fontWeight: "600",
                            color: "#64748b", display: "block", marginBottom: "7px" }}>
              Email
            </label>
            <input type="email" required value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = "#3b82f6"}
              onBlur={e  => e.target.style.borderColor = "#1e3a8a"}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: "22px" }}>
            <label style={{ fontSize: "12px", fontWeight: "600",
                            color: "#64748b", display: "block", marginBottom: "7px" }}>
              Password
            </label>
            <input type="password" required value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = "#3b82f6"}
              onBlur={e  => e.target.style.borderColor = "#1e3a8a"}
            />
          </div>

          <button type="submit" disabled={loading} style={{
            width: "100%", background: "#3b82f6", color: "#fff",
            border: "none", borderRadius: "10px", padding: "13px",
            fontSize: "14px", fontWeight: "700",
            fontFamily: "var(--font-display)", cursor: "pointer",
            display: "flex", alignItems: "center",
            justifyContent: "center", gap: "8px", transition: "background 0.15s",
          }}
            onMouseEnter={e => e.currentTarget.style.background = "#2563eb"}
            onMouseLeave={e => e.currentTarget.style.background = "#3b82f6"}
          >
            {loading
              ? <><Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> Creating account...</>
              : "Create account"
            }
          </button>
        </form>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "20px 0" }}>
          <div style={{ flex: 1, height: "0.5px", background: "#0d1f4a" }} />
          <span style={{ fontSize: "12px", color: "#334155" }}>or</span>
          <div style={{ flex: 1, height: "0.5px", background: "#0d1f4a" }} />
        </div>

        <p style={{ textAlign: "center", fontSize: "13px", color: "#64748b" }}>
          Already have an account?{" "}
          <Link href="/signin" style={{ color: "#3b82f6", fontWeight: "600", textDecoration: "none" }}>
            Sign in
          </Link>
        </p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </main>
  );
}
