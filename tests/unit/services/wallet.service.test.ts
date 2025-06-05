// Import types from the actual module
import { Coinbase, type Wallet as WalletType } from '@coinbase/coinbase-sdk';
import { WalletService, type WalletServiceConfig } from '../../../app/services/wallet.service';

// Define mock wallet interface
interface MockWallet extends Partial<WalletType> {
  getDefaultAddress: jest.Mock;
  getBalance: jest.Mock;
  createTransfer: jest.Mock;
  getId: jest.Mock;
  getAddress: jest.Mock;
  signTransaction: jest.Mock;
  sendTransaction: jest.Mock<Promise<{ wait: jest.Mock; getTransactionHash: jest.Mock }>>;
}

// Mock the module at the top level
jest.mock('@coinbase/coinbase-sdk', () => {
  // Create mock functions
  const mockWalletCreate = jest.fn();
  const mockGetDefaultAddress = jest.fn();
  const mockGetBalance = jest.fn();
  const mockCreateTransfer = jest.fn();
  const mockWait = jest.fn();
  const mockGetTransactionHash = jest.fn();

    // Create a mock wallet instance with all required methods
  const createMockWallet = (): MockWallet => ({
    getDefaultAddress: mockGetDefaultAddress,
    getBalance: mockGetBalance,
    createTransfer: mockCreateTransfer,
    // Add the missing getId method
    getId: jest.fn().mockReturnValue('test-wallet-id'),
    // Add other methods that might be needed
    getAddress: mockGetDefaultAddress, // Alias for getDefaultAddress
    signTransaction: jest.fn().mockResolvedValue('signed-tx'),
    sendTransaction: jest.fn().mockResolvedValue({
      wait: mockWait,
      getTransactionHash: mockGetTransactionHash
    })
  });

  // Set up the mock implementation
  mockWalletCreate.mockResolvedValue(createMockWallet());
  
  // Export the mocks for use in tests
  return {
    __mocks: {
      mockWalletCreate,
      mockGetDefaultAddress,
      mockGetBalance,
      mockCreateTransfer,
      mockWait,
      mockGetTransactionHash
    },
    Wallet: {
      create: mockWalletCreate,
      fetch: jest.fn().mockResolvedValue(createMockWallet()),
      configure: jest.fn()
    },
    Coinbase: {
      configure: jest.fn(),
      networks: {
        BaseSepolia: 'base-sepolia',
        BaseMainnet: 'base-mainnet'
      },
      configureFromJson: jest.fn()
    }
  };
});

// Import the mocked module
import * as coinbaseSdk from '@coinbase/coinbase-sdk';

// Define the mocks interface
interface CoinbaseSdkMocks {
  mockWalletCreate: jest.Mock;
  mockGetDefaultAddress: jest.Mock;
  mockGetBalance: jest.Mock;
  mockCreateTransfer: jest.Mock;
  mockWait: jest.Mock;
  mockGetTransactionHash: jest.Mock;
}

// Get the mocks from the mocked module
const {
  mockWalletCreate,
  mockGetDefaultAddress,
  mockGetBalance,
  mockCreateTransfer,
  mockWait,
  mockGetTransactionHash
} = (coinbaseSdk as unknown as { __mocks: CoinbaseSdkMocks }).__mocks;

// Mock environment variables
const originalEnv = { ...process.env };

// Extend WalletService to expose protected methods for testing
class TestableWalletService extends WalletService {
  constructor(config?: Partial<WalletServiceConfig>) {
    super({
      tokenAddress: 'test-token-address',
      coinbaseApiKey: 'test-api-key',
      coinbasePrivateKey: 'test-private-key',
      ...config
    });
  }
  
  // Public method to ensure the wallet is initialized for testing
  async testInitialize(): Promise<void> {
    await this.ensureInitialized();
  }

  // Expose wallet for testing
  public getWalletForTesting() {
    try {
      // @ts-expect-error - Accessing protected property for testing
      return this.wallet;
    } catch (error) {
      console.error('Error getting wallet for testing:', error);
      throw error;
    }
  }
}

