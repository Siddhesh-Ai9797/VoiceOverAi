export const LANGUAGES = [
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
] as const;

export const LANGUAGE_MAP = Object.fromEntries(
  LANGUAGES.map(l => [l.code, l.name])
) as Record<string, string>;

export const PIPELINE_STEPS = [
  { id: "upload",     label: "Uploading to S3",        tech: "AWS S3"         },
  { id: "extract",    label: "Extracting audio track", tech: "FFmpeg"         },
  { id: "transcribe", label: "Transcribing speech",    tech: "Whisper v3"     },
  { id: "translate",  label: "Translating content",    tech: "DeepL API"      },
  { id: "voice",      label: "Cloning voice",          tech: "ElevenLabs"     },
  { id: "lipsync",    label: "Syncing lip movements",  tech: "LatentSync GPU" },
  { id: "compose",    label: "Composing final video",  tech: "FFmpeg"         },
] as const;

export const STEP_ORDER = PIPELINE_STEPS.map(s => s.id);
