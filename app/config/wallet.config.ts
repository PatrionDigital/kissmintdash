export interface WalletConfig {
  isProduction: boolean;
  tokenAddress: string;
  // In v2, we don't need API key or private key
  // The SDK handles authentication through the browser
  coinbaseWalletId?: string; // Optional wallet ID for reconnecting to existing wallet
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
  
  // In production, only token address is required
  if (isProduction) {
    return {
      isProduction: true,
      tokenAddress: getRequiredEnvVar('NEXT_PUBLIC_TOKEN_ADDRESS'),
      coinbaseWalletId: process.env.COINBASE_WALLET_ID // Optional
    };
  }

  // In development, use testnet settings with defaults
  return {
    isProduction: false,
    tokenAddress: process.env.NEXT_PUBLIC_TOKEN_ADDRESS || '0xTestTokenAddress',
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
