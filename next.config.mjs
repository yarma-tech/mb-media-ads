/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  distDir: process.env.STUDIO_CONNECTED === "true" && !process.env.VERCEL
    ? ".next-studio"
    : ".next",
  serverExternalPackages: ["ffprobe-static"],
  turbopack: { root: process.cwd() },
};

export default nextConfig;
