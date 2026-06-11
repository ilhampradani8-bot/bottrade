import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @ts-ignore
  allowedDevOrigins: ["139.59.122.230", "tradingsafe.mijdigital.my", "www.tradingsafe.mijdigital.my"],
  async rewrites() {
    return [
      {
        source: '/',
        destination: '/landing.html',
      },
      {
        source: '/home',
        destination: '/landing.html',
      },
    ];
  },
};

export default nextConfig;
