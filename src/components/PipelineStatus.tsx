"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, Download, RotateCcw, AlertCircle } from "lucide-react";
import { pollJobUntilDone, getDownloadUrl, type JobStatus } from "@/lib/api";
import { PIPELINE_STEPS, STEP_ORDER } from "@/lib/constants";

interface PipelineStatusProps {
  jobId:          string;
  fileName:       string;
  targetLanguage: string;
  voiceMode:      string;
  onReset:        () => void;
}

export default function PipelineStatus({
  jobId,
  fileName,
  targetLanguage,
  voiceMode,
  onReset,
}: PipelineStatusProps) {
  const [status,     setStatus]     = useState<JobStatus | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [isFailed,   setIsFailed]   = useState(false);
  const [errorMsg,   setErrorMsg]   = useState("");

  useEffect(() => {
    pollJobUntilDone(jobId, (s) => setStatus(s))
      .then(() => { setIsComplete(true); })
      .catch((e)  => { setIsFailed(true); setErrorMsg(e.message); });
  }, [jobId]);

  const progress    = status?.progress    ?? 0;
  const currentStep = status?.current_step ?? "queued";

  const getStepState = (stepId: string) => {
    const currentIdx = STEP_ORDER.indexOf(currentStep as typeof STEP_ORDER[number]);
    const stepIdx    = STEP_ORDER.indexOf(stepId as typeof STEP_ORDER[number]);
    if (isComplete)                  return "done";
    if (stepIdx < currentIdx)        return "done";
    if (stepIdx === currentIdx)      return "active";
    return "pending";
  };

  /* ── Error screen ── */
  if (isFailed) {
    return (
      <div style={{ textAlign: "center", animation: "fade-up 0.35s ease forwards" }}>
        <div style={{
          width: "64px", height: "64px", borderRadius: "50%",
          background: "rgba(239,68,68,0.13)",
          border: "1px solid rgba(239,68,68,0.3)",
          display: "flex", alignItems: "center",
          justifyContent: "center", margin: "0 auto 18px",
        }}>
          <AlertCircle size={30} color="#ef4444" />
        </div>
        <h2 style={{ fontSize: "22px", fontWeight: "800", color: "#e2e8f0", marginBottom: "8px" }}>
          Something went wrong
        </h2>
        <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "24px",
                    fontFamily: "var(--font-mono)", maxWidth: "420px", margin: "0 auto 24px" }}>
          {errorMsg || "Pipeline failed — check your API keys in .env.local"}
        </p>
        <button onClick={onReset} style={{
          background: "#3b82f6", color: "#fff", border: "none",
          borderRadius: "11px", padding: "12px 28px",
          fontSize: "14px", fontWeight: "700",
          fontFamily: "var(--font-display)", cursor: "pointer",
          display: "inline-flex", alignItems: "center", gap: "8px",
        }}>
          <RotateCcw size={14} /> Try again
        </button>
      </div>
    );
  }

  /* ── Complete screen ── */
  if (isComplete) {
    return (
      <div style={{ animation: "fade-up 0.35s ease forwards" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{
            width: "64px", height: "64px", borderRadius: "50%",
            background: "rgba(16,185,129,0.13)",
            border: "1px solid rgba(16,185,129,0.3)",
            display: "flex", alignItems: "center",
            justifyContent: "center", margin: "0 auto 18px",
          }}>
            <Check size={30} color="#10b981" />
          </div>
          <h2 style={{ fontSize: "26px", fontWeight: "800",
                       letterSpacing: "-0.03em", color: "#e2e8f0", marginBottom: "8px" }}>
            Your dubbed video is ready
          </h2>
          <p style={{ fontSize: "14px", color: "#64748b" }}>
            {fileName} · dubbed into{" "}
            <span style={{ color: "#60a5fa", fontWeight: "600" }}>
              {targetLanguage}
            </span>{" "}
            · {voiceMode === "clone" ? "Voice cloned" : "Standard voice"}
          </p>
        </div>

        {/* Video preview card */}
        <div style={{
          background: "#071330", border: "0.5px solid #1e3a8a",
          borderRadius: "14px", overflow: "hidden", marginBottom: "16px",
        }}>
          <div style={{
            background: "#040d21", height: "180px",
            display: "flex", alignItems: "center",
            justifyContent: "center", position: "relative",
          }}>
            <div style={{
              width: "52px", height: "52px", borderRadius: "50%",
              background: "rgba(59,130,246,0.9)",
              display: "flex", alignItems: "center",
              justifyContent: "center", cursor: "pointer", fontSize: "20px",
            }}>▶</div>
            <div style={{
              position: "absolute", bottom: "10px", left: "14px", right: "14px",
              background: "rgba(0,0,0,0.6)", borderRadius: "6px",
              padding: "6px 10px", display: "flex", alignItems: "center", gap: "8px",
            }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "#94a3b8" }}>00:00</span>
              <div style={{ flex: 1, height: "3px", background: "#1e3a8a", borderRadius: "2px" }} />
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "#94a3b8" }}>--:--</span>
            </div>
          </div>
          <div style={{
            padding: "12px 16px", display: "flex",
            alignItems: "center", justifyContent: "space-between",
            borderTop: "0.5px solid #1e3a8a",
          }}>
            <div>
              <div style={{ fontSize: "13px", fontWeight: "600", color: "#e2e8f0" }}>
                {fileName.replace(/\.[^/.]+$/, "")}_dubbed.mp4
              </div>
              <div style={{ fontSize: "11px", color: "#475569", marginTop: "2px",
                            fontFamily: "var(--font-mono)" }}>
                dubbed into {targetLanguage}
              </div>
            </div>
            <div style={{ display: "flex", gap: "6px" }}>
              {["MP4", "SRT"].map(f => (
                <span key={f} style={{
                  fontFamily: "var(--font-mono)", fontSize: "10px",
                  background: "#0d1f4a", color: "#475569",
                  padding: "3px 7px", borderRadius: "4px",
                  border: "0.5px solid #1e3a8a",
                }}>{f}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "12px" }}>
          <a href={getDownloadUrl(jobId)} download style={{ flex: 1, background: "#3b82f6", color: "#fff", border: "none", borderRadius: "11px", padding: "13px 20px", fontSize: "14px", fontWeight: "700", fontFamily: "var(--font-display)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", textDecoration: "none" }}>
            <Download size={15} /> Download MP4
          </a>
          <button onClick={onReset} style={{
            background: "transparent", color: "#94a3b8",
            border: "0.5px solid #1e3a8a", borderRadius: "11px",
            padding: "13px 20px", fontSize: "14px",
            fontFamily: "var(--font-display)", cursor: "pointer",
            display: "flex", alignItems: "center", gap: "7px",
            transition: "all 0.15s",
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#3b82f6"; e.currentTarget.style.color = "#e2e8f0"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#1e3a8a"; e.currentTarget.style.color = "#94a3b8"; }}
          >
            <RotateCcw size={14} /> Dub another
          </button>
        </div>
        <p style={{ fontSize: "11px", color: "#334155", textAlign: "center",
                    fontFamily: "var(--font-mono)" }}>
          Download link expires in 24h ·{" "}
          <span style={{ color: "#3b82f6", cursor: "pointer" }}>upgrade to keep forever</span>
        </p>
      </div>
    );
  }

  /* ── Processing screen ── */
  return (
    <div style={{ animation: "fade-up 0.35s ease forwards" }}>
      <div style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
          <Loader2 size={18} color="#3b82f6"
            style={{ animation: "spin 1s linear infinite", flexShrink: 0 }} />
          <h2 style={{ fontSize: "22px", fontWeight: "800",
                       letterSpacing: "-0.03em", color: "#e2e8f0" }}>
            Dubbing into{" "}
            <span style={{ color: "#60a5fa" }}>{targetLanguage}</span>
          </h2>
        </div>
        <p style={{ fontSize: "12px", color: "#475569",
                    fontFamily: "var(--font-mono)", marginLeft: "28px" }}>
          {fileName}
        </p>
      </div>

      {/* Progress bar */}
      <div style={{
        background: "#0d1f4a", borderRadius: "999px",
        height: "5px", marginBottom: "24px", overflow: "hidden",
      }}>
        <div style={{
          height: "100%",
          background: "linear-gradient(90deg, #3b82f6, #60a5fa)",
          borderRadius: "999px", width: `${progress}%`,
          transition: "width 0.5s ease",
        }} />
      </div>

      {/* Steps */}
      <div style={{
        background: "#071330", border: "0.5px solid #1e3a8a",
        borderRadius: "14px", overflow: "hidden",
      }}>
        {PIPELINE_STEPS.map((step, i) => {
          const state   = getStepState(step.id);
          const done    = state === "done";
          const active  = state === "active";
          const pending = state === "pending";

          return (
            <div key={step.id} style={{
              display: "flex", alignItems: "center", gap: "13px",
              padding: "13px 18px",
              borderBottom: i < PIPELINE_STEPS.length - 1 ? "0.5px solid #0d1f4a" : "none",
              opacity: pending ? 0.38 : 1,
              transition: "opacity 0.3s ease",
            }}>
              <div style={{
                width: "26px", height: "26px", borderRadius: "7px",
                flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                background: done ? "rgba(16,185,129,0.13)" : active ? "rgba(59,130,246,0.13)" : "#0d1f4a",
                border: `1px solid ${done ? "rgba(16,185,129,0.3)" : active ? "rgba(59,130,246,0.3)" : "#1e3a8a"}`,
              }}>
                {done   && <Check size={13} color="#10b981" />}
                {active && <div style={{ width: "7px", height: "7px", borderRadius: "50%",
                                         background: "#3b82f6", animation: "pulse-dot 1.3s ease-in-out infinite" }} />}
                {pending && <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#1e3a8a" }} />}
              </div>

              <div style={{ flex: 1 }}>
                <span style={{
                  fontSize: "13px", fontWeight: "600",
                  color: done ? "#475569" : active ? "#e2e8f0" : "#1e3a8a",
                  transition: "color 0.3s",
                }}>
                  {step.label}
                </span>
              </div>

              <span style={{
                fontFamily: "var(--font-mono)", fontSize: "10px",
                background: done ? "rgba(16,185,129,0.1)" : active ? "rgba(59,130,246,0.1)" : "#0d1f4a",
                color: done ? "#10b981" : active ? "#3b82f6" : "#334155",
                padding: "3px 8px", borderRadius: "4px",
                border: `0.5px solid ${done ? "rgba(16,185,129,0.2)" : active ? "rgba(59,130,246,0.2)" : "#1e3a8a"}`,
              }}>
                {step.tech}
              </span>

              <span style={{
                fontFamily: "var(--font-mono)", fontSize: "11px",
                color: done ? "#10b981" : active ? "#60a5fa" : "#1e3a8a",
                width: "32px", textAlign: "right",
              }}>
                {done ? "✓" : active ? `${progress}%` : "···"}
              </span>
            </div>
          );
        })}
      </div>

      <p style={{ fontSize: "11px", color: "#334155", textAlign: "center",
                  marginTop: "16px", fontFamily: "var(--font-mono)" }}>
        You can close this tab — we&apos;ll email you when it&apos;s done
      </p>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
