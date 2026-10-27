import React from "react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-[#222220] bg-[#080808] text-[#88857e] mt-12 sm:mt-20">
      <div className="max-w-[1400px] mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6 font-mono text-xs">
        <div className="space-y-1 min-w-0">
          <div className="text-[#f2efe9] font-bold tracking-wider text-[11px] sm:text-xs">
            PIXELPROOF // 7-LAYER CLASSICAL DIGITAL IMAGE PROCESSING FORENSICS
          </div>
          <div className="text-[10px] sm:text-[11px] text-[#88857e] leading-relaxed">
            Built by{" "}
            <a
              href="https://tanisheesh.in"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#f2efe9] hover:text-[#00e5ff] underline underline-offset-2"
            >
              Tanish Poddar
            </a>{" "}
            · YCbCr ELA · 2D-DWT Wavelet Noise · 16×16 Block-DCT + ORB · 2D-FFT Spectrum · Otsu Morphology
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[10px] sm:text-[11px] uppercase tracking-wider">
          <Link href="/" className="hover:text-[#00e5ff] transition">
            [01] Spec
          </Link>
          <Link href="/demo" className="hover:text-[#00e5ff] transition">
            [02] Demo &amp; Sandbox
          </Link>
          <Link href="/analyze" className="hover:text-[#00e5ff] transition">
            [03] Image Analyzer
          </Link>
          <Link href="/how-it-works" className="hover:text-[#00e5ff] transition">
            [04] Guide &amp; Glossary
          </Link>
          <a
            href="https://github.com/tanisheesh/PixelProof"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#f2efe9] hover:text-[#00e5ff] transition"
          >
            GitHub ↗
          </a>
        </div>
      </div>
    </footer>
  );
}
