import type { NextConfig } from "next";

const nextConfig = {
  compiler: { styledComponents: true },
  output: "standalone",
} satisfies NextConfig;

export default nextConfig;
