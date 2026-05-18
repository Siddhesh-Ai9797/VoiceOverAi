"use client";

import { useState, useRef, useCallback } from "react";
import Navbar from "@/components/Navbar";
import { Upload, Zap, ChevronRight, Loader2, Check,
         Download, RotateCcw, ImageIcon, Wand2 } from "lucide-react";
import { LANGUAGES } from "@/lib/constants";

const STYLES = [
  { id: "talking_head", icon: "🗣️", title: "Talking Head",
    desc: "Photo speaks your script" },
  { id: "animated",     icon: "✨", title: "Animated",
    desc: "Photo comes alive" },
  { id: "lip_sync",     icon: "🎵", title: "Lip Sync",
    desc: "Natural lip movement" },
];

const DURATIONS = [15, 30, 45, 60];

const PIPELINE_STEPS = [
  { id: "script", label: "Generating script",    tech: "GPT-4o"      },
  { id: "voice",  label: "Synthesizing voice",   tech: "ElevenLabs"  },
  { id: "video",  label: "Generating video",     tech: "D-ID API"    },
];

type View = "create" | "processing" | "complete";

export default function CreatePage() {
  const [view,       setView]       = useState<View>("create");
  const [photo,      setPhoto]      = useState<File | null>(null);
  const [photoUrl,   setPhotoUrl]   = useState<string>("");
  const [prompt,     setPrompt]     = useState("");
  const [language,   setLanguage]   = useState("en");
  const [style,      setStyle]      = useState("talking_head");
  const [duration,   setDuration]   = useState(30);
  const [uploading,  setUploading]  = useState(false);
  const [error,      setError]      = useState("");
  const [jobId,      setJobId]      = useState("");
  const [progress,   setProgress]   = useState(0);
  const [currentStep,setCurrentStep]= useState("queued");
  const [script,     setScript]     = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileRef  = useRef<HTMLInputElement>(null);
  const pollRef  = useRef<NodeJS.Timeout | null>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith("image/")) {
      setPhoto(f);
      setPhotoUrl(URL.createObjectURL(f));
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { setPhoto(f); setPhotoUrl(URL.createObjectURL(f)); }
  };

  const pollStatus = (id: string) => {
    pollRef.current = setInterval(async () => {
      try {
        const res  = await fetch(`/api/create/${id}`);
        const data = await res.json();
        setProgress(data.progress ?? 0);
        setCurrentStep(data.current_step ?? "queued");
        if (data.script) setScript(data.script);
        if (data.status === "complete") {
          clearInterval(pollRef.current!);
          setView("complete");
        }
        if (data.status === "failed") {
          clearInterval(pollRef.current!);
          setError(data.error ?? "Something went wrong");
          setView("create");
          setUploading(false);
        }
      } catch { /* keep polling */ }
    }, 2000);
  };

  const handleCreate = async () => {
    if (!photo || !prompt.trim()) return;
    setUploading(true);
    setError("");

    try {
      const form = new FormData();
      form.append("file",          photo);
      form.append("prompt",        prompt);
      form.append("language_code", language);
      form.append("style",         style);
      form.append("duration",      String(duration));

      const res  = await fetch("/api/create", { method: "POST", body: form });
      const data = await res.json();

      if (!res.ok) { setError(data.error ?? "Failed"); setUploading(false); return; }

      setJobId(data.job_id);
      setView("processing");
      pollStatus(data.job_id);
    } catch {
      setError("Something went wrong. Is the backend running?");
      setUploading(false);
    }
  };

  const handleReset = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    setView("create"); setPhoto(null); setPhotoUrl("");
    setPrompt(""); setProgress(0); setCurrentStep("queued");
    setScript(""); setJobId(""); setError(""); setUploading(false);
  };

  const getStepState = (stepId: string) => {
    const order  = PIPELINE_STEPS.map(s => s.id);
    const curIdx = order.indexOf(currentStep);
    const stepIdx = order.indexOf(stepId);
    if (view === "complete")       return "done";
    if (stepIdx < curIdx)          return "done";
    if (stepIdx === curIdx)        return "active";
    return "pending";
  };

  const selectedLang = [...LANGUAGES, { code: "en", name: "English", script: "English", flag: "🇺🇸" }]
    .find(l => l.code === language);

  return (
    <>
      <Navbar />
      <main style={{ maxWidth: "680px", margin: "0 auto", padding: "40px 20px 80px" }}>

        {/* ── CREATE VIEW ── */}
        {view === "create" && (
          <div style={{ animation: "fade-up 0.3s ease forwards" }}>
            <div style={{ marginBottom: "32px" }}>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: "6px",
                background: "rgba(59,130,246,0.1)",
                border: "0.5px solid rgba(59,130,246,0.3)",
                borderRadius: "999px", padding: "5px 14px", marginBottom: "14px",
              }}>
                <Wand2 size={12} color="#3b82f6" />
                <span style={{ fontSize: "12px", fontWeight: "600",
                               color: "#3b82f6", fontFamily: "var(--font-display)" }}>
                  AI Video Creator
                </span>
              </div>
              <h1 style={{ fontSize: "32px", fontWeight: "800",
                           letterSpacing: "-0.03em", color: "#e2e8f0", marginBottom: "8px" }}>
                Create a video from a photo
              </h1>
              <p style={{ fontSize: "15px", color: "#64748b", lineHeight: "1.6" }}>
                Upload any photo — AI generates a script, synthesizes a voice, and makes it talk.
              </p>
            </div>

            {/* Photo upload */}
            <div style={{ marginBottom: "24px" }}>
              <div style={{ fontSize: "11px", fontWeight: "700", letterSpacing: ".07em",
                            textTransform: "uppercase", color: "#475569", marginBottom: "10px" }}>
                Your photo
              </div>
              {!photo ? (
                <div
                  onClick={() => fileRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  style={{
                    border: `1.5px dashed ${isDragging ? "#3b82f6" : "#1e3a8a"}`,
                    borderRadius: "14px", padding: "40px 24px",
                    textAlign: "center", cursor: "pointer",
                    background: isDragging ? "rgba(59,130,246,0.06)" : "#071330",
                    transition: "all 0.18s",
                  }}
                >
                  <div style={{
                    width: "52px", height: "52px", borderRadius: "12px",
                    background: "rgba(59,130,246,0.1)",
                    border: "0.5px solid rgba(59,130,246,0.25)",
                    display: "flex", alignItems: "center",
                    justifyContent: "center", margin: "0 auto 14px",
                  }}>
                    <ImageIcon size={22} color="#3b82f6" />
                  </div>
                  <div style={{ fontSize: "15px", fontWeight: "700",
                                color: "#e2e8f0", marginBottom: "6px" }}>
                    Drop your photo here
                  </div>
                  <div style={{ fontSize: "13px", color: "#475569", marginBottom: "14px" }}>
                    or click to browse
                  </div>
                  <div style={{ display: "flex", gap: "6px",
                                justifyContent: "center", flexWrap: "wrap" }}>
                    {["JPG", "PNG", "WEBP"].map(f => (
                      <span key={f} style={{
                        fontFamily: "var(--font-mono)", fontSize: "10px",
                        background: "#0d1f4a", color: "#475569",
                        padding: "3px 8px", borderRadius: "5px",
                        border: "0.5px solid #1e3a8a",
                      }}>{f}</span>
                    ))}
                  </div>
                  <input ref={fileRef} type="file" accept="image/*"
                         onChange={handleFileChange} style={{ display: "none" }} />
                </div>
              ) : (
                <div style={{
                  background: "#071330", border: "0.5px solid #1e3a8a",
                  borderRadius: "14px", padding: "14px",
                  display: "flex", alignItems: "center", gap: "14px",
                }}>
                  <img src={photoUrl} alt="preview" style={{
                    width: "70px", height: "70px", borderRadius: "10px",
                    objectFit: "cover", flexShrink: 0,
                    border: "0.5px solid #1e3a8a",
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "13px", fontWeight: "600",
                                  color: "#e2e8f0", marginBottom: "3px",
                                  overflow: "hidden", textOverflow: "ellipsis",
                                  whiteSpace: "nowrap" }}>
                      {photo.name}
                    </div>
                    <div style={{ fontSize: "11px", color: "#475569",
                                  fontFamily: "var(--font-mono)" }}>
                      {(photo.size / 1048576).toFixed(1)} MB
                    </div>
                  </div>
                  <button onClick={() => { setPhoto(null); setPhotoUrl(""); }} style={{
                    background: "transparent", border: "0.5px solid #1e3a8a",
                    borderRadius: "7px", padding: "6px 10px",
                    cursor: "pointer", color: "#475569", fontSize: "12px",
                    fontFamily: "var(--font-display)", transition: "all 0.15s",
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "#ef4444";
                                         e.currentTarget.style.color = "#ef4444"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "#1e3a8a";
                                         e.currentTarget.style.color = "#475569"; }}
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            {/* Prompt */}
            <div style={{ marginBottom: "24px" }}>
              <div style={{ fontSize: "11px", fontWeight: "700", letterSpacing: ".07em",
                            textTransform: "uppercase", color: "#475569", marginBottom: "10px" }}>
                What should they say?
              </div>
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="e.g. Explain how VoiceOverAI works in 30 seconds to potential investors. Be confident and exciting."
                rows={3}
                style={{
                  width: "100%", background: "#071330",
                  border: "0.5px solid #1e3a8a", borderRadius: "10px",
                  padding: "12px 14px", fontSize: "14px",
                  color: "#e2e8f0", outline: "none", resize: "vertical",
                  fontFamily: "var(--font-display)", lineHeight: "1.6",
                  transition: "border-color 0.15s",
                }}
                onFocus={e => e.target.style.borderColor = "#3b82f6"}
                onBlur={e  => e.target.style.borderColor = "#1e3a8a"}
              />
              <div style={{ fontSize: "11px", color: "#334155",
                            marginTop: "5px", fontFamily: "var(--font-mono)" }}>
                Be specific — include tone, audience, and key points
              </div>
            </div>

            {/* Style selector */}
            <div style={{ marginBottom: "24px" }}>
              <div style={{ fontSize: "11px", fontWeight: "700", letterSpacing: ".07em",
                            textTransform: "uppercase", color: "#475569", marginBottom: "10px" }}>
                Video style
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                {STYLES.map(s => {
                  const active = style === s.id;
                  return (
                    <button key={s.id} onClick={() => setStyle(s.id)} style={{
                      background: active ? "rgba(59,130,246,0.1)" : "#071330",
                      border: `1px solid ${active ? "#3b82f6" : "#1e3a8a"}`,
                      borderRadius: "10px", padding: "14px 10px",
                      textAlign: "center", cursor: "pointer", transition: "all 0.14s",
                    }}
                      onMouseEnter={e => { if (!active) e.currentTarget.style.borderColor = "#3b82f6"; }}
                      onMouseLeave={e => { if (!active) e.currentTarget.style.borderColor = "#1e3a8a"; }}
                    >
                      <div style={{ fontSize: "22px", marginBottom: "6px" }}>{s.icon}</div>
                      <div style={{ fontSize: "12px", fontWeight: "600",
                                    color: active ? "#60a5fa" : "#e2e8f0", marginBottom: "3px" }}>
                        {s.title}
                      </div>
                      <div style={{ fontSize: "10px", color: "#475569" }}>{s.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Language + Duration row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr",
                          gap: "16px", marginBottom: "32px" }}>
              {/* Language */}
              <div>
                <div style={{ fontSize: "11px", fontWeight: "700", letterSpacing: ".07em",
                              textTransform: "uppercase", color: "#475569", marginBottom: "10px" }}>
                  Language
                </div>
                <select
                  value={language}
                  onChange={e => setLanguage(e.target.value)}
                  style={{
                    width: "100%", background: "#071330",
                    border: "0.5px solid #1e3a8a", borderRadius: "9px",
                    padding: "10px 12px", fontSize: "13px",
                    color: "#e2e8f0", outline: "none",
                    fontFamily: "var(--font-display)", cursor: "pointer",
                  }}
                >
                  <option value="en">🇺🇸 English</option>
                  {LANGUAGES.map(l => (
                    <option key={l.code} value={l.code}>
                      {l.flag} {l.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Duration */}
              <div>
                <div style={{ fontSize: "11px", fontWeight: "700", letterSpacing: ".07em",
                              textTransform: "uppercase", color: "#475569", marginBottom: "10px" }}>
                  Duration
                </div>
                <div style={{ display: "flex", gap: "6px" }}>
                  {DURATIONS.map(d => {
                    const active = duration === d;
                    return (
                      <button key={d} onClick={() => setDuration(d)} style={{
                        flex: 1, background: active ? "rgba(59,130,246,0.1)" : "#071330",
                        border: `1px solid ${active ? "#3b82f6" : "#1e3a8a"}`,
                        borderRadius: "8px", padding: "10px 4px",
                        fontSize: "12px", fontWeight: "600",
                        color: active ? "#60a5fa" : "#94a3b8",
                        cursor: "pointer", transition: "all 0.14s",
                        fontFamily: "var(--font-display)",
                      }}>
                        {d}s
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                background: "rgba(239,68,68,0.1)",
                border: "0.5px solid rgba(239,68,68,0.3)",
                borderRadius: "10px", padding: "12px 16px",
                marginBottom: "16px", fontSize: "13px",
                color: "#f87171", fontFamily: "var(--font-mono)",
              }}>
                ⚠ {error}
              </div>
            )}

            {/* CTA */}
            <button
              onClick={handleCreate}
              disabled={!photo || !prompt.trim() || uploading}
              style={{
                width: "100%",
                background: photo && prompt.trim() && !uploading ? "#3b82f6" : "#0d1f4a",
                color: photo && prompt.trim() && !uploading ? "#fff" : "#334155",
                border: `1px solid ${photo && prompt.trim() && !uploading ? "#3b82f6" : "#1e3a8a"}`,
                borderRadius: "11px", padding: "14px 20px",
                fontSize: "15px", fontWeight: "700",
                fontFamily: "var(--font-display)",
                cursor: photo && prompt.trim() && !uploading ? "pointer" : "not-allowed",
                display: "flex", alignItems: "center",
                justifyContent: "center", gap: "8px", transition: "all 0.15s",
              }}
              onMouseEnter={e => { if (photo && prompt.trim() && !uploading) e.currentTarget.style.background = "#2563eb"; }}
              onMouseLeave={e => { if (photo && prompt.trim() && !uploading) e.currentTarget.style.background = "#3b82f6"; }}
            >
              {uploading
                ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Uploading...</>
                : !photo
                ? "Upload a photo to continue"
                : !prompt.trim()
                ? "Write a prompt to continue"
                : <><Zap size={16} />Create {duration}s video in {selectedLang?.name ?? "English"}<ChevronRight size={16} /></>
              }
            </button>
            <p style={{ fontSize: "11px", color: "#334155", textAlign: "center",
                        marginTop: "10px", fontFamily: "var(--font-mono)" }}>
              ~1 min processing · powered by GPT-4o + ElevenLabs + D-ID
            </p>
          </div>
        )}

        {/* ── PROCESSING VIEW ── */}
        {view === "processing" && (
          <div style={{ animation: "fade-up 0.35s ease forwards" }}>
            <div style={{ marginBottom: "24px" }}>
              <div style={{ display: "flex", alignItems: "center",
                            gap: "10px", marginBottom: "6px" }}>
                <Loader2 size={18} color="#3b82f6"
                  style={{ animation: "spin 1s linear infinite", flexShrink: 0 }} />
                <h2 style={{ fontSize: "22px", fontWeight: "800",
                             letterSpacing: "-0.03em", color: "#e2e8f0" }}>
                  Creating your video
                </h2>
              </div>
              <p style={{ fontSize: "12px", color: "#475569",
                          fontFamily: "var(--font-mono)", marginLeft: "28px" }}>
                {photo?.name} · {duration}s · {selectedLang?.name}
              </p>
            </div>

            {/* Progress bar */}
            <div style={{ background: "#0d1f4a", borderRadius: "999px",
                          height: "5px", marginBottom: "24px", overflow: "hidden" }}>
              <div style={{
                height: "100%",
                background: "linear-gradient(90deg, #3b82f6, #60a5fa)",
                borderRadius: "999px", width: `${progress}%`,
                transition: "width 0.5s ease",
              }} />
            </div>

            {/* Steps */}
            <div style={{ background: "#071330", border: "0.5px solid #1e3a8a",
                          borderRadius: "14px", overflow: "hidden", marginBottom: "20px" }}>
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
                    opacity: pending ? 0.38 : 1, transition: "opacity 0.3s",
                  }}>
                    <div style={{
                      width: "26px", height: "26px", borderRadius: "7px",
                      flexShrink: 0, display: "flex",
                      alignItems: "center", justifyContent: "center",
                      background: done ? "rgba(16,185,129,0.13)" : active ? "rgba(59,130,246,0.13)" : "#0d1f4a",
                      border: `1px solid ${done ? "rgba(16,185,129,0.3)" : active ? "rgba(59,130,246,0.3)" : "#1e3a8a"}`,
                    }}>
                      {done   && <Check size={13} color="#10b981" />}
                      {active && <div style={{ width: "7px", height: "7px",
                                               borderRadius: "50%", background: "#3b82f6",
                                               animation: "pulse-dot 1.3s ease-in-out infinite" }} />}
                      {pending && <div style={{ width: "5px", height: "5px",
                                               borderRadius: "50%", background: "#1e3a8a" }} />}
                    </div>
                    <div style={{ flex: 1, fontSize: "13px", fontWeight: "600",
                                  color: done ? "#475569" : active ? "#e2e8f0" : "#1e3a8a" }}>
                      {step.label}
                    </div>
                    <span style={{
                      fontFamily: "var(--font-mono)", fontSize: "10px",
                      background: done ? "rgba(16,185,129,0.1)" : active ? "rgba(59,130,246,0.1)" : "#0d1f4a",
                      color: done ? "#10b981" : active ? "#3b82f6" : "#334155",
                      padding: "3px 8px", borderRadius: "4px",
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

            {/* Script preview */}
            {script && (
              <div style={{ background: "#071330", border: "0.5px solid #1e3a8a",
                            borderRadius: "12px", padding: "14px 16px" }}>
                <div style={{ fontSize: "10px", fontWeight: "700", letterSpacing: ".07em",
                              textTransform: "uppercase", color: "#3b82f6", marginBottom: "8px" }}>
                  Generated script
                </div>
                <p style={{ fontSize: "13px", color: "#94a3b8", lineHeight: "1.7",
                            fontStyle: "italic" }}>
                  &ldquo;{script}&rdquo;
                </p>
              </div>
            )}

            <p style={{ fontSize: "11px", color: "#334155", textAlign: "center",
                        marginTop: "16px", fontFamily: "var(--font-mono)" }}>
              D-ID is rendering your video — this takes about 60 seconds
            </p>
          </div>
        )}

        {/* ── COMPLETE VIEW ── */}
        {view === "complete" && (
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
                Your video is ready!
              </h2>
              <p style={{ fontSize: "14px", color: "#64748b" }}>
                {photo?.name} · {duration}s · {selectedLang?.name}
              </p>
            </div>

            {/* Script card */}
            {script && (
              <div style={{ background: "#071330", border: "0.5px solid #1e3a8a",
                            borderRadius: "12px", padding: "16px", marginBottom: "16px" }}>
                <div style={{ fontSize: "10px", fontWeight: "700", letterSpacing: ".07em",
                              textTransform: "uppercase", color: "#3b82f6", marginBottom: "8px" }}>
                  Script used
                </div>
                <p style={{ fontSize: "13px", color: "#94a3b8", lineHeight: "1.7",
                            fontStyle: "italic" }}>
                  &ldquo;{script}&rdquo;
                </p>
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: "flex", gap: "10px", marginBottom: "12px" }}>
              <a
                href={(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000") + "/api/download/create/" + jobId}
                download
                style={{
                  flex: 1, background: "#3b82f6", color: "#fff",
                  border: "none", borderRadius: "11px",
                  padding: "13px 20px", fontSize: "14px",
                  fontWeight: "700", fontFamily: "var(--font-display)",
                  cursor: "pointer", display: "flex",
                  alignItems: "center", justifyContent: "center",
                  gap: "8px", textDecoration: "none",
                }}
              >
                <Download size={15} /> Download MP4
              </a>
              <button onClick={handleReset} style={{
                background: "transparent", color: "#94a3b8",
                border: "0.5px solid #1e3a8a", borderRadius: "11px",
                padding: "13px 20px", fontSize: "14px",
                fontFamily: "var(--font-display)", cursor: "pointer",
                display: "flex", alignItems: "center", gap: "7px",
                transition: "all 0.15s",
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#3b82f6";
                                     e.currentTarget.style.color = "#e2e8f0"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#1e3a8a";
                                     e.currentTarget.style.color = "#94a3b8"; }}
              >
                <RotateCcw size={14} /> Create another
              </button>
            </div>
            <p style={{ fontSize: "11px", color: "#334155", textAlign: "center",
                        fontFamily: "var(--font-mono)" }}>
              Powered by GPT-4o + ElevenLabs + D-ID
            </p>
          </div>
        )}
        <style>{`
          @keyframes spin     { to { transform: rotate(360deg); } }
          @keyframes fade-up  { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
          @keyframes pulse-dot{ 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.8)} }
        `}</style>
      </main>
    </>
  );
}
