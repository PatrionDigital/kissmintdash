// Simple mocks for viem to avoid circular dependencies
const mockHttp = () => 'http-transport';
const mockFormatUnits = (value: string | bigint) => value.toString();
const mockParseUnits = (value: string, decimals: number) => 
  BigInt(value) * (10n ** BigInt(decimals));

type WaitForTransactionReceiptFn = (params: { hash: string }) => Promise<{
  status: 'success' | 'reverted';
  transactionHash: string;
}>;

// Mock for waitForTransactionReceipt
let mockWaitForTransactionReceipt: jest.Mock<ReturnType<WaitForTransactionReceiptFn>, Parameters<WaitForTransactionReceiptFn>> = jest.fn().mockResolvedValue({
  status: 'success',
  transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
});

// Mock for createPublicClient
const mockCreatePublicClient = jest.fn().mockImplementation(() => ({
  waitForTransactionReceipt: mockWaitForTransactionReceipt,
}));

// Export the mocks
export const http = mockHttp;
export const formatUnits = mockFormatUnits;
export const parseUnits = mockParseUnits;
export const createPublicClient = mockCreatePublicClient;

// Create the mock object
const viemMock = {
  http,
  formatUnits,
  parseUnits,
  createPublicClient,
  // Export the mock function so tests can modify its behavior
  _setWaitForTransactionReceipt: (fn: typeof mockWaitForTransactionReceipt) => {
    mockWaitForTransactionReceipt = fn;
  }
};

// Export the mock object as the default export
export default viemMock;
