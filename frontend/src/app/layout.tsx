import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "PixelProof — Digital Image Processing Forensics",
  description:
    "Multi-layer Digital Image Processing (DIP) forgery and tampering detection engine: Error Level Analysis (ELA), 2D-DWT Wavelet Noise Variance, Block-DCT Copy-Move Clone Detection, 2D-FFT Resampling Spectrum, and Morphological Localization.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen flex flex-col bg-[#06090F] text-slate-100 antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
        <Navbar />
        <main className="flex-1 pt-24 pb-16">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
