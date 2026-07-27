import type { NextConfig } from "next";

const productionOrigins = [
  "desk.orblead.com",
  "https://desk.orblead.com",
];

const extraOrigin = process.env.DEV_ALLOWED_ORIGIN;
const allowedOrigins = [
  "localhost:6789",
  "127.0.0.1:6789",
  "192.168.1.10:6789",
  ...productionOrigins,
  ...(extraOrigin ? [extraOrigin] : []),
];

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: ["192.168.1.10", "desk.orblead.com"],
  experimental: {
    serverActions: {
      allowedOrigins,
      bodySizeLimit: "20mb",
    },
  },
};

export default nextConfig;
