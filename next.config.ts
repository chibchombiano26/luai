import type { NextConfig } from "next";
import flowPackConfig from "./flow-packs.config.json";

function parsePackageList(rawValue: string | undefined): string[] {
  if (!rawValue) return [];

  return [...new Set(
    rawValue
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean)
  )];
}

const transpiledFlowPackPackages = [...new Set([
  ...(Array.isArray(flowPackConfig.packageNames) ? flowPackConfig.packageNames : []),
  ...(Array.isArray(flowPackConfig.publicPackageNames) ? flowPackConfig.publicPackageNames : []),
  ...parsePackageList(process.env.FLOW_PACK_PACKAGES),
  ...parsePackageList(process.env.PUBLIC_FLOW_PACK_PACKAGES),
])];

const nextConfig: NextConfig = {
  transpilePackages: transpiledFlowPackPackages,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.shields.io",
      },
    ],
  },
};

export default nextConfig;
