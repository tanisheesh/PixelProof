import { ImageResponse } from "next/og";

export const alt =
  "PixelProof — Multi-Layer Digital Image Processing (DIP) Forgery & Tampering Detection Engine";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#080808",
          padding: "56px 64px",
          border: "12px solid #222220",
          color: "#F2EFE9",
          fontFamily: "sans-serif",
        }}
      >
        {/* Top Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            borderBottom: "2px solid #222220",
            paddingBottom: "24px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                background: "#00E5FF",
                color: "#080808",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 900,
                fontSize: "24px",
              }}
            >
              PP
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "28px", fontWeight: 900, letterSpacing: "0.04em" }}>
                PIXELPROOF
              </span>
              <span style={{ fontSize: "13px", color: "#88857E", letterSpacing: "0.14em" }}>
                SYS.REV.1.0 // 7-LAYER CLASSICAL DIP FORENSICS // ZERO BLACK-BOX ML
              </span>
            </div>
          </div>

          <div
            style={{
              padding: "8px 18px",
              border: "2px solid #00E676",
              color: "#00E676",
              fontSize: "15px",
              fontWeight: 700,
              letterSpacing: "0.1em",
            }}
          >
            pixelproof.tanisheesh.in
          </div>
        </div>

        {/* Center Headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div
            style={{
              fontSize: "16px",
              color: "#00E5FF",
              fontWeight: 700,
              letterSpacing: "0.2em",
            }}
          >
            SIGNAL &amp; FREQUENCY-DOMAIN IMAGE FORENSICS
          </div>
          <div
            style={{
              fontSize: "72px",
              fontWeight: 900,
              lineHeight: 0.95,
              letterSpacing: "-0.03em",
              color: "#F2EFE9",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <span>EVERY TAMPERED PIXEL</span>
            <span style={{ color: "#00E5FF" }}>LEAVES A MATHEMATICAL TRACE.</span>
          </div>
          <div
            style={{
              fontSize: "22px",
              color: "#88857E",
              maxWidth: "960px",
              lineHeight: 1.4,
            }}
          >
            7 Classical DIP Pipelines: YCbCr Error Level Analysis, 2D-DWT Wavelet Noise Variance, Block-DCT + ORB Copy-Move Cloning, 2D-FFT Resampling Spectrum &amp; Otsu Morphological Localization.
          </div>
        </div>

        {/* Bottom KPI Strip */}
        <div
          style={{
            display: "flex",
            width: "100%",
            borderTop: "2px solid #222220",
            paddingTop: "24px",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "34px", fontWeight: 900, color: "#00E5FF" }}>7 LAYERS</span>
            <span style={{ fontSize: "12px", color: "#88857E", letterSpacing: "0.1em" }}>
              DCT · DWT · 2D-FFT · WIENER · SCHARR
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "34px", fontWeight: 900, color: "#00E676" }}>100%</span>
            <span style={{ fontSize: "12px", color: "#88857E", letterSpacing: "0.1em" }}>
              EXPLAINABLE MATH (ZERO ML)
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "34px", fontWeight: 900, color: "#F2EFE9" }}>&lt; 1.2s</span>
            <span style={{ fontSize: "12px", color: "#88857E", letterSpacing: "0.1em" }}>
              CPU EXECUTION LATENCY
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <span style={{ fontSize: "19px", fontWeight: 800, color: "#F2EFE9" }}>
              TANISH PODDAR
            </span>
            <span style={{ fontSize: "13px", color: "#88857E" }}>
              tanisheesh.in · @tanisheesh
            </span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
