/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.STUDIO_CONNECTED === "true" && !process.env.VERCEL
    ? ".next-studio"
    : ".next",
  serverExternalPackages: ["ffprobe-static"],
  turbopack: { root: process.cwd() },
};

export default nextConfig;
