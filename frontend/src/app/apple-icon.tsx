import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#080808",
          border: "8px solid #00E5FF",
          color: "#F2EFE9",
          fontFamily: "monospace",
          fontWeight: 900,
          fontSize: 76,
          letterSpacing: "-0.05em",
        }}
      >
        PP
      </div>
    ),
    { ...size }
  );
}
