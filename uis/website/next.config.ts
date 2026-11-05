import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  turbopack: { root: path.resolve(__dirname) },
  async rewrites() {
    return [{
      source: "/index.html",
      destination: "/",
    }, {
      source: "/api/commercial-inquiries",
      destination: `${process.env.BACKEND_URL || "http://127.0.0.1:8000"}/api/commercial-inquiries`,
    }];
  },
};

export default nextConfig;
