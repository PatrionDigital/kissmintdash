import path from 'path';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Silence warnings
  // https://github.com/WalletConnect/walletconnect-monorepo/issues/1908
  webpack: (config) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");
    
    // Enable path aliases
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, './'),
    };
    
    return config;
  },
  // Enable experimental features for path aliases
  experimental: {
    // This is recommended in Next.js 13+ for path aliases
    externalDir: true,
  },
};

export default nextConfig;
