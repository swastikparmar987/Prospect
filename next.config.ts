import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse", "pdfjs-dist"],
  outputFileTracingIncludes: {
    "/api/**/*": ["./prisma/starter.db", "./node_modules/pdf-parse/**/*"],
    "/**/*": ["./prisma/starter.db"],
  },
};

export default nextConfig;
