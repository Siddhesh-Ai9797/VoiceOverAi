"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { Film, Clock, Download, Plus, LogOut, CheckCircle,
         Loader2, XCircle } from "lucide-react";
import type { User, Job } from "@/lib/db";

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; bg: string; border: string; label: string }> = {
    complete:    { color: "#10b981", bg: "rgba(16,185,129,0.1)",  border: "rgba(16,185,129,0.25)", label: "Done"       },
    failed:      { color: "#ef4444", bg: "rgba(239,68,68,0.1)",   border: "rgba(239,68,68,0.25)",  label: "Failed"     },
    queued:      { color: "#60a5fa", bg: "rgba(59,130,246,0.1)",  border: "rgba(59,130,246,0.25)", label: "Queued"     },
    transcribing:{ color: "#f59e0b", bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.25)", label: "Processing" },
    translating: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.25)", label: "Processing" },
    cloning:     { color: "#f59e0b", bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.25)", label: "Processing" },
  };
  const s = map[status] ?? map.queued;
  const Icon = status === "complete"
    ? CheckCircle : status === "failed"
    ? XCircle : Loader2;

  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: "5px",
      background: s.bg, border: `0.5px solid ${s.border}`,
      borderRadius: "999px", padding: "3px 9px",
    }}>
      <Icon size={10} color={s.color}
        style={status !== "complete" && status !== "failed"
          ? { animation: "spin 1s linear infinite" } : {}} />
      <span style={{ fontSize: "11px", fontWeight: "600", color: s.color }}>
        {s.label}
      </span>
    </div>
  );
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function minutesBar(left: number, total = 180) {
  return Math.round((left / total) * 100);
}

