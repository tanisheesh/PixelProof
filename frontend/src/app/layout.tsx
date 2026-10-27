import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PixelProof — 7-Layer Digital Image Processing Forensic Engine",
  description:
    "Classical Digital Image Processing (DIP) image forgery and tampering detection workbench: Error Level Analysis (ELA), 2D-DWT Wavelet Noise Variance, Block-DCT Copy-Move Clone Detection, 2D-FFT Resampling Spectrum, and Morphological Localization.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#06090F] text-slate-100 antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
        {children}
      </body>
    </html>
  );
}
