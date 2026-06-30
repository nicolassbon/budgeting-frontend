/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/auth/:path*',
        destination: 'http://localhost:8080/auth/:path*',
      },
      {
        source: '/dashboard/:path*',
        destination: 'http://localhost:8080/dashboard/:path*',
      },
      {
        source: '/transactions/:path*',
        destination: 'http://localhost:8080/transactions/:path*',
      },
      {
        source: '/api/:path*',
        destination: 'http://localhost:8080/api/:path*',
      },
    ]
  },
}

export default nextConfig
