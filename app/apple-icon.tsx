import { ImageResponse } from "next/og";

// iOS ikona na plochu (Safari „Přidat na plochu"). iOS si rohy zaobluje sám.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#17191a",
          color: "#f3eee5",
          fontSize: 96,
          fontWeight: 600,
          letterSpacing: -4,
        }}
      >
        BC
      </div>
    ),
    { ...size },
  );
}
