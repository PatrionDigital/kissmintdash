// Mock implementation for createTransfer
const mockCreateTransfer = jest.fn().mockImplementation((_params: { to: string; amount: string; assetId: string }) => ({
  wait: jest.fn().mockResolvedValue({}),
  getTransactionHash: jest.fn().mockResolvedValue(`0x${Math.random().toString(16).substring(2, 66)}`)
}));

const mockWalletCreate = jest.fn().mockImplementation(({ networkId }) => ({
  getDefaultAddress: jest.fn().mockResolvedValue('0x742d35Cc6634C0532925a3b844Bc454e4438f44e'),
  getBalance: jest.fn().mockResolvedValue('1000000000000000000'),
  createTransfer: mockCreateTransfer,
  networkId,
  getId: jest.fn().mockReturnValue('mock-wallet-id')
}));

const mockWalletFetch = jest.fn().mockImplementation((walletId) => ({
  getDefaultAddress: jest.fn().mockResolvedValue('0x742d35Cc6634C0532925a3b844Bc454e4438f44e'),
  getBalance: jest.fn().mockResolvedValue('1000000000000000000'),
  createTransfer: mockCreateTransfer,
  networkId: 'base-sepolia',
  getId: jest.fn().mockReturnValue(walletId)
}));

export const Wallet = {
  create: mockWalletCreate,
  fetch: mockWalletFetch,
  configure: jest.fn()
};

export const Coinbase = {
  configure: jest.fn(),
  networks: {
    BaseSepolia: 'base-sepolia',
    BaseMainnet: 'base-mainnet'
  },
  configureFromJson: jest.fn()
};

// Export mocks for testing
export const mocks: {
  mockCreateTransfer: jest.Mock;
  mockWalletCreate: jest.Mock;
  mockWalletFetch: jest.Mock;
} = {
  mockCreateTransfer,
  mockWalletCreate,
  mockWalletFetch
};
