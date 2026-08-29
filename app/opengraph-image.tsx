import { ImageResponse } from "next/og";

// Náhledová kartička při sdílení odkazu (WhatsApp, Messenger, Insta, Discord…).
export const alt = "BRKYS' CRIB — Barber Shop";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
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
          background: "#17191a",
          color: "#f3eee5",
          fontFamily: "Geist",
          position: "relative",
        }}
      >
        {/* jemný rámeček */}
        <div
          style={{
            position: "absolute",
            top: 40,
            left: 40,
            right: 40,
            bottom: 40,
            border: "2px solid #4a4741",
            display: "flex",
          }}
        />
        <div
          style={{
            display: "flex",
            fontSize: 26,
            letterSpacing: 14,
            color: "#c8bfae",
            marginBottom: 30,
          }}
        >
          {"BARBER SHOP"}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 130,
            fontWeight: 600,
            letterSpacing: 2,
          }}
        >
          {"BRKYS’ CRIB"}
        </div>
        <div
          style={{
            display: "flex",
            width: 120,
            height: 2,
            background: "#c8bfae",
            margin: "38px 0",
          }}
        />
        <div
          style={{
            display: "flex",
            fontSize: 30,
            letterSpacing: 2,
            color: "#c8bfae",
          }}
        >
          {"Rezervace online  ·  brkyscrib.cz"}
        </div>
      </div>
    ),
    { ...size },
  );
}
