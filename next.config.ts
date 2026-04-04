import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    /* config options here */
    reactCompiler: true,
    outputFileTracingIncludes: {
      "/nexus": ["src/generated/prisma/*"]
    }
};

export default nextConfig;
