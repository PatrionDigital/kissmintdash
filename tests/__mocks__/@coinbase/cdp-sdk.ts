import { vi, type MockedFunction } from 'vitest';

// Mock types for Coinbase CDP SDK - properly typed
export interface MockTransferParams {
  to: `0x${string}`;
  amount: bigint;
  token: string;
  network: string;
}

export interface MockTransferResult {
  transactionHash: string;
}

export interface MockBalanceParams {
  token: string;
  network: string;
}

export interface MockListAccountsParams {
  pageSize?: number;
}

export interface MockListAccountsResult {
  accounts: MockEvmAccount[];
}

export interface MockEvmAccount {
  address: string;
  transfer: MockedFunction<(params: MockTransferParams) => Promise<MockTransferResult>>;
  getBalance: MockedFunction<(params: MockBalanceParams) => Promise<bigint>>;
}

export interface MockCdpClient {
  evm: {
    listAccounts: MockedFunction<(params?: MockListAccountsParams) => Promise<MockListAccountsResult>>;
  };
}

// Create mock account factory
export const createMockEvmAccount = (address: string): MockEvmAccount => ({
  address,
  transfer: vi.fn() as MockedFunction<(params: MockTransferParams) => Promise<MockTransferResult>>,
  getBalance: vi.fn() as MockedFunction<(params: MockBalanceParams) => Promise<bigint>>,
});

// Create mock CDP client
export const createMockCdpClient = (): MockCdpClient => ({
  evm: {
    listAccounts: vi.fn() as MockedFunction<(params?: MockListAccountsParams) => Promise<MockListAccountsResult>>,
  },
});

// Default mock implementations
const mockAccount = createMockEvmAccount('0x1234567890123456789012345678901234567890');
const mockClient = createMockCdpClient();

// Mock the CdpClient class
export const CdpClient = vi.fn().mockImplementation(() => mockClient);

// Export mock instances for test access
export const mockCdpClient = mockClient;
export const mockEvmAccount = mockAccount;

// Reset function for tests
export const resetMocks = () => {
  vi.clearAllMocks();
  mockAccount.transfer.mockReset();
  mockAccount.getBalance.mockReset();
  mockClient.evm.listAccounts.mockReset();
};
