// web/next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        // When the browser calls /api/login, 
        // Next.js proxies it to the backend container
        source: "/api/:path*",
        destination: "http://clinicops-api:8000/api/:path*", 
      },
    ];
  },
};

module.exports = nextConfig;