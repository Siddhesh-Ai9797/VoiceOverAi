"use client";

interface Language {
  code: string;
  name: string;
  script: string;
  flag: string;
}

const LANGUAGES: Language[] = [
  { code: "hi", name: "Hindi",    script: "हिंदी",    flag: "🇮🇳" },
  { code: "ta", name: "Tamil",    script: "தமிழ்",    flag: "🇮🇳" },
  { code: "te", name: "Telugu",   script: "తెలుగు",   flag: "🇮🇳" },
  { code: "bn", name: "Bengali",  script: "বাংলা",    flag: "🇮🇳" },
  { code: "mr", name: "Marathi",  script: "मराठी",    flag: "🇮🇳" },
  { code: "es", name: "Spanish",  script: "Español",  flag: "🇪🇸" },
  { code: "fr", name: "French",   script: "Français", flag: "🇫🇷" },
  { code: "de", name: "German",   script: "Deutsch",  flag: "🇩🇪" },
  { code: "ja", name: "Japanese", script: "日本語",   flag: "🇯🇵" },
  { code: "zh", name: "Mandarin", script: "普通话",   flag: "🇨🇳" },
  { code: "ko", name: "Korean",   script: "한국어",   flag: "🇰🇷" },
  { code: "ar", name: "Arabic",   script: "عربي",     flag: "🇸🇦" },
];

interface LanguagePickerProps {
  selected: string;
  onSelect: (code: string) => void;
}

export default function LanguagePicker({ selected, onSelect }: LanguagePickerProps) {
  return (
    <div>
      <div style={{
        fontSize: "11px",
        fontWeight: "700",
        letterSpacing: "0.07em",
        textTransform: "uppercase",
        color: "#475569",
        marginBottom: "10px",
        fontFamily: "var(--font-display)",
      }}>
        Target language
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))",
        gap: "7px",
      }}>
        {LANGUAGES.map(lang => {
          const isSelected = selected === lang.code;
          return (
            <button
              key={lang.code}
              onClick={() => onSelect(lang.code)}
              style={{
                background: isSelected ? "rgba(59,130,246,0.12)" : "#071330",
                border: `1px solid ${isSelected ? "#3b82f6" : "#1e3a8a"}`,
                borderRadius: "10px",
                padding: "10px 7px",
                textAlign: "center",
                cursor: "pointer",
                transition: "all 0.14s ease",
              }}
              onMouseEnter={e => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = "#3b82f6";
                  e.currentTarget.style.background = "rgba(59,130,246,0.06)";
                }
              }}
              onMouseLeave={e => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = "#1e3a8a";
                  e.currentTarget.style.background = "#071330";
                }
              }}
            >
              <div style={{ fontSize: "18px", marginBottom: "4px" }}>
                {lang.flag}
              </div>
              <div style={{
                fontSize: "12px",
                fontWeight: "500",
                color: "#94a3b8",
                marginBottom: "2px",
                fontFamily: "var(--font-display)",
                lineHeight: "1.2",
              }}>
                {lang.script}
              </div>
              <div style={{
                fontSize: "10px",
                fontWeight: "600",
                color: isSelected ? "#3b82f6" : "#475569",
                fontFamily: "var(--font-display)",
              }}>
                {lang.name}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
