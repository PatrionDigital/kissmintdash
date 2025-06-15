import { vi, type MockedFunction } from 'vitest'; // Removed unused 'expect'

// Mock viem utilities with simpler types
// Default mock implementations for formatUnits and parseUnits
const formatUnitsImpl = (value: bigint, decimals: number): string => {
  // Simple mock implementation for testing
  const divisor = BigInt(10 ** decimals);
  const quotient = value / divisor;
  const remainder = value % divisor;
  return remainder === 0n ? quotient.toString() : `${quotient}.${remainder.toString().padStart(decimals, '0').replace(/0+$/, '')}`;
};

const parseUnitsImpl = (value: string, decimals: number): bigint => {
  // Simple mock implementation for testing
  const [whole, fraction = ''] = value.split('.');
  const paddedFraction = fraction.padEnd(decimals, '0').slice(0, decimals);
  return BigInt(whole + paddedFraction);
};

export const formatUnits = vi.fn(formatUnitsImpl);
export const parseUnits = vi.fn(parseUnitsImpl);

// Mock public client types
export interface MockTransactionReceipt {
  status: 'success' | 'reverted';
  transactionHash: `0x${string}`;
  blockNumber: bigint;
  blockHash: `0x${string}`;
  transactionIndex: number;
  from: `0x${string}`;
  to: `0x${string}` | null;
  cumulativeGasUsed: bigint;
  gasUsed: bigint;
  effectiveGasPrice: bigint;
  contractAddress: `0x${string}` | null;
  logs: unknown[]; // Replaced 'any' with 'unknown'
  logsBloom: `0x${string}`;
  type: string;
  root?: `0x${string}`;
}

export interface MockPublicClient {
  waitForTransactionReceipt: MockedFunction<(
    params: { hash: `0x${string}`; confirmations?: number; timeout?: number }
  ) => Promise<MockTransactionReceipt>>;
  getTransactionReceipt: MockedFunction<(
    params: { hash: `0x${string}` }
  ) => Promise<MockTransactionReceipt>>;
  getTransaction: MockedFunction<(
    params: { hash: `0x${string}` }
  ) => Promise<unknown>>;
  getChainId: MockedFunction<() => number>;
}

// Mock public client factory
export const createMockPublicClient = (): MockPublicClient => {
  const mockReceipt: MockTransactionReceipt = {
    status: 'success',
    transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    blockNumber: 1n,
    blockHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcde0',
    transactionIndex: 0,
    from: '0x1234567890123456789012345678901234567890',
    to: '0x1234567890123456789012345678901234567890',
    cumulativeGasUsed: 21000n,
    gasUsed: 21000n,
    effectiveGasPrice: 1000000000n,
    contractAddress: null,
    logs: [],
    logsBloom: `0x${'0'.repeat(512)}` as const,
    type: '0x2',
  };

  return {
    waitForTransactionReceipt: vi.fn().mockImplementation(async () => {
      return mockReceipt;
    }),
    getTransactionReceipt: vi.fn().mockResolvedValue(mockReceipt),
    getTransaction: vi.fn().mockResolvedValue({
      hash: mockReceipt.transactionHash,
      blockNumber: mockReceipt.blockNumber,
      from: mockReceipt.from,
      to: mockReceipt.to,
      value: 0n,
      gas: 21000n,
      gasPrice: 1000000000n,
      input: '0x',
      nonce: 0,
      v: 0n,
      r: '0x0',
      s: '0x0',
      transactionIndex: 0,
      type: '0x2',
    }),
    getChainId: vi.fn().mockResolvedValue(8453), // Base mainnet
  };
};

export const createPublicClient = vi.fn().mockImplementation(() => createMockPublicClient());

export const http = vi.fn().mockReturnValue({
  url: 'http://mock-rpc-url',
  request: vi.fn().mockResolvedValue({ result: '0x1' }),
});

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
      webSocket: ['wss://mainnet.base.org'],
    },
    public: {
      http: ['https://mainnet.base.org'],
      webSocket: ['wss://mainnet.base.org'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Basescan',
      url: 'https://basescan.org',
    },
  },
  contracts: {
    multicall3: {
      address: '0xca11bde05977b3631167028862be2a173976ca11',
      blockCreated: 5022,
    },
  },
  testnet: false,
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
