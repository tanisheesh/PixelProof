import type { Metadata, Viewport } from "next";
import "./globals.css";

const SITE_URL = "https://pixelproof.tanisheesh.in";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#080808",
  colorScheme: "dark",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "PixelProof — 7-Layer Digital Image Processing Forgery & Tampering Detection",
    template: "%s | PixelProof",
  },
  description:
    "Multi-layer classical Digital Image Processing (DIP) image forensics workbench. Detects splicing, copy-move cloning, resampling, and retouching via YCbCr ELA, 2D-DWT Wavelet Noise Variance, Block-DCT + ORB, 2D-FFT Spectrum & Otsu Morphology.",
  applicationName: "PixelProof",
  authors: [{ name: "Tanish Poddar", url: "https://tanisheesh.in" }],
  creator: "Tanish Poddar",
  publisher: "Tanish Poddar",
  keywords: [
    "PixelProof",
    "Image Forgery Detection",
    "Image Tampering Detection",
    "Digital Image Processing",
    "Error Level Analysis",
    "ELA",
    "Discrete Wavelet Transform",
    "Copy-Move Forgery Detection",
    "2D-DCT",
    "2D-FFT Resampling Detection",
    "Double JPEG Compression",
    "Morphological Image Processing",
    "Image Forensics",
    "Tanish Poddar",
  ],
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "PixelProof",
    title: "PixelProof — 7-Layer Digital Image Processing Forgery & Tampering Detection",
    description:
      "Every tampered pixel leaves a mathematical trace. 7 classical DIP pipelines (YCbCr ELA, 2D-DWT Wavelet Noise, Block-DCT Copy-Move, 2D-FFT Resampling, 8x8 Grid Phase, Scharr Chromatic Edges & DQT Fingerprinting) — zero black-box ML.",
  },
  twitter: {
    card: "summary_large_image",
    title: "PixelProof — 7-Layer Digital Image Processing Forgery & Tampering Detection",
    description:
      "Classical Digital Image Processing image forensics workbench: ELA, 2D-DWT Wavelet Noise Variance, Block-DCT Copy-Move, 2D-FFT Resampling & Otsu Morphological Localization.",
    creator: "@tanisheeshh",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: ["/icon.svg"],
    apple: [{ url: "/apple-icon", sizes: "180x180", type: "image/png" }],
  },
  category: "technology",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "PixelProof",
  operatingSystem: "Web, Linux, Windows, macOS, Docker",
  applicationCategory: "SecurityApplication",
  url: SITE_URL,
  author: {
    "@type": "Person",
    name: "Tanish Poddar",
    url: "https://tanisheesh.in",
  },
  description:
    "Multi-layer classical Digital Image Processing (DIP) image forgery and tampering detection engine.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen overflow-x-hidden antialiased selection:bg-[#00e5ff] selection:text-black">
        {children}
      </body>
    </html>
  );
}
