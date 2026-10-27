"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  const navLinks = [
    { href: "/", code: "01", label: "SPECIFICATION", shortLabel: "SPEC" },
    { href: "/demo", code: "02", label: "BENCHMARK & SANDBOX", shortLabel: "DEMO" },
    { href: "/analyze", code: "03", label: "IMAGE ANALYZER", shortLabel: "ANALYZE" },
    { href: "/how-it-works", code: "04", label: "GUIDE & GLOSSARY", shortLabel: "GUIDE" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-[#080808]/95 backdrop-blur-sm border-b border-[#222220]">
      <div className="max-w-[1400px] mx-auto px-3 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-2">
        {/* Brand with SVG Logo */}
        <Link href="/" className="flex items-center gap-2.5 group min-w-0">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="30"
            height="30"
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
            <span className="hidden xl:inline font-mono text-[10px] text-[#88857e] tracking-widest">
              SYS.REV.1.0 // 7-LAYER DIP FORENSICS
            </span>
          </div>
        </Link>

        {/* Center Navigation (Desktop) */}
        <nav className="hidden md:flex items-center h-full">
          {navLinks.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`h-14 px-3.5 lg:px-5 flex items-center gap-2 font-mono text-[11px] lg:text-xs tracking-wider border-l border-[#222220] last:border-r transition-colors whitespace-nowrap ${
                  active
                    ? "bg-[#151515] text-[#00e5ff] border-b-2 border-b-[#00e5ff]"
                    : "text-[#88857e] hover:text-[#f2efe9] hover:bg-[#0e0e0e]"
                }`}
              >
                <span className="text-[10px] text-[#4a4843]">[{item.code}]</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <a
            href="https://github.com/tanisheesh/PixelProof"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[11px] sm:text-xs text-[#88857e] hover:text-[#f2efe9] px-2.5 sm:px-3 py-1.5 border border-[#222220] hover:border-[#88857e] transition"
          >
            SRC ↗
          </a>
          {pathname !== "/analyze" ? (
            <Link
              href="/analyze"
              className="brutal-btn brutal-btn-primary !py-1.5 !px-3 sm:!py-2 sm:!px-4 !text-[10px] sm:!text-xs"
            >
              ANALYZE IMAGE →
            </Link>
          ) : (
            <Link
              href="/demo"
              className="brutal-btn !py-1.5 !px-3 sm:!py-2 sm:!px-4 !text-[10px] sm:!text-xs !border-[#00e676] !text-[#00e676]"
            >
              DEMO SUITE →
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Navigation Strip (4 Columns, Responsive on all phones) */}
      <nav
        aria-label="Mobile Navigation"
        className="grid grid-cols-4 md:hidden border-t border-[#222220] bg-[#0b0b0b]"
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
