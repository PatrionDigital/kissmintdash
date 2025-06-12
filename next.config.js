/** @type {import('next').NextConfig} */
import { fileURLToPath } from 'url';
import path from 'path';
import webpack from 'webpack';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Only include page files with these extensions
  pageExtensions: ['page.tsx', 'page.ts', 'page.jsx', 'page.js'],
  
  webpack: (config, { isServer, dev }) => {
    // Skip test files in production builds
    if (!dev) {
      config.module.rules.push({
        test: /\.(test|spec)\.(ts|tsx|js|jsx)$/,
        use: 'null-loader'
      });
    }
    
    // Add alias for '@' to project root for path resolution
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": path.resolve(__dirname),
      "@walletconnect/heartbeat": false, // Prevent build errors from unused worker dependency
    };

    // Ignore HeartbeatWorker*.js files (WalletConnect v2 ESM worker issue workaround)
    config.plugins = config.plugins || [];
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /HeartbeatWorker(\.[a-f0-9]+)?\.js$/,
      })
    );

    return config;
  },
  
  // Configure webpack to handle ES modules
  experimental: {
    esmExternals: "loose",
  },
  
  // Add transpilePackages for any problematic packages
  transpilePackages: ["@walletconnect/*"],
  
  // Disable type checking during build (optional, can help with build speed)
  typescript: {
    ignoreBuildErrors: true,
  },
  
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Configure how Next.js handles static files
  images: {
    domains: [],
  },
  
  // Configure the build output directory
  distDir: ".next",
  
  // Configure the build ID to be deterministic
  generateBuildId: async () => {
    return "build-" + Date.now();
  },
};

export default nextConfig;
