import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse", "pdfjs-dist"],
  outputFileTracingIncludes: {
    "/api/**/*": ["./prisma/starter.db"],
    "/**/*": ["./prisma/starter.db"],
  },
};

export default nextConfig;
