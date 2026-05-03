import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Fira_Code } from "next/font/google";
import SessionProvider from "@/components/SessionProvider";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets:  ["latin"],
  weight:   ["400", "500", "600", "700", "800"],
  style:    ["normal", "italic"],
  variable: "--font-display",
  display:  "swap",
});

const firaCode = Fira_Code({
  subsets:  ["latin"],
  weight:   ["400", "500"],
  variable: "--font-mono",
  display:  "swap",
});

export const metadata: Metadata = {
  title:       "VoiceOverAI — AI Video Dubbing",
  description: "AI-powered video dubbing into any language — voice cloning, lip sync, and more.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${plusJakartaSans.variable} ${firaCode.variable}`}>
      <body style={{ fontFamily: "var(--font-display)" }}>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
