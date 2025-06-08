import { WalletService } from '@/services/wallet.service';

// Helper function to reset the singleton instance for testing
const resetWalletService = () => {
  // Clear the singleton instance by calling getInstance with a flag to reset
  // @ts-expect-error - Accessing private method for testing
  WalletService.getInstance(true);
};

// Mock the module with type assertion
const mockGetAccount = jest.fn();
const mockCreateTransfer = jest.fn<Promise<{ transactionHash: string }>, [{
  to: `0x${string}`;
  amount: bigint;
  token: string;
  network: string;
}]>();

// Mock the CdpClient
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

// Set environment variables for testing
process.env.NEXT_PUBLIC_TOKEN_ADDRESS = '0x1234567890123456789012345678901234567890';
process.env.CDP_PAYOUT_ACCOUNT_ID = 'test-account-id';
process.env.BASE_NETWORK_ID = 'base-mainnet';
process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY = 'test-api-key';

describe('WalletService', () => {
  let walletService: WalletService;

  beforeEach(() => {
    walletService = WalletService.getInstance();
  });

  describe('initialization', () => {
    it('should initialize with environment variables', () => {
      expect(walletService).toBeInstanceOf(WalletService);
    });

    it('should throw error if NEXT_PUBLIC_TOKEN_ADDRESS is missing', () => {
      // Save the original token address
      const originalTokenAddress = process.env.NEXT_PUBLIC_TOKEN_ADDRESS;
      
      // Reset the singleton instance for testing
      resetWalletService();
      
      // Remove the token address
      delete process.env.NEXT_PUBLIC_TOKEN_ADDRESS;
      
      // Test that the error is thrown
      expect(() => WalletService.getInstance()).toThrow('NEXT_PUBLIC_TOKEN_ADDRESS environment variable is not set');
      
      // Restore the token address
      process.env.NEXT_PUBLIC_TOKEN_ADDRESS = originalTokenAddress;
    });
  });

  describe('prize distribution', () => {
    it('should distribute prizes successfully', async () => {
      const payouts = [
        { userAddress: '0x1111111111111111111111111111111111111111', prizeAmount: '1000000000000000000' },
        { userAddress: '0x2222222222222222222222222222222222222222', prizeAmount: '500000000000000000' }
      ];

      const results = await walletService.distributePrizes(payouts);
      
      expect(results).toBeDefined();
      if (!results) return;
      
      expect(results).toHaveLength(2);
      expect(results[0].status).toBe('confirmed');
      expect(results[0].transactionHash).toBe('0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef');
      expect(mockCreateTransfer).toHaveBeenCalledTimes(2);
    });

    it('should handle transfer failures', async () => {
      // Mock a transfer failure
      mockCreateTransfer.mockRejectedValueOnce(new Error('Insufficient funds'));
      
      const payouts = [
        { userAddress: '0x1111111111111111111111111111111111111111', prizeAmount: '1000000000000000000' }
      ];

      const results = await walletService.distributePrizes(payouts);
      expect(results).toBeDefined();
      if (!results) return;
      
      expect(results[0].status).toBe('failed');
      expect(results[0].error).toContain('Insufficient funds');
    });

    it('should return undefined for empty payouts', async () => {
      const results = await walletService.distributePrizes([]);
      expect(results).toBeUndefined();
    });
  });
});
