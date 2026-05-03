"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import { Check, Zap, Loader2 } from "lucide-react";

const PLANS = [
  {
    id:       "starter",
    name:     "Starter",
    price:    29,
    minutes:  "30 min",
    desc:     "Perfect for trying VoiceOverAI",
    color:    "#475569",
    features: [
      "30 minutes of dubbing/month",
      "5 target languages",
      "Standard voice",
      "720p output",
      "Email support",
    ],
  },
  {
    id:       "pro",
    name:     "Pro",
    price:    99,
    minutes:  "3 hrs",
    desc:     "For serious content creators",
    color:    "#3b82f6",
    featured: true,
    features: [
      "3 hours of dubbing/month",
      "22 languages incl. Indian",
      "Voice cloning",
      "1080p output",
      "Lip sync included",
      "Priority processing",
      "Priority support",
    ],
  },
  {
    id:       "studio",
    name:     "Studio",
    price:    299,
    minutes:  "Unlimited",
    desc:     "For teams and OTT platforms",
    color:    "#7c3aed",
    features: [
      "Unlimited dubbing",
      "All 22 languages",
      "Voice cloning",
      "4K output",
      "Lip sync included",
      "API access",
      "Dedicated support",
      "Custom integrations",
    ],
  },
];

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [error,   setError]   = useState("");

  const handleCheckout = async (planId: string) => {
    setLoading(planId);
    setError("");
    try {
      const res = await fetch("/api/checkout", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ plan: planId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error ?? "Something went wrong");
      }
    } catch {
      setError("Network error — is the server running?");
    } finally {
      setLoading(null);
    }
  };

  return (
    <>
      <Navbar />
      <main style={{ maxWidth: "960px", margin: "0 auto", padding: "60px 20px 80px" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "56px" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            background: "rgba(59,130,246,0.1)",
            border: "0.5px solid rgba(59,130,246,0.3)",
            borderRadius: "999px", padding: "5px 14px",
            marginBottom: "16px",
          }}>
            <Zap size={12} color="#3b82f6" />
            <span style={{
              fontSize: "12px", fontWeight: "600",
              color: "#3b82f6", fontFamily: "var(--font-display)",
            }}>
              Simple, transparent pricing
            </span>
          </div>
          <h1 style={{
            fontSize: "40px", fontWeight: "800",
            letterSpacing: "-0.03em", color: "#e2e8f0", marginBottom: "12px",
          }}>
            Dub your content.<br />Reach the world.
          </h1>
          <p style={{ fontSize: "16px", color: "#64748b", maxWidth: "480px", margin: "0 auto" }}>
            Start free. Upgrade when you need more minutes.
            Cancel anytime.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: "rgba(239,68,68,0.1)",
            border: "0.5px solid rgba(239,68,68,0.3)",
            borderRadius: "10px", padding: "12px 16px",
            marginBottom: "24px", fontSize: "13px",
            color: "#f87171", fontFamily: "var(--font-mono)",
            textAlign: "center",
          }}>
            ⚠ {error}
          </div>
        )}

        {/* Plans grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "16px",
          alignItems: "start",
        }}>
          {PLANS.map(plan => (
            <div key={plan.id} style={{
              background: "#071330",
              border: `${plan.featured ? "2px" : "0.5px"} solid ${plan.featured ? "#3b82f6" : "#1e3a8a"}`,
              borderRadius: "16px",
              padding: "28px 24px",
              position: "relative",
            }}>
              {/* Most popular badge */}
              {plan.featured && (
                <div style={{
                  position: "absolute", top: "-13px",
                  left: "50%", transform: "translateX(-50%)",
                  background: "#3b82f6", color: "#fff",
                  fontSize: "11px", fontWeight: "700",
                  padding: "4px 14px", borderRadius: "999px",
                  fontFamily: "var(--font-display)",
                  whiteSpace: "nowrap",
                }}>
                  Most popular
                </div>
              )}

              {/* Plan name */}
              <div style={{
                fontSize: "13px", fontWeight: "700",
                color: plan.color, marginBottom: "8px",
                textTransform: "uppercase", letterSpacing: "0.07em",
              }}>
                {plan.name}
              </div>

              {/* Price */}
              <div style={{ display: "flex", alignItems: "baseline", gap: "4px", marginBottom: "4px" }}>
                <span style={{ fontSize: "42px", fontWeight: "800", color: "#e2e8f0", letterSpacing: "-0.03em" }}>
                  ${plan.price}
                </span>
                <span style={{ fontSize: "14px", color: "#475569" }}>/month</span>
              </div>

              {/* Minutes pill */}
              <div style={{
                display: "inline-flex", alignItems: "center", gap: "5px",
                background: "#0d1f4a", border: "0.5px solid #1e3a8a",
                borderRadius: "6px", padding: "3px 10px", marginBottom: "14px",
              }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#60a5fa" }}>
                  {plan.minutes}
                </span>
                <span style={{ fontSize: "11px", color: "#475569" }}>/ month</span>
              </div>

              <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "20px" }}>
                {plan.desc}
              </p>

              {/* CTA button */}
              <button
                onClick={() => handleCheckout(plan.id)}
                disabled={loading === plan.id}
                style={{
                  width: "100%",
                  background: plan.featured ? "#3b82f6" : "transparent",
                  color: plan.featured ? "#fff" : "#94a3b8",
                  border: `1px solid ${plan.featured ? "#3b82f6" : "#1e3a8a"}`,
                  borderRadius: "10px", padding: "12px 20px",
                  fontSize: "14px", fontWeight: "700",
                  fontFamily: "var(--font-display)",
                  cursor: loading === plan.id ? "wait" : "pointer",
                  display: "flex", alignItems: "center",
                  justifyContent: "center", gap: "7px",
                  marginBottom: "24px",
                  transition: "all 0.15s",
                }}
                onMouseEnter={e => {
                  if (!plan.featured) {
                    e.currentTarget.style.borderColor = "#3b82f6";
                    e.currentTarget.style.color = "#e2e8f0";
                  } else {
                    e.currentTarget.style.background = "#2563eb";
                  }
                }}
                onMouseLeave={e => {
                  if (!plan.featured) {
                    e.currentTarget.style.borderColor = "#1e3a8a";
                    e.currentTarget.style.color = "#94a3b8";
                  } else {
                    e.currentTarget.style.background = "#3b82f6";
                  }
                }}
              >
                {loading === plan.id
                  ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Redirecting...</>
                  : `Get ${plan.name}`
                }
              </button>

              {/* Divider */}
              <div style={{ height: "0.5px", background: "#0d1f4a", marginBottom: "20px" }} />

              {/* Features */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {plan.features.map(f => (
                  <div key={f} style={{ display: "flex", alignItems: "flex-start", gap: "9px" }}>
                    <div style={{
                      width: "17px", height: "17px", borderRadius: "50%",
                      background: `${plan.color}20`,
                      border: `1px solid ${plan.color}40`,
                      display: "flex", alignItems: "center",
                      justifyContent: "center", flexShrink: 0, marginTop: "1px",
                    }}>
                      <Check size={9} color={plan.color} />
                    </div>
                    <span style={{ fontSize: "13px", color: "#94a3b8", lineHeight: "1.5" }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <p style={{
          textAlign: "center", fontSize: "12px",
          color: "#334155", marginTop: "40px",
          fontFamily: "var(--font-mono)",
        }}>
          All plans include a 7-day free trial · No card required to start ·
          Powered by Stripe
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </main>
    </>
  );
}
