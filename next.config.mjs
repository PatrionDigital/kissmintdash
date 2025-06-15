import path from 'path';
import { fileURLToPath } from 'url';
// Get the directory name in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Include both default Next.js page files and explicit .page.* files
  pageExtensions: ['tsx', 'ts', 'jsx', 'js', 'page.tsx', 'page.ts', 'page.jsx', 'page.js'],

  webpack: (config, { dev, _isServer, webpack }) => {
    // Use webpack's built-in IgnorePlugin
    const { IgnorePlugin } = webpack;
    // Ignore createCdpAccount.ts from the build
    config.plugins.push(
      new IgnorePlugin({
        resourceRegExp: /^\/?(scripts\/createCdpAccount\.ts)$/,
      })
    );
    
    // Skip test files in production builds
    if (!dev) {
      config.module.rules.push({
        test: /\.(test|spec)\.(ts|tsx|js|jsx)$/,
        use: 'null-loader',
      });
    }
    
    // Handle the HeartbeatWorker file as a module
    config.module.rules.push({
      test: /HeartbeatWorker\.js$/,
      type: 'javascript/auto',
      use: [
        {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', { modules: 'commonjs' }]
            ]
          }
        }
      ]
    });
    
    // Skip problematic modules
    config.resolve.alias = {
      ...config.resolve.alias,
      '@walletconnect/heartbeat': false,
    };

    // Add aliases for path resolution
    const basePath = path.resolve(__dirname);
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': basePath,
      '@/app': path.resolve(basePath, 'app'),
      '@/components': path.resolve(basePath, 'components'),
      '@/styles': path.resolve(basePath, 'styles'),
      '@/lib': path.resolve(basePath, 'lib'),
      '@walletconnect/heartbeat': false, // Prevent build errors from unused worker dependency
    };

    // Add external dependencies to prevent build issues
    config.externals = config.externals || [];
    config.externals.push('pino-pretty', 'lokijs', 'encoding');

    return config;
  },

  // Configure webpack to handle ES modules
  experimental: {
    esmExternals: 'loose',
    externalDir: true, // Recommended for path aliases in Next.js 13+
  },

  // Configure ESLint
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Configure how Next.js handles static files
  images: {
    domains: [],
  },
  
  // Configure the build output directory
  distDir: '.next',
  
  // Configure the build ID to be deterministic
  generateBuildId: async () => {
    return 'kissmintdash';
  },
};

export default nextConfig;
