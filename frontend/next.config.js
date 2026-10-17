/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Support both local API proxy and direct API URL configuration
  async rewrites() {
    const rawUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
    const baseUrl = rawUrl.replace(/\/api\/v1\/?$/, '').replace(/\/$/, '');
    return [
      {
        source: '/api/v1/:path*',
        destination: `${baseUrl}/api/v1/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
