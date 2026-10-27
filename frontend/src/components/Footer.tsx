"use client";

import React from "react";
import Link from "next/link";
import { Code2, ShieldCheck } from "lucide-react";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-800/80 bg-[#05070B] py-8 text-xs text-slate-400">
      <div className="mx-auto max-w-6xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-cyan-400" />
          <span>
            <strong className="text-slate-200">PixelProof</strong> &middot; 7-Layer Digital Image Processing Forensics
          </span>
        </div>

        <div className="flex items-center gap-5">
          <Link href="/demo" className="hover:text-cyan-300 transition">
            Demo Suite
          </Link>
          <Link href="/analyze" className="hover:text-cyan-300 transition">
            Analyze Image
          </Link>
          <Link href="/how-it-works" className="hover:text-cyan-300 transition">
            How It Works
          </Link>
          <a
            href="https://github.com/tanisheesh/PixelProof"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 hover:text-cyan-300 transition"
          >
            <Code2 className="h-3.5 w-3.5" />
            <span>GitHub</span>
          </a>
        </div>

        <div>
          &copy; {year} &middot; Built by{" "}
          <a
            href="https://tanisheesh.in"
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-slate-200 hover:text-cyan-300 transition"
          >
            Tanish Poddar
          </a>
        </div>
      </div>
    </footer>
  );
}
