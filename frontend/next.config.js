/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Support both local API proxy and direct API URL configuration
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
    return [
      {
        source: '/api/v1/:path*',
        destination: `${apiUrl}/api/v1/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
