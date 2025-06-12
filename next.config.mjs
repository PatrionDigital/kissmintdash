import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in ES module
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
        use: 'null-loader',
      });
    }

    // Add aliases and externals
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname),
      '@walletconnect/heartbeat': false, // Prevent build errors from unused worker dependency
    };

    // Add external dependencies to prevent build issues
    config.externals = config.externals || [];
    config.externals.push('pino-pretty', 'lokijs', 'encoding');

    // Ignore HeartbeatWorker*.js files (WalletConnect v2 ESM worker issue workaround)
    config.module.rules.push({
      test: /HeartbeatWorker\.js$/,
      use: 'null-loader',
    });

    return config;
  },

  // Configure experimental features
  experimental: {
    esmExternals: 'loose',
    externalDir: true, // Recommended for path aliases in Next.js 13+
  },

  // Configure the build ID to be deterministic
  generateBuildId: async () => {
    return 'kissmintdash';
  },
};

export default nextConfig;
