import { ImageResponse } from "next/og";

// Ikona admin appky — invertovaná paleta (světlé pozadí, tmavé BC),
// ať ji barber na ploše nezamění s klientským webem.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AdminAppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f3eee5",
          color: "#17191a",
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
