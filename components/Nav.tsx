"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { Wordmark } from "./Brand";

export function ModeBanner() {
  const path = usePathname();
  const [mode, setMode] = useState<"live" | "demo" | "error" | null>(null);
  useEffect(() => {
    if (path === "/login") return;
    fetch("/api/arcade/health")
      .then((r) => r.json().then((j) => (r.ok ? setMode(j.mode) : setMode("error"))))
      .catch(() => setMode("error"));
  }, [path]);
  if (path === "/login") return null;
  if (mode === "demo")
    return (
      <div className="no-print bg-gold-soft/70 px-4 py-1.5 text-center text-xs text-navy">
        Demo mode — add <code className="font-mono">ARCADE_API_KEY</code> to <code className="font-mono">.env.local</code> to go live. Designs and products below are labelled placeholders.
      </div>
    );
  if (mode === "error")
    return (
      <div className="no-print bg-coral-soft px-4 py-1.5 text-center text-xs text-navy">
        Couldn&apos;t reach Arcade — check the API key and connection. <Link href="/health" className="underline">Details</Link>
      </div>
    );
  return null;
}

export function Nav() {
  const path = usePathname();
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((s) => setSignedIn(Boolean(s?.user)))
      .catch(() => {});
  }, [path]);
  const link = (href: string, label: string) => (
    <Link
      href={href}
      className={`whitespace-nowrap rounded-full px-2.5 py-1.5 text-sm transition sm:px-3 ${
        path.startsWith(href) ? "bg-navy text-cream" : "text-navy/70 hover:text-navy"
      }`}
    >
      {label}
    </Link>
  );
  return (
    <header className="no-print sticky top-0 z-30 border-b border-navy/5 bg-cream/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Wordmark small />
        <nav className="flex items-center gap-0.5 sm:gap-1">
          {link("/story", "Siya’s story")}
          {link("/fingerprint", "Fingerprint")}
          {link("/chapters", "Chapters")}
          {signedIn && path !== "/login" && (
            <button onClick={() => signOut({ callbackUrl: "/login" })} className="rounded-full px-3 py-1.5 text-sm text-navy/50 hover:text-navy">
              Sign out
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
