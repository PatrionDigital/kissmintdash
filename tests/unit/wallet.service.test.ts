import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WalletService } from '../../app/services/wallet.service';
import type { PrizePayout, TransferResult } from '../../app/types/prize-distribution';

// Mock the Coinbase CDP SDK
vi.mock('@coinbase/cdp-sdk', async () => {
  const mockAccount = {
    address: '0x1234567890123456789012345678901234567890',
    transfer: vi.fn(),
    getBalance: vi.fn(),
  };

  const mockClient = {
    evm: {
      listAccounts: vi.fn().mockResolvedValue({
        accounts: [mockAccount],
      }),
    },
  };

  return {
    CdpClient: vi.fn().mockImplementation(() => mockClient),
    mockAccount,
    mockClient,
  };
});

// Mock viem
vi.mock('viem', async () => ({
  formatUnits: vi.fn((value: bigint, decimals: number) => {
    const divisor = BigInt(10 ** decimals);
    const quotient = value / divisor;
    const remainder = value % divisor;
    return `${quotient}.${remainder.toString().padStart(decimals, '0')}`;
  }),
  createPublicClient: vi.fn(() => ({
    waitForTransactionReceipt: vi.fn(),
    getTransactionReceipt: vi.fn(),
    getTransaction: vi.fn(),
  })),
  http: vi.fn(() => ({})),
  base: {
    id: 8453,
    name: 'Base',
    network: 'base',
    nativeCurrency: {
      decimals: 18,
      name: 'Ether',
      symbol: 'ETH',
    },
    rpcUrls: {
      default: { http: ['https://mainnet.base.org'] },
      public: { http: ['https://mainnet.base.org'] },
    },
  },
}));

