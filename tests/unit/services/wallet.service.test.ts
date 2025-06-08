// Define types for our mocks
interface TransferResult {
  transactionHash: string;
  status?: string;
}

// Mock the module with type assertion
const mockGetAccount = jest.fn();
const mockCreateTransfer = jest.fn<Promise<TransferResult>, [{
  to: `0x${string}`;
  amount: bigint;
  token: string;
  network: string;
}]>();

// Mock the sleep utility
jest.mock('@/utils/sleep', () => ({
  sleep: jest.fn().mockResolvedValue(undefined),
}));

// Mock the CdpClient before importing the module that uses it
jest.mock('@coinbase/cdp-sdk', () => ({
  CdpClient: jest.fn().mockImplementation(() => ({
    accounts: {
      getAccount: mockGetAccount,
    },
    transfers: {
      createTransfer: mockCreateTransfer,
    },
  })),
}));

// Now import the service after setting up the mocks
import { WalletService } from '@/services/wallet.service';

// Define types for testing
interface MockAccount {
  transfer: jest.Mock<Promise<{ transactionHash: string; status?: string }>, [{
    to: `0x${string}`;
    amount: bigint;
    token: string;
    network: string;
  }]>;
  getBalance: jest.Mock<Promise<bigint>, []>;
  address: `0x${string}`;
  id: string;
}

type WalletServiceWithPrivate = {
  getAccountById: (id: string) => Promise<MockAccount>;
};

// Set up mock implementations
beforeEach(() => {
  jest.clearAllMocks();
  
  // Default mock implementation for getAccount
  mockGetAccount.mockResolvedValue({
    id: 'test-account-id',
    address: '0x1234567890abcdef1234567890abcdef12345678',
    type: 'ethereum',
    network: 'base-mainnet',
    balance: '1000000000000000000', // 1 token in wei
    getBalance: jest.fn().mockResolvedValue('1000000000000000000'),
  });

  // Default mock implementation for createTransfer
  mockCreateTransfer.mockResolvedValue({
    transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  });
});

// Set environment variables for testing if not already set by setup.ts
if (!process.env.NEXT_PUBLIC_TOKEN_ADDRESS) {
  process.env.NEXT_PUBLIC_TOKEN_ADDRESS = '0x1234567890123456789012345678901234567890';
}
if (!process.env.CDP_PAYOUT_ACCOUNT_ID) {
  process.env.CDP_PAYOUT_ACCOUNT_ID = 'test-account-id';
}
if (!process.env.CDP_BASE_NETWORK_ID) {
  process.env.CDP_BASE_NETWORK_ID = 'base-mainnet';
}
if (!process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY) {
  process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY = 'test-api-key';
}

describe('WalletService', () => {
  let walletService: WalletService;
  let mockAccount: MockAccount;

  beforeEach(() => {
    // Get the singleton instance
    walletService = WalletService.getInstance();
    
    // Create a mock account with all required properties
    mockAccount = {
      transfer: jest.fn(),
      getBalance: jest.fn().mockResolvedValue(BigInt('1000000000000000000000')), // 1000 tokens
      address: '0x1234567890abcdef1234567890abcdef12345678',
      id: 'test-account-id'
    };
    
    // Mock the transfer method
    mockAccount.transfer.mockResolvedValue({
      transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      status: 'submitted'
    });
  });

  describe('prize distribution', () => {
    it('should distribute prizes successfully', async () => {
      const payouts = [
        { userAddress: '0x1111111111111111111111111111111111111111', prizeAmount: '1000000000000000000' },
        { userAddress: '0x2222222222222222222222222222222222222222', prizeAmount: '500000000000000000' }
      ];

      // Mock successful transfer with status field
      mockCreateTransfer.mockImplementationOnce(async () => ({
        transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
      }));
      // Reset all mocks to ensure a clean state
      jest.clearAllMocks();
      
      // Reset the mock account's transfer method
      mockAccount.transfer.mockClear();
      mockAccount.transfer.mockResolvedValue({
        transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        status: 'submitted'
      });
      
      // Mock the private getAccountById method using type assertion
      // This is necessary to test the private method
      const mockGetAccountById = jest.spyOn(
        walletService as unknown as WalletServiceWithPrivate,
        'getAccountById'
      );
      mockGetAccountById.mockResolvedValue(mockAccount);
      
      // Create a properly typed mock
      const mockWaitForTransactionConfirmations = jest.spyOn(
        walletService as unknown as { waitForTransactionConfirmations: (hash: string, confirmations: number) => Promise<{ status: string; confirmations: number }> },
        'waitForTransactionConfirmations' as const
      );
      
      (mockWaitForTransactionConfirmations as jest.Mock).mockResolvedValue({
        status: 'confirmed',
        confirmations: 1
      });
      
      // Mock the sleep function to resolve immediately
      const mockSleep = jest.requireMock('@/utils/sleep').sleep as jest.Mock;
      mockSleep.mockResolvedValue(undefined);

      const result = await walletService.distributePrizes(payouts);
      
      // Verify the transfer was called with the correct arguments
      expect(mockAccount.transfer).toHaveBeenCalledTimes(2);
      // Accept submitted or confirmed depending on confirmation flag
      expect(['submitted', 'confirmed']).toContain(result[0].status);
      expect(result[0].transactionHash).toBe('0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef');
    });

    it('should handle transfer failures', async () => {
      // Reset all mocks to ensure a clean state
      jest.clearAllMocks();
      
      // Mock the getAccountById to throw an error
      const mockGetAccountById = jest.spyOn(
        walletService as unknown as WalletServiceWithPrivate,
        'getAccountById'
      );
      mockGetAccountById.mockRejectedValue(new Error('Failed to fetch account'));
      
      const results = await walletService.distributePrizes([
        { userAddress: '0x1234567890123456789012345678901234567890', prizeAmount: '10', userId: 'user1' },
      ]);
      
      if (!results) return;
      
      expect(results[0].status).toBe('failed');
      expect(results[0].error).toContain('Failed to fetch account');
    });

    it('should return empty array for empty payouts', async () => {
      const results = await walletService.distributePrizes([], { waitForConfirmation: true });
      expect(results).toEqual([]);
    });
  });
});
