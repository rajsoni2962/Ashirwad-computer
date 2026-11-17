import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/invoices/[id]/pdf": ["./public/fonts/**/*", "./public/brand/**/*"],
  },
};

export default nextConfig;
