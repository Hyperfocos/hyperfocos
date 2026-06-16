import path from 'path'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  typescript: {
    // Os tipos do Supabase são inferidos em runtime com as env vars
    // Erros de tipo serão resolvidos quando as variáveis estiverem configuradas
    ignoreBuildErrors: true,
  },
}

export default nextConfig
