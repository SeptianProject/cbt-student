import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
      // CBT Backend Storage - Production
      {
        protocol: "https",
        hostname: "cbt-app.dkb.or.id",
        port: "",
        pathname: "/storage/**",
      },
      // CBT Backend Storage - Development
      {
        protocol: "http",
        hostname: "cbt-app.me",
        port: "8000",
        pathname: "/storage/**",
      },
      // Local development
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/storage/**",
      },
      // Possible IP address
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "8000",
        pathname: "/storage/**",
      },
    ],
  },
};

export default nextConfig;
