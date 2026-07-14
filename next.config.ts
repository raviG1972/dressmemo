import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: [
    "http://127.0.0.1:3000",
    "http://localhost:81",
    "http://localhost:3000",
    // Allow any preview origin from space-z.ai
    "https://preview-chat-998112bc-9702-4d65-9a7f-b26939b30e70.space-z.ai",
  ],
};

export default nextConfig;
