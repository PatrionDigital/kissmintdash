export interface WalletConfig {
  isProduction: boolean;
  tokenAddress: string;
  coinbaseApiKey: string;
  coinbasePrivateKey: string;
  coinbaseWalletId?: string;
}

// Helper to get required environment variable
function getRequiredEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

// Get environment-specific configuration
export function getWalletConfig(): WalletConfig {
  const isProduction = process.env.NODE_ENV === 'production';
  
  // In production, all variables are required
  if (isProduction) {
    return {
      isProduction: true,
      tokenAddress: getRequiredEnvVar('NEXT_PUBLIC_TOKEN_ADDRESS'),
      coinbaseApiKey: getRequiredEnvVar('COINBASE_API_KEY'),
      coinbasePrivateKey: getRequiredEnvVar('COINBASE_PRIVATE_KEY'),
      coinbaseWalletId: process.env.COINBASE_WALLET_ID // Optional
    };
  }

  // In development, use testnet settings
  return {
    isProduction: false,
    tokenAddress: process.env.NEXT_PUBLIC_TOKEN_ADDRESS || '0xTestTokenAddress',
    coinbaseApiKey: process.env.COINBASE_API_KEY || 'test_api_key',
    coinbasePrivateKey: process.env.COINBASE_PRIVATE_KEY || 'test_private_key',
    coinbaseWalletId: process.env.COINBASE_WALLET_ID
  };
}

// Validate configuration on startup
if (process.env.NODE_ENV !== 'test') {
  try {
    getWalletConfig();
    console.log('[Config] Wallet configuration validated successfully');
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Config] Invalid wallet configuration:', errorMessage);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
}
