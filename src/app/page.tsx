"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import DropZone from "@/components/DropZone";
import LanguagePicker from "@/components/LanguagePicker";
import PipelineStatus from "@/components/PipelineStatus";
import { Mic, Globe, Zap, ChevronRight, Check, Loader2 } from "lucide-react";
import { startDubbingJob } from "@/lib/api";
import { LANGUAGE_MAP } from "@/lib/constants";

type View = "upload" | "processing";

export default function Home() {
  const [view,       setView]       = useState<View>("upload");
  const [file,       setFile]       = useState<File | null>(null);
  const [language,   setLanguage]   = useState("hi");
  const [voiceMode,  setVoiceMode]  = useState<"clone" | "standard">("clone");
  const [jobId,      setJobId]      = useState<string>("");
  const [uploading,  setUploading]  = useState(false);
  const [uploadErr,  setUploadErr]  = useState("");

  const handleStart = async () => {
    if (!file) return;
    setUploading(true);
    setUploadErr("");
    try {
      const id = await startDubbingJob(file, language, voiceMode);
      setJobId(id);
      setView("processing");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e: unknown) {
      setUploadErr(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setLanguage("hi");
    setVoiceMode("clone");
    setJobId("");
    setUploadErr("");
    setView("upload");
  };

  return (
    <>
      <Navbar />
      <main style={{ maxWidth: "680px", margin: "0 auto", padding: "40px 20px 80px" }}>

        {/* ── UPLOAD VIEW ── */}
        {view === "upload" && (
          <div style={{ animation: "fade-up 0.3s ease forwards" }}>
            <div style={{ marginBottom: "32px" }}>
              <h1 style={{ fontSize: "32px", fontWeight: "800",
                           letterSpacing: "-0.03em", color: "#e2e8f0", marginBottom: "8px" }}>
                Dub your video
              </h1>
              <p style={{ fontSize: "15px", color: "#64748b", lineHeight: "1.6" }}>
                Upload a video — we&apos;ll transcribe, translate and lip-sync it in any language.
              </p>
            </div>

            <div style={{ marginBottom: "28px" }}>
              <DropZone file={file} onFileSelect={setFile} onFileClear={() => setFile(null)} />
            </div>

            <div style={{ marginBottom: "28px" }}>
              <LanguagePicker selected={language} onSelect={setLanguage} />
            </div>

            {/* Voice mode */}
            <div style={{ marginBottom: "32px" }}>
              <div style={{ fontSize: "11px", fontWeight: "700", letterSpacing: "0.07em",
                            textTransform: "uppercase", color: "#475569", marginBottom: "10px" }}>
                Voice mode
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                {([
                  { id: "clone",    Icon: Mic,   title: "Clone speaker",  desc: "Matches original voice" },
                  { id: "standard", Icon: Globe, title: "Standard voice", desc: "Generic TTS voice"      },
                ] as const).map(({ id, Icon, title, desc }) => {
                  const active = voiceMode === id;
                  return (
                    <button key={id} onClick={() => setVoiceMode(id)} style={{
                      background: active ? "rgba(59,130,246,0.09)" : "#071330",
                      border: `1px solid ${active ? "#3b82f6" : "#1e3a8a"}`,
                      borderRadius: "10px", padding: "14px", textAlign: "left",
                      cursor: "pointer", display: "flex", alignItems: "flex-start",
                      gap: "10px", transition: "all 0.14s",
                    }}
                      onMouseEnter={e => { if (!active) e.currentTarget.style.borderColor = "#3b82f6"; }}
                      onMouseLeave={e => { if (!active) e.currentTarget.style.borderColor = "#1e3a8a"; }}
                    >
                      <Icon size={15} color={active ? "#3b82f6" : "#475569"}
                            style={{ marginTop: "2px", flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "13px", fontWeight: "600",
                                      color: "#e2e8f0", marginBottom: "3px" }}>{title}</div>
                        <div style={{ fontSize: "11px", color: "#475569" }}>{desc}</div>
                      </div>
                      {active && (
                        <div style={{ width: "16px", height: "16px", borderRadius: "50%",
                                      background: "#3b82f6", display: "flex",
                                      alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <Check size={10} color="#fff" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Error */}
            {uploadErr && (
              <div style={{
                background: "rgba(239,68,68,0.1)", border: "0.5px solid rgba(239,68,68,0.3)",
                borderRadius: "10px", padding: "12px 16px", marginBottom: "16px",
                fontSize: "13px", color: "#f87171", fontFamily: "var(--font-mono)",
              }}>
                ⚠ {uploadErr}
              </div>
            )}

            {/* CTA */}
            <button onClick={handleStart} disabled={!file || uploading} style={{
              width: "100%",
              background: file && !uploading ? "#3b82f6" : "#0d1f4a",
              color: file && !uploading ? "#fff" : "#334155",
              border: `1px solid ${file && !uploading ? "#3b82f6" : "#1e3a8a"}`,
              borderRadius: "11px", padding: "14px 20px", fontSize: "15px",
              fontWeight: "700", fontFamily: "var(--font-display)",
              cursor: file && !uploading ? "pointer" : "not-allowed",
              display: "flex", alignItems: "center", justifyContent: "center",
              gap: "8px", transition: "all 0.15s",
            }}
              onMouseEnter={e => { if (file && !uploading) e.currentTarget.style.background = "#2563eb"; }}
              onMouseLeave={e => { if (file && !uploading) e.currentTarget.style.background = "#3b82f6"; }}
            >
              {uploading
                ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Uploading...</>
                : file
                ? <><Zap size={16} />Start dubbing into {LANGUAGE_MAP[language]}<ChevronRight size={16} /></>
                : "Select a video to continue"
              }
            </button>

            <p style={{ fontSize: "11px", color: "#334155", textAlign: "center",
                        marginTop: "10px", fontFamily: "var(--font-mono)" }}>
              ~2 min processing · uses ~15 min of your credit
            </p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* ── PROCESSING VIEW ── */}
        {view === "processing" && jobId && (
          <PipelineStatus
            jobId={jobId}
            fileName={file?.name ?? "video.mp4"}
            targetLanguage={LANGUAGE_MAP[language]}
            voiceMode={voiceMode}
            onReset={handleReset}
          />
        )}
      </main>
    </>
  );
}
