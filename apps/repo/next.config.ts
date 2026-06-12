import type { NextConfig } from 'next'
import { headers } from '@sentinel/config/security-headers'

const nextConfig: NextConfig = {
  transpilePackages: ['@sentinel/ui', '@sentinel/core'],
  headers,
}

export default nextConfig
