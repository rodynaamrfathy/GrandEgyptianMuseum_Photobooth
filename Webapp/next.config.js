/** @type {import('next').NextConfig} */

// Derive the AWS region from the API base URL so the app works in any
// region. Falls back to us-east-1 when the env var is not set, matching
// the original hardcoded behaviour.
const apiBaseUrl = process.env.NEXT_PUBLIC_AWS_API_BASE_URL || "";
const regionMatch = apiBaseUrl.match(/execute-api\.([^.]+)\.amazonaws\.com/);
const AWS_REGION =
  process.env.NEXT_PUBLIC_AWS_REGION || (regionMatch ? regionMatch[1] : "us-east-1");

const nextConfig = {
  // Static export: produces an `out/` directory that can be served from
  // any static host (S3 + CloudFront, in our case). No Node.js server.
  output: "export",
  // next/image optimization requires a Node server. Under static export
  // we use plain <img> tags.
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: `**.execute-api.${AWS_REGION}.amazonaws.com`,
      },
    ],
  },
  // Append a trailing slash to all routes so the CloudFront SPA
  // fallback (which rewrites 403/404 to /index.html) works for any
  // future nested route without per-route config.
  trailingSlash: true,
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: false,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              `img-src 'self' data: blob: https: https://*.s3.${AWS_REGION}.amazonaws.com`,
              "font-src 'self' data:",
              `connect-src 'self' https://*.execute-api.${AWS_REGION}.amazonaws.com https://*.s3.${AWS_REGION}.amazonaws.com https://res.cloudinary.com`,
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
