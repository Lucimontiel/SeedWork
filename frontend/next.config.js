/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false, // 👈 Agregado aquí para quitar el logo "N" en desarrollo
  images: {
    domains: ['localhost'],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/api/:path*',
      },
    ];
  },
}

module.exports = nextConfig