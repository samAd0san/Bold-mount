import type { NextConfig } from "next";

// Set on Vercel only: the API runs on Render and Vercel just proxies /api/* to it (Vercel can't reach MongoDB).
const API_ORIGIN = process.env.API_ORIGIN?.replace(/\/$/, '');

const nextConfig: NextConfig = {
  // The parent Parcera folder has its own lockfile; pin the root so Turbopack doesn't pick it.
  turbopack: { root: __dirname },
  serverExternalPackages: ['mongoose'],
  // Pages already loaded in the browser are reused for 30s, not 5 min, so shop changes show up on the next click.
  experimental: { staleTimes: { static: 30 } },
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    qualities: [75, 90, 95],
    // Admin-uploaded product photos (Cloudinary) and Google profile pictures.
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com', pathname: '/**' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com', pathname: '/**' },
    ],
  },
  async rewrites() {
    return API_ORIGIN ? { beforeFiles: [{ source: '/api/:path*', destination: `${API_ORIGIN}/api/:path*` }], afterFiles: [], fallback: [] } : [];
  },
};

export default nextConfig;
