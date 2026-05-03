"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { CheckCircle, ArrowRight } from "lucide-react";

const PLAN_NAMES: Record<string, string> = {
  starter: "Starter",
  pro:     "Pro",
  studio:  "Studio",
};

const PLAN_MINUTES: Record<string, string> = {
  starter: "30 minutes",
  pro:     "3 hours",
  studio:  "Unlimited",
};

function SuccessContent() {
  const params = useSearchParams();
  const plan   = params.get("plan") ?? "pro";

  return (
    <main style={{
      maxWidth: "520px", margin: "0 auto",
      padding: "80px 20px", textAlign: "center",
    }}>
      <div style={{
        width: "72px", height: "72px", borderRadius: "50%",
        background: "rgba(16,185,129,0.13)",
        border: "1px solid rgba(16,185,129,0.3)",
        display: "flex", alignItems: "center",
        justifyContent: "center", margin: "0 auto 24px",
      }}>
        <CheckCircle size={36} color="#10b981" />
      </div>

      <h1 style={{
        fontSize: "32px", fontWeight: "800",
        letterSpacing: "-0.03em", color: "#e2e8f0", marginBottom: "12px",
      }}>
        You&apos;re all set!
      </h1>

      <p style={{ fontSize: "15px", color: "#64748b", marginBottom: "8px" }}>
        Welcome to VoiceOverAI{" "}
        <span style={{ color: "#60a5fa", fontWeight: "700" }}>
          {PLAN_NAMES[plan]}
        </span>
      </p>

      <p style={{ fontSize: "14px", color: "#475569", marginBottom: "40px" }}>
        You now have{" "}
        <span style={{ color: "#e2e8f0", fontWeight: "600" }}>
          {PLAN_MINUTES[plan]}
        </span>{" "}
        of AI dubbing per month.
      </p>

      {/* Feature list */}
      <div style={{
        background: "#071330", border: "0.5px solid #1e3a8a",
        borderRadius: "14px", padding: "20px", marginBottom: "32px",
        textAlign: "left",
      }}>
        {[
          "Upload any video up to 2GB",
          "Dub into 22 languages",
          "Voice cloning included",
          "Download as MP4",
          "Cancel anytime",
        ].map(f => (
          <div key={f} style={{
            display: "flex", alignItems: "center", gap: "10px",
            padding: "8px 0",
            borderBottom: "0.5px solid #0d1f4a",
          }}>
            <div style={{
              width: "18px", height: "18px", borderRadius: "50%",
              background: "rgba(16,185,129,0.15)",
              border: "1px solid rgba(16,185,129,0.3)",
              display: "flex", alignItems: "center",
              justifyContent: "center", flexShrink: 0,
            }}>
              <span style={{ fontSize: "9px", color: "#10b981" }}>✓</span>
            </div>
            <span style={{ fontSize: "13px", color: "#94a3b8" }}>{f}</span>
          </div>
        ))}
      </div>

      <Link href="/" style={{
        background: "#3b82f6", color: "#fff",
        borderRadius: "11px", padding: "14px 28px",
        fontSize: "15px", fontWeight: "700",
        fontFamily: "var(--font-display)",
        textDecoration: "none",
        display: "inline-flex", alignItems: "center", gap: "8px",
      }}>
        Start dubbing now <ArrowRight size={16} />
      </Link>
    </main>
  );
}

export default function SuccessPage() {
  return (
    <>
      <Navbar />
      <Suspense fallback={<div />}>
        <SuccessContent />
      </Suspense>
    </>
  );
}
