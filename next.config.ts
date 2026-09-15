import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Kdyby někdo sdílel pracovní odkaz z Vercelu (*.vercel.app) místo čisté
  // domény, přesměrujeme návštěvníka na brkyscrib.cz (se zachováním cesty).
  // /api/* schválně vynecháme, ať se nerozbijí crony a volání API, která Vercel
  // míří přímo na deploy URL. 307 (permanent:false) = nekešuje se, jde vzít zpět.
  async redirects() {
    return [
      {
        source: "/:path((?!api/).*)",
        has: [{ type: "host", value: ".*\\.vercel\\.app" }],
        destination: "https://brkyscrib.cz/:path",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
