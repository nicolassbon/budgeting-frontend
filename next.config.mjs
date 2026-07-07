/** @type {import('next').NextConfig} */
const backendUrl = process.env.BACKEND_URL || 'http://localhost:8080'

const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/auth/:path*',
        destination: `${backendUrl}/auth/:path*`,
      },
      {
        source: '/dashboard/:path*',
        destination: `${backendUrl}/dashboard/:path*`,
      },
      {
        source: '/transactions/:path*',
        destination: `${backendUrl}/transactions/:path*`,
      },
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ]
  },
}

export default nextConfig
