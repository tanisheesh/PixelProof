"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Scan, Upload } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/demo", label: "Interactive Demo" },
    { href: "/how-it-works", label: "How It Works" },
  ];

  return (
    <nav
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${
        scrolled
          ? "shadow-[0_12px_40px_rgba(0,0,0,0.7)] border-slate-700/80"
          : "border-slate-800/80"
      } rounded-full border bg-[#070A10]/90 backdrop-blur-xl px-4 py-2`}
    >
      <div className="flex items-center gap-4 sm:gap-6">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan-500/15 border border-cyan-400/40 group-hover:border-cyan-300 transition">
            <Scan className="h-3.5 w-3.5 text-cyan-400" />
          </div>
          <span className="font-mono text-sm font-extrabold tracking-widest text-white">
            PIXEL<span className="text-cyan-400">PROOF</span>
          </span>
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center gap-1 sm:gap-2">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  isActive
                    ? "bg-slate-800 text-cyan-300 font-semibold"
                    : "text-slate-400 hover:text-slate-100"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Primary CTA -> User Workspace */}
        <Link
          href="/analyze"
          className="flex items-center gap-1.5 rounded-full bg-cyan-400 px-4 py-1.5 text-xs font-bold text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.35)] hover:bg-cyan-300 hover:scale-105 transition"
        >
          <Upload className="h-3.5 w-3.5" />
          <span>Analyze Image</span>
        </Link>
      </div>
    </nav>
  );
}
