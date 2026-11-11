"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  const navLinks = [
    { href: "/", code: "01", label: "FORGERY DETECTOR", shortLabel: "DETECTOR" },
    { href: "/sandbox", code: "02", label: "LIVE TAMPER SANDBOX", shortLabel: "SANDBOX" },
    { href: "/how-it-works", code: "03", label: "HOW IT WORKS", shortLabel: "TECHNIQUES" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-[#080808]/95 backdrop-blur-sm border-b border-[#222220]">
      <div className="max-w-[1400px] mx-auto px-3 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-2">
        {/* Brand with Logo */}
        <Link href="/" className="flex items-center gap-2.5 group min-w-0">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
            viewBox="0 0 64 64"
            fill="none"
            className="shrink-0 transition-transform group-hover:scale-105"
            aria-label="PixelProof Logo"
          >
            <rect width="64" height="64" fill="#080808" />
            <rect x="3" y="3" width="58" height="58" stroke="#00E5FF" strokeWidth="4" />
            <rect x="12" y="12" width="16" height="16" fill="#00E5FF" />
            <rect
              x="36"
              y="12"
              width="16"
              height="16"
              stroke="#F2EFE9"
              strokeWidth="3"
              fill="#111111"
            />
            <rect
              x="12"
              y="36"
              width="16"
              height="16"
              stroke="#F2EFE9"
              strokeWidth="3"
              fill="#111111"
            />
            <rect x="36" y="36" width="16" height="16" fill="#FF2A2A" />
            <line x1="32" y1="8" x2="32" y2="56" stroke="#222220" strokeWidth="2" />
            <line x1="8" y1="32" x2="56" y2="32" stroke="#222220" strokeWidth="2" />
          </svg>
          <div className="flex items-baseline gap-2 truncate">
            <span className="font-display font-black text-xl sm:text-2xl tracking-tight text-[#f2efe9]">
              PIXEL<span className="text-[#00e5ff]">PROOF</span>
            </span>
            <span className="hidden lg:inline font-mono text-[10px] text-[#88857e] tracking-widest">
              IMAGE FORGERY &amp; TAMPERING DETECTOR
            </span>
          </div>
        </Link>

        {/* Center Navigation */}
        <nav className="hidden md:flex items-center h-full">
          {navLinks.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`h-14 px-4 lg:px-6 flex items-center gap-2 font-mono text-[11px] lg:text-xs tracking-wider border-l border-[#222220] last:border-r transition-colors whitespace-nowrap ${
                  active
                    ? "bg-[#151515] text-[#00e5ff] border-b-2 border-b-[#00e5ff] font-bold"
                    : "text-[#88857e] hover:text-[#f2efe9] hover:bg-[#0e0e0e]"
                }`}
              >
                <span className="text-[10px] text-[#4a4843]">[{item.code}]</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right CTA */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/sandbox"
            className="brutal-btn !py-1.5 !px-3 sm:!py-2 sm:!px-4 !text-[10px] sm:!text-xs !border-[#00e5ff] !text-[#00e5ff]"
          >
            TRY SANDBOX →
          </Link>
        </div>
      </div>

      {/* Mobile Navigation Strip */}
      <nav
        aria-label="Mobile Navigation"
        className="grid grid-cols-3 md:hidden border-t border-[#222220] bg-[#0b0b0b]"
      >
        {navLinks.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`py-2.5 px-1 text-center font-mono text-[10px] tracking-wider border-r border-[#222220] last:border-r-0 truncate ${
                active
                  ? "text-[#00e5ff] bg-[#151515] font-bold border-b-2 border-b-[#00e5ff]"
                  : "text-[#88857e]"
              }`}
            >
              <span className="hidden xs:inline">[{item.code}] </span>
              {item.shortLabel}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
