import type { NextConfig } from "next";
const config: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  allowedDevOrigins: ["192.168.1.100", "localhost", "127.0.0.1"],
};
export default config;
