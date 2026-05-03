"use client";

import { useRef, useState, useCallback } from "react";
import { Upload, Play, X, FileVideo } from "lucide-react";

interface DropZoneProps {
  file: File | null;
  onFileSelect: (file: File) => void;
  onFileClear: () => void;
}

export default function DropZone({ file, onFileSelect, onFileClear }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped && dropped.type.startsWith("video/")) {
      onFileSelect(dropped);
    }
  }, [onFileSelect]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) onFileSelect(selected);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  /* ── File selected state ── */
  if (file) {
    return (
      <div style={{
        background: "#071330",
        border: "0.5px solid #1e3a8a",
        borderRadius: "14px",
        padding: "16px",
        display: "flex",
        alignItems: "center",
        gap: "14px",
        animation: "fade-up 0.25s ease forwards",
      }}>
        {/* Thumbnail placeholder */}
        <div style={{
          width: "80px",
          height: "52px",
          background: "#0d1f4a",
          borderRadius: "8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          position: "relative",
          border: "0.5px solid #1e3a8a",
        }}>
          <Play size={18} color="#3b82f6" fill="#3b82f6" />
        </div>

        {/* File info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: "13px",
            fontWeight: "600",
            color: "#e2e8f0",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}>
            {file.name}
          </div>
          <div style={{
            fontSize: "12px",
            color: "#475569",
            marginTop: "3px",
            fontFamily: "var(--font-mono)",
          }}>
            {formatSize(file.size)} · {file.type.split("/")[1].toUpperCase()}
          </div>
        </div>

        {/* Clear button */}
        <button
          onClick={onFileClear}
          style={{
            width: "30px",
            height: "30px",
            borderRadius: "7px",
            background: "transparent",
            border: "0.5px solid #1e3a8a",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "#475569",
            flexShrink: 0,
            transition: "all 0.15s",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = "#ef4444";
            e.currentTarget.style.color = "#ef4444";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = "#1e3a8a";
            e.currentTarget.style.color = "#475569";
          }}
          aria-label="Remove file"
        >
          <X size={13} />
        </button>
      </div>
    );
  }

  /* ── Empty drop zone ── */
  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      style={{
        border: `1.5px dashed ${isDragging ? "#3b82f6" : "#1e3a8a"}`,
        borderRadius: "14px",
        padding: "48px 24px",
        textAlign: "center",
        cursor: "pointer",
        background: isDragging ? "rgba(59,130,246,0.06)" : "#071330",
        transform: isDragging ? "scale(1.01)" : "scale(1)",
        transition: "all 0.18s ease",
      }}
    >
      {/* Icon */}
      <div style={{
        width: "54px",
        height: "54px",
        borderRadius: "13px",
        background: "rgba(59,130,246,0.1)",
        border: "0.5px solid rgba(59,130,246,0.25)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        margin: "0 auto 16px",
      }}>
        {isDragging
          ? <FileVideo size={24} color="#3b82f6" />
          : <Upload size={24} color="#3b82f6" />
        }
      </div>

      <div style={{
        fontSize: "15px",
        fontWeight: "700",
        color: "#e2e8f0",
        marginBottom: "6px",
      }}>
        {isDragging ? "Drop it here!" : "Drop your video here"}
      </div>

      <div style={{
        fontSize: "13px",
        color: "#475569",
        marginBottom: "16px",
      }}>
        or click to browse files
      </div>

      {/* Format badges */}
      <div style={{
        display: "flex",
        gap: "6px",
        justifyContent: "center",
        flexWrap: "wrap",
      }}>
        {["MP4", "MOV", "AVI", "MKV", "WEBM"].map(fmt => (
          <span key={fmt} style={{
            fontFamily: "var(--font-mono)",
            fontSize: "10px",
            background: "#0d1f4a",
            color: "#475569",
            padding: "3px 8px",
            borderRadius: "5px",
            border: "0.5px solid #1e3a8a",
          }}>
            {fmt}
          </span>
        ))}
        <span style={{
          fontSize: "11px",
          color: "#334155",
          padding: "3px 6px",
        }}>
          · up to 2 GB
        </span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        onChange={handleChange}
        style={{ display: "none" }}
      />
    </div>
  );
}