export default function DashboardClient({
  user, jobs,
}: {
  user: User;
  jobs: Job[];
}) {
  const totalMinutes = user.plan === "studio"
    ? 9999 : user.plan === "pro" ? 180 : 30;

  return (
    <>
      {/* Navbar */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        borderBottom: "0.5px solid #1e3a8a",
        backgroundColor: "rgba(4,13,33,0.92)",
        backdropFilter: "blur(12px)",
      }}>
        <div style={{
          maxWidth: "1120px", margin: "0 auto",
          padding: "0 24px", height: "60px",
          display: "flex", alignItems: "center",
          justifyContent: "space-between",
        }}>
          <Link href="/" style={{
            display: "flex", alignItems: "center",
            gap: "10px", textDecoration: "none",
          }}>
            <div style={{
              width: "32px", height: "32px", background: "#3b82f6",
              borderRadius: "8px", display: "flex",
              alignItems: "center", justifyContent: "center",
            }}>
              <Film size={17} color="#fff" />
            </div>
            <span style={{
              fontFamily: "var(--font-display)", fontSize: "20px",
              fontWeight: "800", color: "#e2e8f0", letterSpacing: "-0.03em",
            }}>
              VoiceOverAI
            </span>
          </Link>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {/* Credits pill */}
            <div style={{
              background: "#071330", border: "0.5px solid #1e3a8a",
              borderRadius: "8px", padding: "5px 12px",
              display: "flex", alignItems: "center", gap: "6px",
            }}>
              <Clock size={13} color="#3b82f6" />
              <span style={{ fontFamily: "var(--font-mono)",
                             fontSize: "12px", color: "#94a3b8" }}>
                {user.minutes_left}m
              </span>
              <span style={{ fontSize: "12px", color: "#475569" }}>left</span>
            </div>

            {/* User avatar */}
            <div style={{
              width: "32px", height: "32px", borderRadius: "50%",
              background: "#1e3a8a", border: "1px solid #3b82f6",
              display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: "13px",
              fontWeight: "700", color: "#93c5fd",
            }}>
              {user.name?.charAt(0).toUpperCase()}
            </div>

            {/* Sign out */}
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              style={{
                background: "transparent", border: "0.5px solid #1e3a8a",
                borderRadius: "8px", padding: "6px 10px",
                cursor: "pointer", color: "#475569",
                display: "flex", alignItems: "center", gap: "5px",
                fontSize: "12px", fontFamily: "var(--font-display)",
                transition: "all 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "#ef4444";
                                   e.currentTarget.style.color = "#ef4444"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "#1e3a8a";
                                   e.currentTarget.style.color = "#475569"; }}
            >
              <LogOut size={13} /> Sign out
            </button>
          </div>
        </div>
      </nav>

      <main style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 20px 80px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center",
                      justifyContent: "space-between", marginBottom: "28px",
                      flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: "800",
                         letterSpacing: "-0.03em", color: "#e2e8f0", marginBottom: "4px" }}>
              Welcome back, {user.name?.split(" ")[0]} 👋
            </h1>
            <p style={{ fontSize: "14px", color: "#64748b" }}>
              {jobs.length} dub{jobs.length !== 1 ? "s" : ""} total
            </p>
          </div>
          <Link href="/" style={{
            background: "#3b82f6", color: "#fff",
            borderRadius: "10px", padding: "10px 18px",
            fontSize: "13px", fontWeight: "700",
            fontFamily: "var(--font-display)",
            textDecoration: "none",
            display: "inline-flex", alignItems: "center", gap: "7px",
            transition: "background 0.15s",
          }}>
            <Plus size={14} /> New dub
          </Link>
        </div>

        {/* Credits card */}
        <div style={{
          background: "#071330", border: "0.5px solid #1e3a8a",
          borderRadius: "14px", padding: "18px 22px", marginBottom: "24px",
        }}>
          <div style={{ display: "flex", alignItems: "center",
                        justifyContent: "space-between", marginBottom: "12px",
                        flexWrap: "wrap", gap: "8px" }}>
            <div>
              <span style={{ fontSize: "13px", fontWeight: "600",
                             color: "#e2e8f0", textTransform: "capitalize" }}>
                {user.plan} plan
              </span>
              <span style={{ fontSize: "12px", color: "#475569", marginLeft: "8px" }}>
                · {user.minutes_left} min remaining
              </span>
            </div>
            <Link href="/pricing" style={{
              fontSize: "12px", fontWeight: "600",
              color: "#3b82f6", textDecoration: "none",
            }}>
              Upgrade →
            </Link>
          </div>
          {/* Progress bar */}
          <div style={{ background: "#0d1f4a", borderRadius: "999px",
                        height: "6px", overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: "999px",
              background: "linear-gradient(90deg, #3b82f6, #60a5fa)",
              width: `${minutesBar(user.minutes_left, totalMinutes)}%`,
              transition: "width 0.5s ease",
            }} />
          </div>
        </div>

        {/* Jobs table */}
        {jobs.length === 0 ? (
          <div style={{
            background: "#071330", border: "0.5px solid #1e3a8a",
            borderRadius: "14px", padding: "60px 24px", textAlign: "center",
          }}>
            <div style={{
              width: "52px", height: "52px", borderRadius: "12px",
              background: "#0d1f4a", border: "0.5px solid #1e3a8a",
              display: "flex", alignItems: "center",
              justifyContent: "center", margin: "0 auto 16px",
            }}>
              <Film size={22} color="#1e3a8a" />
            </div>
            <div style={{ fontSize: "15px", fontWeight: "600",
                          color: "#334155", marginBottom: "8px" }}>
              No dubs yet
            </div>
            <p style={{ fontSize: "13px", color: "#334155", marginBottom: "20px" }}>
              Upload your first video to get started
            </p>
            <Link href="/" style={{
              background: "#3b82f6", color: "#fff",
              borderRadius: "9px", padding: "10px 20px",
              fontSize: "13px", fontWeight: "700",
              fontFamily: "var(--font-display)",
              textDecoration: "none",
              display: "inline-flex", alignItems: "center", gap: "7px",
            }}>
              <Plus size={13} /> Dub your first video
            </Link>
          </div>
        ) : (
          <div style={{
            background: "#071330", border: "0.5px solid #1e3a8a",
            borderRadius: "14px", overflow: "hidden",
          }}>
            {/* Header row */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 110px 110px 110px",
              padding: "11px 18px",
              borderBottom: "0.5px solid #0d1f4a",
            }}>
              {["File", "Language", "Status", "Date"].map(h => (
                <div key={h} style={{
                  fontSize: "10px", fontWeight: "700",
                  letterSpacing: "0.07em", textTransform: "uppercase",
                  color: "#334155",
                }}>{h}</div>
              ))}
            </div>

            {/* Job rows */}
            {jobs.map((job, i) => (
              <div key={job.id} style={{
                display: "grid",
                gridTemplateColumns: "1fr 110px 110px 110px",
                padding: "14px 18px", alignItems: "center",
                borderBottom: i < jobs.length - 1
                  ? "0.5px solid #0d1f4a" : "none",
                transition: "background 0.15s",
              }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(59,130,246,0.04)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                {/* File */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{
                    width: "32px", height: "32px", borderRadius: "7px",
                    background: "#0d1f4a", border: "0.5px solid #1e3a8a",
                    display: "flex", alignItems: "center",
                    justifyContent: "center", flexShrink: 0,
                  }}>
                    <Film size={13} color="#3b82f6" />
                  </div>
                  <span style={{
                    fontSize: "13px", fontWeight: "500", color: "#e2e8f0",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {job.file_name}
                  </span>
                </div>

                {/* Language */}
                <span style={{ fontSize: "13px", color: "#94a3b8" }}>
                  {job.target_language}
                </span>

                {/* Status */}
                <StatusBadge status={job.status} />

                {/* Date + download */}
                <div style={{ display: "flex", alignItems: "center",
                              justifyContent: "space-between" }}>
                  <span style={{ fontSize: "11px", color: "#475569",
                                 fontFamily: "var(--font-mono)" }}>
                    {formatDate(job.created_at)}
                  </span>
                  {job.status === "complete" && job.output_url && (
                    <a
                      href={"http://localhost:8000" + job.output_url}
                      download
                      style={{
                        background: "transparent",
                        border: "0.5px solid #1e3a8a",
                        borderRadius: "6px", padding: "4px 8px",
                        cursor: "pointer", color: "#475569",
                        display: "flex", alignItems: "center",
                        gap: "4px", fontSize: "11px",
                        textDecoration: "none", transition: "all 0.15s",
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = "#3b82f6";
                                           e.currentTarget.style.color = "#3b82f6"; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = "#1e3a8a";
                                           e.currentTarget.style.color = "#475569"; }}
                    >
                      <Download size={11} /> MP4
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
