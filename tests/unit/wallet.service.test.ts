import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  beforeAll,
  afterAll,
} from "vitest";
import { WalletService } from "../../app/services/wallet.service";
import { mockPublicClient, resetViemMocks } from "../../tests/__mocks__/viem";

// Define the PrizePayout type locally since we're having import issues
type PrizePayout = {
  userAddress: string;
  prizeAmount: string;
  userId?: string | number;
};

// Mock the Coinbase CDP SDK
vi.mock("@coinbase/cdp-sdk", async () => {
  const _mockAccount = {
    address: "0x1234567890123456789012345678901234567890",
    transfer: vi
      .fn()
      .mockImplementation(
        ({ to: _to, amount: _amount, token: _token, network: _network }) => {
          return Promise.resolve({
            transactionHash:
              "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abc123",
          });
        },
      ),
    getBalance: vi.fn().mockResolvedValue(BigInt("1000000000000000000000")), // 1000 tokens with 18 decimals
  };

  const _mockClient = {
    evm: {
      listAccounts: vi.fn().mockResolvedValue({
        accounts: [_mockAccount],
      }),
    },
  };

  return {
    CdpClient: vi.fn().mockImplementation(() => _mockClient),
    // Alias the mock exports for backward compatibility
    mockAccount: _mockAccount,
    mockClient: _mockClient,
    // Also export with original names for internal use
    _mockAccount,
    _mockClient,
  };
});

// Import the mocks after setting them up
const getMocks = async () => {
  return await import("../../tests/__mocks__/@coinbase/cdp-sdk");
};

describe("WalletService", () => {
  let walletService: WalletService;
  let originalEnv: NodeJS.ProcessEnv;

  beforeAll(() => {
    // Store original env vars
    originalEnv = { ...process.env };

    // Mock environment variables
    process.env.NEXT_PUBLIC_TOKEN_ADDRESS =
      "0x1234567890123456789012345678901234567890";
    process.env.CDP_PAYOUT_ACCOUNT_ID = "test-account-id";
    process.env.CDP_BASE_NETWORK_ID = "base-mainnet";
    process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY = "test-api-key";
  });

  afterAll(() => {
    // Restore original env vars
    process.env = originalEnv;
  });

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
    resetViemMocks();

    // Reset the singleton instance
    // @ts-expect-error - Accessing private static property for testing
    WalletService.instance = undefined;

    // Create a new instance for each test
    walletService = WalletService.getInstance();
  });

  describe("distributePrizes", () => {
    it("should successfully distribute prizes to multiple users", async () => {
      // Get the mocks
      const { _mockAccount } = await getMocks();

      // Set up test data
      const prizePayouts: PrizePayout[] = [
        {
          userAddress: "0x1234567890123456789012345678901234567891",
          prizeAmount: "100",
          userId: "user1",
        },
        {
          userAddress: "0x1234567890123456789012345678901234567892",
          prizeAmount: "200",
          userId: "user2",
        },
      ];

      // Configure the mock transfer to return a transaction hash
      (_mockAccount.transfer as ReturnType<typeof vi.fn>).mockImplementation(
        async ({
          to: _to,
          amount: _amount,
          token: _token,
          network: _network,
        }) => {
          return {
            transactionHash: `0x${Math.random().toString(16).substring(2, 66)}`,
          };
        },
      );

      // Mock the public client to return a successful receipt
      mockPublicClient.waitForTransactionReceipt.mockResolvedValue({
        status: "success",
        transactionHash:
          "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abc123",
        blockNumber: 1n,
        blockHash:
          "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abc456",
        transactionIndex: 0,
        from: "0x1234567890123456789012345678901234567890",
        to: "0x1234567890123456789012345678901234567891",
        cumulativeGasUsed: 21000n,
        gasUsed: 21000n,
        effectiveGasPrice: 1000000000n,
        contractAddress: null,
        logs: [],
        logsBloom: `0x${"0".repeat(512)}` as `0x${string}`, // Explicitly type as hex string
        type: "0x2",
      });

      // Execute the test
      const results = await walletService.distributePrizes(prizePayouts, {
        waitForConfirmation: true,
        confirmations: 1,
      });

      // Assert the results
      expect(results).toHaveLength(2);
      expect(results[0].status).toBe("confirmed");
      expect(results[0].transactionHash).toBeDefined();
      expect(results[1].status).toBe("confirmed");
      expect(results[1].transactionHash).toBeDefined();

      // Verify the transfer was called with the correct parameters
      expect(_mockAccount.transfer).toHaveBeenCalledTimes(2);
      expect(_mockAccount.transfer).toHaveBeenCalledWith({
        to: "0x1234567890123456789012345678901234567891",
        amount: expect.any(BigInt),
        token: "0x1234567890123456789012345678901234567890",
        network: "base-mainnet",
      });
    });

    it("should handle transfer failures", async () => {
      // Get the mocks
      const { _mockAccount } = await getMocks();

      // Set up test data
      const prizePayouts: PrizePayout[] = [
        {
          userAddress: "0x1234567890123456789012345678901234567891",
          prizeAmount: "100",
          userId: "user1",
        },
      ];

      // Configure the mock transfer to throw an error
      (_mockAccount.transfer as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error("Transfer failed"),
      );

      // Execute the test
      const results = await walletService.distributePrizes(prizePayouts);

      // Assert the results
      expect(results).toHaveLength(1);
      expect(results[0].status).toBe("failed");
      expect(results[0].error).toContain("Transfer failed");
    });
  });

  describe("getPayoutAccountBalance", () => {
    it("should return the account balance", async () => {
      // Get the mocks
      const { _mockAccount } = await getMocks();

      // Configure the mock balance
      (_mockAccount.getBalance as ReturnType<typeof vi.fn>).mockResolvedValue(
        BigInt("1000000000000000000"),
      ); // 1 token with 18 decimals

      // Execute the test
      const balance = await walletService.getPayoutAccountBalance();

      // Assert the results
      expect(balance).toEqual({
        address: "0x1234567890123456789012345678901234567890",
        balance: BigInt("1000000000000000000"),
        formatted: "1",
      });

      // Verify the getBalance was called with the correct parameters
      expect(_mockAccount.getBalance).toHaveBeenCalledWith({
        token: "0x1234567890123456789012345678901234567890",
        network: "base-mainnet",
      });
    });
  });

  describe("error handling", () => {
    it("should handle CDP client initialization errors", async () => {
      // Get the mocks
      const { CdpClient } = await import(
        "../../tests/__mocks__/@coinbase/cdp-sdk"
      );

      // Mock the CDP client to throw an error
      CdpClient.mockImplementationOnce(() => {
        throw new Error("Failed to initialize CDP client");
      });

      // Reset the singleton instance
      // @ts-expect-error - Accessing private static property for testing
      WalletService.instance = undefined;

      // Execute the test and expect an error
      await expect(() => WalletService.getInstance()).toThrow(
        "Failed to initialize CDP client",
      );
    });
  });
});
