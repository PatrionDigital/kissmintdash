import { vi, type MockedFunction } from 'vitest';

// Mock viem utilities with simpler types
export const formatUnits = vi.fn((value: bigint, decimals: number): string => {
  // Simple mock implementation for testing
  const divisor = BigInt(10 ** decimals);
  const quotient = value / divisor;
  const remainder = value % divisor;
  return `${quotient}.${remainder.toString().padStart(decimals, '0')}`;
});

export const parseUnits = vi.fn((value: string, decimals: number): bigint => {
  // Simple mock implementation for testing
  const [whole, fraction = ''] = value.split('.');
  const paddedFraction = fraction.padEnd(decimals, '0').slice(0, decimals);
  return BigInt(whole + paddedFraction);
});

// Mock public client types
export interface MockTransactionReceipt {
  status: 'success' | 'reverted';
  transactionHash: `0x${string}`;
  blockNumber: bigint;
}

export interface MockPublicClient {
  waitForTransactionReceipt: MockedFunction<(params: { hash: `0x${string}`; confirmations: number }) => Promise<MockTransactionReceipt>>;
  getTransactionReceipt: MockedFunction<(params: { hash: `0x${string}` }) => Promise<MockTransactionReceipt>>;
  getTransaction: MockedFunction<(params: { hash: `0x${string}` }) => Promise<unknown>>;
}

// Mock public client factory
export const createMockPublicClient = (): MockPublicClient => ({
  waitForTransactionReceipt: vi.fn(),
  getTransactionReceipt: vi.fn(),
  getTransaction: vi.fn(),
});

export const createPublicClient = vi.fn(() => createMockPublicClient());

export const http = vi.fn(() => ({}));

// Mock chains
export const base = {
  id: 8453,
  name: 'Base',
  network: 'base',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['https://mainnet.base.org'],
    },
    public: {
      http: ['https://mainnet.base.org'],
    },
  },
} as const;

// Export mock instances for test access
export const mockPublicClient = createMockPublicClient();

// Reset function for tests
export const resetViemMocks = () => {
  vi.clearAllMocks();
  formatUnits.mockReset();
  parseUnits.mockReset();
  createPublicClient.mockReturnValue(mockPublicClient);
  mockPublicClient.waitForTransactionReceipt.mockReset();
  mockPublicClient.getTransactionReceipt.mockReset();
  mockPublicClient.getTransaction.mockReset();
};
