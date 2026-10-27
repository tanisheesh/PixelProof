import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PixelProof — 7-Layer Digital Image Processing Forensic Engine",
    short_name: "PixelProof",
    description:
      "Multi-layer classical Digital Image Processing (DIP) image forgery and tampering detection engine: ELA, 2D-DWT Wavelet Noise, Block-DCT Copy-Move, 2D-FFT Resampling & Morphological Localization.",
    start_url: "/",
    display: "standalone",
    background_color: "#080808",
    theme_color: "#00E5FF",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
