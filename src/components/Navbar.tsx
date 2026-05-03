"use client";

import Link from "next/link";
import { useState } from "react";
import { Film, Clock, Menu, X } from "lucide-react";
import { useSession } from "next-auth/react";

export default function Navbar() {
  const [menuOpen, setMenuOpen]   = useState(false);
  const { data: session, status } = useSession();

  return (
    <nav style={{
      position: "sticky", top: 0, zIndex: 50,
      borderBottom: "0.5px solid #1e3a8a",
      backgroundColor: "rgba(4,13,33,0.92)",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
    }}>
      <div style={{
        maxWidth: "1120px", margin: "0 auto",
        padding: "0 24px", height: "60px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>

        {/* Logo */}
        <Link href="/" style={{
          display: "flex", alignItems: "center",
          gap: "10px", textDecoration: "none",
        }}>
          <div style={{
            width: "32px", height: "32px", background: "#3b82f6",
            borderRadius: "8px", display: "flex",
            alignItems: "center", justifyContent: "center", flexShrink: 0,
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

        {/* Desktop nav */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}
             className="desktop-nav">
          <NavLink href="/dashboard">Dashboard</NavLink>
          <NavLink href="/pricing">Pricing</NavLink>

          {/* Credits pill */}
          <div style={{
            display: "flex", alignItems: "center", gap: "6px",
            background: "#071330", border: "0.5px solid #1e3a8a",
            borderRadius: "8px", padding: "5px 12px", marginLeft: "6px",
          }}>
            <Clock size={13} color="#3b82f6" />
            <span style={{ fontFamily: "var(--font-mono)",
                           fontSize: "12px", color: "#94a3b8" }}>3h 12m</span>
            <span style={{ fontSize: "12px", color: "#475569" }}>left</span>
          </div>

          {/* Auth button */}
          {status === "loading" ? null : session ? (
            <Link href="/dashboard" style={{
              marginLeft: "6px", background: "#0d1f4a",
              color: "#93c5fd", border: "0.5px solid #1e3a8a",
              borderRadius: "8px", padding: "7px 14px",
              fontSize: "13px", fontWeight: "600",
              fontFamily: "var(--font-display)", textDecoration: "none",
              display: "inline-flex", alignItems: "center", gap: "6px",
            }}>
              <div style={{
                width: "20px", height: "20px", borderRadius: "50%",
                background: "#1e3a8a", display: "flex",
                alignItems: "center", justifyContent: "center",
                fontSize: "10px", fontWeight: "700", color: "#93c5fd",
              }}>
                {session.user?.name?.charAt(0).toUpperCase()}
              </div>
              {session.user?.name?.split(" ")[0]}
            </Link>
          ) : (
            <Link href="/signin" style={{
              marginLeft: "6px", background: "#3b82f6",
              color: "#fff", border: "none",
              borderRadius: "8px", padding: "7px 16px",
              fontSize: "13px", fontWeight: "700",
              fontFamily: "var(--font-display)", textDecoration: "none",
              display: "inline-flex", alignItems: "center", cursor: "pointer",
              transition: "background 0.15s",
            }}
              onMouseEnter={e => e.currentTarget.style.background = "#2563eb"}
              onMouseLeave={e => e.currentTarget.style.background = "#3b82f6"}
            >
              Sign in
            </Link>
          )}
        </div>

        {/* Mobile hamburger */}
        <button onClick={() => setMenuOpen(!menuOpen)} style={{
          display: "none", background: "transparent",
          border: "0.5px solid #1e3a8a", borderRadius: "7px",
          padding: "6px", cursor: "pointer", color: "#94a3b8",
        }} className="mobile-menu-btn" aria-label="Toggle menu">
          {menuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{
          borderTop: "0.5px solid #1e3a8a", background: "#040d21",
          padding: "12px 24px 20px", display: "flex",
          flexDirection: "column", gap: "4px",
        }}>
          <MobileLink href="/dashboard" onClick={() => setMenuOpen(false)}>Dashboard</MobileLink>
          <MobileLink href="/pricing"   onClick={() => setMenuOpen(false)}>Pricing</MobileLink>
          <MobileLink href={session ? "/dashboard" : "/signin"}
                      onClick={() => setMenuOpen(false)}>
            {session ? "My account" : "Sign in"}
          </MobileLink>
        </div>
      )}

      <style>{`
        @media (max-width: 640px) {
          .desktop-nav     { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </nav>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} style={{
      fontFamily: "var(--font-display)", fontSize: "13px",
      fontWeight: "500", color: "#94a3b8", textDecoration: "none",
      padding: "6px 12px", borderRadius: "7px", transition: "all 0.15s",
    }}
      onMouseEnter={e => { e.currentTarget.style.color = "#e2e8f0";
                           e.currentTarget.style.background = "#0d1f4a"; }}
      onMouseLeave={e => { e.currentTarget.style.color = "#94a3b8";
                           e.currentTarget.style.background = "transparent"; }}
    >
      {children}
    </Link>
  );
}

function MobileLink({ href, children, onClick }: {
  href: string; children: React.ReactNode; onClick: () => void;
}) {
  return (
    <Link href={href} onClick={onClick} style={{
      fontFamily: "var(--font-display)", fontSize: "15px",
      fontWeight: "500", color: "#94a3b8", textDecoration: "none",
      padding: "10px 12px", borderRadius: "8px", transition: "all 0.15s",
    }}
      onMouseEnter={e => { e.currentTarget.style.color = "#e2e8f0";
                           e.currentTarget.style.background = "#0d1f4a"; }}
      onMouseLeave={e => { e.currentTarget.style.color = "#94a3b8";
                           e.currentTarget.style.background = "transparent"; }}
    >
      {children}
    </Link>
  );
}
