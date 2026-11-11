"use client";

import React from "react";
import Link from "next/link";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

const TECHNIQUES = [
  {
    num: "01",
    title: "COPY-MOVE (CLONE STAMP) DETECTION",
    tag: "FEATURE KEYPOINT MATCHING & BLOCK COMPARISON",
    summary:
      "Detects when a part of the image (like an object, grass, or wall) is copied and pasted elsewhere inside the same photo to hide or duplicate something.",
    howItWorks:
      "The algorithm extracts keypoint descriptors (ORB / Harris corners) across the whole image. It compares every feature against other distant regions. When two distinct areas share identical feature vectors, cyan link lines are drawn connecting the original source (green) to the cloned destination (red).",
    whatTeacherSees:
      "Green and Red squares connected by cyan lines pointing from the real object to the fake cloned duplicate.",
  },
  {
    num: "02",
    title: "SPLICING BOUNDARY SEAM DETECTION",
    tag: "SOBEL & LAPLACIAN SPATIAL GRADIENTS (1ST & 2ND DERIVATIVES)",
    summary:
      "Detects foreign objects cut from another photo and pasted into the background.",
    howItWorks:
      "Natural photos have smooth, continuous optical transitions between objects and background. When a foreign object is pasted in, the boundary seam has an unnaturally sharp, artificial step-edge. Sobel (1st-order) and Laplacian (2nd-order) spatial gradient filters expose this sharp derivative spike along the seam.",
    whatTeacherSees:
      "A bright glowing red outline along the exact border where the foreign object was pasted.",
  },
  {
    num: "03",
    title: "NOISE & BLUR / AIRBRUSH ANALYSIS",
    tag: "LOCAL VARIANCE & ADAPTIVE WIENER RESIDUAL",
    summary:
      "Detects areas where someone used Gaussian blur, an airbrush, or a healing tool to erase blemishes or remove objects.",
    howItWorks:
      "Every digital camera sensor leaves an invisible, uniform grain (noise) across the entire photo. When someone runs a blur or healing brush, that natural camera grain is wiped clean. By computing local noise variance and Adaptive Wiener filter residuals across sliding blocks, blurred areas show up as dark noise cavities.",
    whatTeacherSees:
      "A dark, low-variance cavity in the noise heatmap where the smoothing tool erased the natural grain.",
  },
  {
    num: "04",
    title: "ERROR LEVEL ANALYSIS (ELA DIFFERENCING)",
    tag: "JPEG RE-COMPRESSION ERROR LEVEL MAPPING",
    summary:
      "Detects foreign patches that were saved with a different compression history than the background.",
    howItWorks:
      "The image is re-encoded at a standard JPEG quality level (Q=90) and subtracted from the original. Regions that were recently added or saved under a different compression level produce a significantly higher subtraction residual than the rest of the image.",
    whatTeacherSees:
      "The spliced foreign patch glows bright in the ELA difference heatmap.",
  },
  {
    num: "05",
    title: "AUTOMATED BOUNDING BOX LOCALIZATION",
    tag: "OTSU ADAPTIVE THRESHOLDING & MORPHOLOGICAL OPENING/CLOSING",
    summary:
      "Combines the detection heatmaps into a solid binary mask and automatically draws red bounding boxes around the fake areas.",
    howItWorks:
      "The anomaly heatmaps are fused and thresholded using Otsu's optimum variance algorithm. Morphological Opening (erosion then dilation) removes stray noise dots, and Morphological Closing bridges small gaps. 8-connected component labeling then extracts the exact coordinates [x, y, width, height] of the tampered region.",
    whatTeacherSees:
      "Clean red bounding box labeled [R1] around the exact manipulated area.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      <Navbar />

      <main className="flex-1 max-w-[1400px] w-full mx-auto px-3 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <section className="border-x border-b border-[#222220] bg-[#0e0e0e] p-5 sm:p-8 lg:p-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="min-w-0">
            <div className="font-mono text-[10px] sm:text-[11px] uppercase tracking-widest text-[#00e5ff] mb-2">
              {"// [03] FORENSIC DETECTION TECHNIQUES EXPLAINED"}
            </div>
            <h1 className="font-display font-black text-3xl sm:text-5xl uppercase tracking-tight text-[#f2efe9]">
              HOW PIXELPROOF DETECTS IMAGE FORGERIES
            </h1>
            <p className="text-xs sm:text-base text-[#88857e] mt-2 max-w-3xl leading-relaxed">
              A simple, direct explanation of the core classical Digital Image Processing techniques
              used to unmask Splicing, Copy-Move Cloning, and Retouching without any black-box machine
              learning.
            </p>
          </div>

          <Link href="/" className="brutal-btn brutal-btn-primary shrink-0">
            LAUNCH FORGERY DETECTOR →
          </Link>
        </section>

        {/* 5 Core Techniques Cards */}
        <section className="border-x border-b border-[#222220] divide-y divide-[#222220]">
          {TECHNIQUES.map((tech) => (
            <div
              key={tech.num}
              className="p-5 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start bg-[#080808] hover:bg-[#0b0b0b] transition-colors"
            >
              <div className="lg:col-span-2 flex lg:flex-col items-baseline lg:items-start justify-between gap-2">
                <span className="font-display font-black text-5xl sm:text-6xl text-[#00e5ff] leading-none">
                  M{tech.num}
                </span>
                <span className="border border-[#00e5ff] bg-[#00e5ff]/10 px-2 py-0.5 font-mono text-[10px] font-bold text-[#00e5ff]">
                  METHOD
                </span>
              </div>

              <div className="lg:col-span-10 space-y-3 min-w-0">
                <div className="font-mono text-[11px] text-[#00e5ff] uppercase tracking-wider font-bold">
                  {tech.tag}
                </div>
                <h2 className="font-display font-black text-2xl sm:text-3xl uppercase text-[#f2efe9]">
                  {tech.title}
                </h2>

                <div className="border-l-4 border-l-[#00e5ff] border border-[#222220] bg-[#111111] p-3 text-xs sm:text-sm text-[#f2efe9] leading-relaxed">
                  <strong>WHAT IT DOES:</strong> {tech.summary}
                </div>

                <div className="border border-[#222220] bg-[#0e0e0e] p-3 text-xs text-[#88857e] leading-relaxed font-sans">
                  <strong className="text-[#00e676] font-mono block mb-1 uppercase">
                    HOW THE ALGORITHM WORKS:
                  </strong>
                  {tech.howItWorks}
                </div>

                <div className="border border-[#222220] bg-[#080808] p-2.5 font-mono text-[11px] text-[#f2efe9]">
                  <span className="text-[#ffb300] font-bold">WHAT TO EXPLAIN TO TEACHER: </span>
                  {tech.whatTeacherSees}
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* Bottom CTA */}
        <section className="border-x border-b border-[#222220] bg-[#0e0e0e] p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="font-mono text-xs text-[#88857e]">
            Ready to test these techniques on real image forgeries?
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/" className="brutal-btn brutal-btn-primary">
              TRY FORGERY DETECTOR →
            </Link>
            <Link href="/sandbox" className="brutal-btn">
              OPEN LIVE SANDBOX →
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
