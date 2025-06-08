// Set up test environment variables if they're not already set
if (!process.env.NEXT_PUBLIC_TOKEN_ADDRESS) {
  process.env.NEXT_PUBLIC_TOKEN_ADDRESS = '0x1234567890123456789012345678901234567890';
}
if (!process.env.CDP_PAYOUT_ACCOUNT_ID) {
  process.env.CDP_PAYOUT_ACCOUNT_ID = 'test-account-id';
}
if (!process.env.CDP_BASE_NETWORK_ID) {
  process.env.CDP_BASE_NETWORK_ID = 'test-network-id';
}
if (!process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY) {
  process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY = 'test-api-key';
}

// Mock any global objects or functions needed for testing
global.console = {
  ...console,
  // Override any console methods if needed
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};
