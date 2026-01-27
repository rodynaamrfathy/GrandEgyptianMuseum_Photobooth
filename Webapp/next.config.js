/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  //output: "export", // ensures Next.js outputs static files in /out
  eslint: {
    // This ensures Next.js doesn't pass deprecated options to ESLint 9
    ignoreDuringBuilds: false,
  },
};

module.exports = nextConfig;