describe('WalletService', () => {
  let service: TestableWalletService;

  beforeEach(() => {
    // Reset all mocks and environment variables
    jest.clearAllMocks();
    
    // Create a new env object with the test environment variables
    process.env = {
      ...originalEnv,
      NODE_ENV: 'test',
      COINBASE_API_KEY: 'test-api-key',
      COINBASE_PRIVATE_KEY: 'test-private-key',
      COINBASE_SMART_WALLET_ACCOUNT_ID: 'test-account-id',
      GLICO_TOKEN_ADDRESS: '0x1234567890abcdef1234567890abcdef12345678'
    };
    process.env.BASE_NETWORK_ID = 'base-sepolia';
    
    // Reset mock implementations
    mockGetDefaultAddress.mockResolvedValue('0x742d35Cc6634C0532925a3b844Bc454e4438f44e');
    mockGetBalance.mockResolvedValue('1000000000000000000');
    mockCreateTransfer.mockResolvedValue({
      wait: mockWait.mockResolvedValue({}),
      getTransactionHash: mockGetTransactionHash.mockResolvedValue('0x123')
    });
    
    // Create a new wallet service instance
    service = new TestableWalletService();
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('Initialization', () => {
    it('should initialize with testnet in test environment', async () => {
      // Reset mocks before test
      jest.clearAllMocks();
      
      // Setup mock for testnet
      mockGetDefaultAddress.mockResolvedValue('0x742d35Cc6634C0532925a3b844Bc454e4438f44e');
      
      // Initialize the service
      await service.testInitialize();
      
      // Verify wallet was created with testnet config
      expect(mockWalletCreate).toHaveBeenCalledWith({
        networkId: 'base-sepolia'
      });
      
      // Verify Coinbase was configured with the correct credentials
      expect(Coinbase.configure).toHaveBeenCalledWith({
        apiKeyName: 'test-api-key',
        privateKey: 'test-private-key',
        useServerSigner: true
      });
      
      // Verify wallet methods were called
      expect(mockGetDefaultAddress).toHaveBeenCalled();
    });

    it('should initialize with mainnet in production', async () => {
      // Reset mocks before test
      jest.clearAllMocks();
      
      // Setup mock for mainnet
      mockGetDefaultAddress.mockResolvedValue('0x742d35Cc6634C0532925a3b844Bc454e4438f44e');
      
      // Create a new instance with production config
      const prodService = new TestableWalletService({
        isProduction: true,
        tokenAddress: 'test-token-address',
        coinbaseApiKey: 'test-api-key',
        coinbasePrivateKey: 'test-private-key'
      });
      await prodService.testInitialize();
      
      expect(mockWalletCreate).toHaveBeenCalledWith({
        networkId: 'base-mainnet'
      });
      
      // Verify Coinbase was configured with the correct credentials
      expect(Coinbase.configure).toHaveBeenCalledWith({
        apiKeyName: 'test-api-key',
        privateKey: 'test-private-key',
        useServerSigner: true
      });
    });
  });

  describe('Token Operations', () => {
    beforeEach(async () => {
      // Initialize the service before each test
      await service.testInitialize();
    });

    it('should get wallet address', async () => {
      mockGetDefaultAddress.mockResolvedValueOnce('0x742d35Cc6634C0532925a3b844Bc454e4438f44e');
      const address = await service.getWalletAddress();
      expect(address).toBe('0x742d35Cc6634C0532925a3b844Bc454e4438f44e');
    });

    it('should get token balance', async () => {
      mockGetBalance.mockResolvedValueOnce('1000000000000000000');
      const balance = await service.getTokenBalance();
      expect(balance).toBe('1000000000000000000');
    });
  });

  describe('Prize Distribution', () => {
    let testableWalletService: TestableWalletService;

    beforeEach(async () => {
      // Create a new instance for prize distribution tests
      testableWalletService = new TestableWalletService();
      await testableWalletService.testInitialize();
    });

    it('should distribute prizes successfully', async () => {
      const payouts = [{
        userAddress: '0x1234567890abcdef1234567890abcdef12345678',
        prizeAmount: '1000000000000000000' // 1.0 token in wei
      }];

      const results = await testableWalletService.distributePrizes(payouts);
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results?.[0].status).toBe('confirmed');
      expect(results?.[0].transactionHash).toBe('0x123');
    });

    it('should handle multiple prize payouts', async () => {
      const payouts = [
        { userAddress: '0x1234567890abcdef1234567890abcdef12345678', prizeAmount: '1000000000000000000' },
        { userAddress: '0xabcdef1234567890abcdef1234567890abcdef12', prizeAmount: '2000000000000000000' }
      ];

      const results = await testableWalletService.distributePrizes(payouts);
      expect(results).toHaveLength(2);
      expect(results?.[0].status).toBe('confirmed');
      expect(results?.[1].status).toBe('confirmed');
    });

    it('should handle transfer failures', async () => {
      // Mock a transfer failure
      const error = new Error('Transfer failed');
      mockCreateTransfer.mockRejectedValueOnce(error);

      const payouts = [{
        userAddress: '0x1234567890abcdef1234567890abcdef12345678',
        prizeAmount: '1000000000000000000'
      }];

      const results = await testableWalletService.distributePrizes(payouts);
      expect(results?.[0].status).toBe('failed');
      expect(results?.[0].error).toContain('Transfer failed');
    });

    it('should return undefined for empty payouts', async () => {
      const results = await testableWalletService.distributePrizes([]);
      expect(results).toBeUndefined();
    });

    it('should return undefined for null or undefined payouts', async () => {
      // @ts-expect-error - Testing invalid input
      const results = await testableWalletService.distributePrizes(null);
      expect(results).toBeUndefined();
    });
  });
});
