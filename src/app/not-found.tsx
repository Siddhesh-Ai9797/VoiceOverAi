import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main style={{ maxWidth: "480px", margin: "0 auto",
                     padding: "80px 20px", textAlign: "center" }}>
        <div style={{ fontSize: "72px", fontWeight: "800", color: "#1e3a8a",
                      letterSpacing: "-0.03em", marginBottom: "8px" }}>404</div>
        <h1 style={{ fontSize: "22px", fontWeight: "700",
                     color: "#e2e8f0", marginBottom: "10px" }}>
          Page not found
        </h1>
        <p style={{ fontSize: "14px", color: "#64748b", marginBottom: "32px" }}>
          This page doesn&apos;t exist yet.
        </p>
        <Link href="/" style={{
          background: "#3b82f6", color: "#fff", borderRadius: "10px",
          padding: "12px 24px", fontSize: "14px", fontWeight: "700",
          fontFamily: "var(--font-display)", textDecoration: "none",
        }}>
          Go home
        </Link>
      </main>
    </>
  );
}