describe('WalletService', () => {
  let walletService: WalletService;
  
  // Mock environment variables
  const mockEnvVars = {
    NEXT_PUBLIC_TOKEN_ADDRESS: '0xabcdef1234567890abcdef1234567890abcdef12',
    CDP_PAYOUT_ACCOUNT_ID: 'test-account-id',
    CDP_BASE_NETWORK_ID: 'base-mainnet',
    NEXT_PUBLIC_ONCHAINKIT_API_KEY: 'test-api-key',
  };

  beforeEach(() => {
    // Reset environment variables
    Object.entries(mockEnvVars).forEach(([key, value]) => {
      process.env[key] = value;
    });

    // Clear all mocks
    vi.clearAllMocks();
    
    // Reset singleton instance
    (WalletService as unknown as { _instance: WalletService | undefined })._instance = undefined;
    
    walletService = WalletService.getInstance();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getInstance', () => {
    it('should return a singleton instance', () => {
      const instance1 = WalletService.getInstance();
      const instance2 = WalletService.getInstance();
      
      expect(instance1).toBe(instance2);
      expect(instance1).toBeInstanceOf(WalletService);
    });

    it('should throw error if required environment variables are missing', () => {
      delete process.env.NEXT_PUBLIC_TOKEN_ADDRESS;
      
      // Reset singleton to force re-initialization
      (WalletService as unknown as { _instance: WalletService | undefined })._instance = undefined;
      
      expect(() => WalletService.getInstance()).toThrow('Missing required environment variable: NEXT_PUBLIC_TOKEN_ADDRESS');
    });
  });

  describe('distributePrizes', () => {
    const mockPrizePayouts: PrizePayout[] = [
      {
        userId: 'user1',
        userAddress: '0x1111111111111111111111111111111111111111',
        amount: BigInt('1000000000000000000'), // 1 token
        reason: 'Daily winner',
      },
      {
        userId: 'user2',
        userAddress: '0x2222222222222222222222222222222222222222',
        amount: BigInt('500000000000000000'), // 0.5 tokens
        reason: 'Weekly winner',
      },
    ];

    it('should successfully distribute prizes to multiple users', async () => {
      // Mock successful transfers
      const { mockAccount } = await import('@coinbase/cdp-sdk');
      mockAccount.transfer
        .mockResolvedValueOnce({ transactionHash: '0xhash1' })
        .mockResolvedValueOnce({ transactionHash: '0xhash2' });

      const results = await walletService.distributePrizes(mockPrizePayouts);

      expect(results).toHaveLength(2);
      expect(results[0]).toEqual({
        userId: 'user1',
        userAddress: '0x1111111111111111111111111111111111111111',
        amount: BigInt('1000000000000000000'),
        success: true,
        transactionHash: '0xhash1',
        error: undefined,
      });
      expect(results[1]).toEqual({
        userId: 'user2',
        userAddress: '0x2222222222222222222222222222222222222222',
        amount: BigInt('500000000000000000'),
        success: true,
        transactionHash: '0xhash2',
        error: undefined,
      });

      expect(mockAccount.transfer).toHaveBeenCalledTimes(2);
    });

    it('should handle transfer failures gracefully', async () => {
      const { mockAccount } = await import('@coinbase/cdp-sdk');
      const transferError = new Error('Insufficient balance');
      
      mockAccount.transfer
        .mockResolvedValueOnce({ transactionHash: '0xhash1' })
        .mockRejectedValueOnce(transferError);

      const results = await walletService.distributePrizes(mockPrizePayouts);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[1].error).toBe('Insufficient balance');
      expect(results[1].transactionHash).toBeUndefined();
    });

    it('should retry failed transfers when retry config is provided', async () => {
      const { mockAccount } = await import('@coinbase/cdp-sdk');
      
      mockAccount.transfer
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ transactionHash: '0xhash1' });

      const results = await walletService.distributePrizes(
        [mockPrizePayouts[0]],
        {
          retryConfig: {
            maxRetries: 2,
            baseDelay: 100,
            maxDelay: 1000,
          },
        }
      );

      expect(results[0].success).toBe(true);
      expect(results[0].transactionHash).toBe('0xhash1');
      expect(mockAccount.transfer).toHaveBeenCalledTimes(2);
    });

    it('should validate prize payout addresses', async () => {
      const invalidPayouts: PrizePayout[] = [
        {
          userId: 'user1',
          userAddress: 'invalid-address',
          amount: BigInt('1000000000000000000'),
          reason: 'Test',
        },
      ];

      await expect(walletService.distributePrizes(invalidPayouts)).rejects.toThrow();
    });

    it('should handle empty prize payouts array', async () => {
      const results = await walletService.distributePrizes([]);
      
      expect(results).toEqual([]);
    });
  });

  describe('getPayoutAccountBalance', () => {
    it('should return formatted balance for payout account', async () => {
      const { mockAccount } = await import('@coinbase/cdp-sdk');
      const mockBalance = BigInt('5000000000000000000'); // 5 tokens
      
      mockAccount.getBalance.mockResolvedValue(mockBalance);

      const result = await walletService.getPayoutAccountBalance();

      expect(result).toEqual({
        address: '0x1234567890123456789012345678901234567890',
        balance: mockBalance,
        formatted: '5.000000000000000000',
      });
    });

    it('should throw AccountNotFoundError when account is not found', async () => {
      const { mockClient } = await import('@coinbase/cdp-sdk');
      
      mockClient.evm.listAccounts.mockResolvedValue({ accounts: [] });

      // Reset singleton to force re-initialization with new mock
      (WalletService as unknown as { _instance: WalletService | undefined })._instance = undefined;
      walletService = WalletService.getInstance();

      await expect(walletService.getPayoutAccountBalance()).rejects.toThrow('Account not found');
    });

    it('should handle balance fetch errors', async () => {
      const { mockAccount } = await import('@coinbase/cdp-sdk');
      
      mockAccount.getBalance.mockRejectedValue(new Error('Network error'));

      await expect(walletService.getPayoutAccountBalance()).rejects.toThrow('Network error');
    });
  });

  describe('error handling', () => {
    it('should handle CDP client initialization errors', () => {
      // Mock CDP client constructor to throw
      const { CdpClient } = vi.mocked(await import('@coinbase/cdp-sdk'));
      CdpClient.mockImplementation(() => {
        throw new Error('CDP initialization failed');
      });

      // Reset singleton to force re-initialization
      (WalletService as unknown as { _instance: WalletService | undefined })._instance = undefined;

      expect(() => WalletService.getInstance()).toThrow('CDP initialization failed');
    });
  });

  describe('retry logic', () => {
    it('should implement exponential backoff with jitter', async () => {
      const { mockAccount } = await import('@coinbase/cdp-sdk');
      
      // Mock to fail twice then succeed
      mockAccount.transfer
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockRejectedValueOnce(new Error('Temporary failure'))
        .mockResolvedValueOnce({ transactionHash: '0xhash1' });

      const startTime = Date.now();
      
      const results = await walletService.distributePrizes(
        [mockPrizePayouts[0]],
        {
          retryConfig: {
            maxRetries: 3,
            baseDelay: 100,
            maxDelay: 1000,
          },
        }
      );

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(results[0].success).toBe(true);
      expect(mockAccount.transfer).toHaveBeenCalledTimes(3);
      // Should have some delay due to retries
      expect(duration).toBeGreaterThan(100);
    });

    it('should fail after max retries exceeded', async () => {
      const { mockAccount } = await import('@coinbase/cdp-sdk');
      
      mockAccount.transfer.mockRejectedValue(new Error('Persistent failure'));

      const results = await walletService.distributePrizes(
        [mockPrizePayouts[0]],
        {
          retryConfig: {
            maxRetries: 2,
            baseDelay: 50,
            maxDelay: 200,
          },
        }
      );

      expect(results[0].success).toBe(false);
      expect(results[0].error).toContain('Persistent failure');
      expect(mockAccount.transfer).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });
  });
});
