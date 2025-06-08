import { WalletService } from '@/services/wallet.service';
import { TransferResult } from '@/types/wallet.types';

// Mock the module with type assertion
const mockGetDefaultAddress = jest.fn<Promise<string>, []>();
const mockGetBalance = jest.fn<Promise<string>, []>();
const mockGetId = jest.fn<string, []>();
const mockCreateTransfer = jest.fn<Promise<TransferResult>, [unknown]>();
const mockGetAddress = jest.fn<Promise<string>, []>();
const mockSignTransaction = jest.fn<Promise<string>, [unknown]>();

// Mock the module with type assertion
jest.mock('@coinbase/coinbase-sdk', () => {
  // Mock Wallet class that matches the expected interface
  class MockWallet {
    getDefaultAddress = mockGetDefaultAddress;
    getBalance = mockGetBalance;
    createTransfer = mockCreateTransfer;
    getId = mockGetId;
    getAddress = mockGetAddress;
    signTransaction = mockSignTransaction;
    static create = jest.fn();
  }

  return {
    Wallet: MockWallet as unknown as typeof import('@coinbase/coinbase-sdk').Wallet
  };
});

// Now import the mocked Wallet
import { Wallet } from '@coinbase/coinbase-sdk';

// Set up default mock implementations
beforeEach(() => {
  jest.clearAllMocks();
  
  mockGetDefaultAddress.mockResolvedValue('0x1234567890abcdef1234567890abcdef12345678');
  mockGetBalance.mockResolvedValue('1000000000000000000'); // 1 token in wei
  mockGetId.mockReturnValue('test-wallet-id');
  mockGetAddress.mockResolvedValue('0x1234567890abcdef1234567890abcdef12345678');
  mockSignTransaction.mockResolvedValue('mocked-signed-tx');
  
  // Mock transfer creation
  mockCreateTransfer.mockImplementation(async () => ({
    status: 'success',
    transactionHash: '0x123',
    to: '0xrecipient',
    wait: jest.fn().mockResolvedValue({ status: 1, transactionHash: '0x123' }),
    getTransactionHash: jest.fn().mockReturnValue('0x123')
  }));
  
  // Mock wallet creation
  (Wallet.create as jest.Mock).mockResolvedValue(new (jest.requireMock('@coinbase/coinbase-sdk').Wallet)());
});

describe('WalletService', () => {
  let service: WalletService;

  beforeEach(() => {
    service = new WalletService();
  });

  describe('initialization', () => {
    it('should initialize with default values', () => {
      expect(service).toBeInstanceOf(WalletService);
    });

    it('should initialize wallet when distributePrizes is called', async () => {
      const payouts = [
        { userAddress: '0x1111111111111111111111111111111111111111', prizeAmount: '1000000000000000000' }
      ];

      const results = await service.distributePrizes(payouts);
      
      expect(results).toBeDefined();
      if (!results) return;
      
      expect(results[0].status).toBe('confirmed');
      expect(Wallet.create).toHaveBeenCalled();
    });
  });

  describe('Prize Distribution', () => {
    let walletService: WalletService;
    
    beforeEach(async () => {
      walletService = new WalletService();
      // The wallet will be initialized when distributePrizes is called
    });

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
      expect(results[0].transactionHash).toBe('0x123');
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

    it('should return undefined for null or undefined payouts', async () => {
      expect(await walletService.distributePrizes(null)).toBeUndefined();
      expect(await walletService.distributePrizes(undefined)).toBeUndefined();
    });
  });
});
