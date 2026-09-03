import type { NextConfig } from "next";
import { SECURITY_HEADERS } from "./src/lib/security";

const releaseSha = process.env.RELEASE_SHA ?? process.env.GITHUB_SHA ?? "";
const releaseIdentityHeaders = /^[0-9a-f]{40}$/i.test(releaseSha)
  ? [{ key: "X-Release-SHA", value: releaseSha.toLowerCase() }]
  : [];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [75],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    deviceSizes: [360, 640, 768, 1024, 1280, 1536, 1920, 2560],
    imageSizes: [32, 64, 96, 128, 256, 384],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          ...SECURITY_HEADERS.map(({ key, value }) => ({ key, value })),
          ...releaseIdentityHeaders,
        ],
      },
    ];
  },
};

export default nextConfig;
