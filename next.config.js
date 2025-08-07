/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  basePath: '/Roster-Runner',
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig