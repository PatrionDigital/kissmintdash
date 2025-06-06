import { WalletService, PrizePayout } from './wallet.service';
import fetch from 'node-fetch';
import crypto from 'crypto';

// Mock node-fetch
jest.mock('node-fetch', () => jest.fn());
const { Response } = jest.requireActual('node-fetch');

// Mock crypto
const mockUpdate = jest.fn().mockReturnThis();
const mockDigest = jest.fn();
jest.mock('crypto', () => ({
  ...jest.requireActual('crypto'), // import and retain default behavior
  createHmac: jest.fn(() => ({
    update: mockUpdate,
    digest: mockDigest,
  })),
}));

const mockEnv = {
  CDP_API_KEY_ID: 'test-cdp-api-key-id',
  CDP_API_KEY_SECRET: 'test-cdp-api-key-secret',
  CDP_PAYOUT_ACCOUNT_ID: 'test-payout-account-id',
  CDP_API_V2_BASE_URL: 'https://api.developer.coinbase.com/api/v2',
  NEXT_PUBLIC_TOKEN_ADDRESS: '0xTestTokenAddress',
  CDP_BASE_NETWORK_ID: '8453',
};

describe('WalletService', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    process.env = { ...process.env, ...mockEnv };
    jest.clearAllMocks();
    mockDigest.mockReturnValue('mocked-signature'); // Default mock signature
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('constructor', () => {
    it('should initialize correctly with valid environment variables', () => {
      expect(() => new WalletService()).not.toThrow();
    });

    const requiredEnvVars: (keyof typeof mockEnv)[] = [
      'CDP_API_KEY_ID',
      'CDP_API_KEY_SECRET',
      'CDP_PAYOUT_ACCOUNT_ID',
      'CDP_API_V2_BASE_URL',
      'NEXT_PUBLIC_TOKEN_ADDRESS',
      'CDP_BASE_NETWORK_ID',
    ];

    requiredEnvVars.forEach((key) => {
      it(`should throw an error if ${key} is missing`, () => {
        delete process.env[key];
        expect(() => new WalletService()).toThrow(`Missing required environment variable: ${key}`);
      });
    });
  });

  describe('distributePrizes', () => {
    let walletService: WalletService;
    let mockDateNow: jest.SpyInstance;

    beforeEach(() => {
      walletService = new WalletService();
      // Mock Date.now() for consistent timestamp in signature
      mockDateNow = jest.spyOn(Date, 'now').mockReturnValue(1678886400000); // Example: March 15, 2023 12:00:00 PM UTC
    });

    afterEach(() => {
      mockDateNow.mockRestore();
    });

    const mockPayouts: PrizePayout[] = [
      { userAddress: '0xUser1', prizeAmount: '1000000000000000000' }, // 1 GLICO
      { userAddress: '0xUser2', prizeAmount: '2000000000000000000' }, // 2 GLICO
    ];

    it('should make successful payouts and return success results', async () => {
      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(
        new Response(JSON.stringify({ data: { id: 'tx_hash_123' } }), { status: 200 })
      );

      const results = await walletService.distributePrizes(mockPayouts);

      expect(fetch).toHaveBeenCalledTimes(mockPayouts.length);
      mockPayouts.forEach((payout, index) => {
        const expectedPath = `/v2/accounts/${mockEnv.CDP_PAYOUT_ACCOUNT_ID}/transactions`;
        const expectedTimestamp = '1678886400'; // Math.floor(Date.now() / 1000)
        const expectedBody = JSON.stringify({
          type: 'SEND_TOKEN',
          to: payout.userAddress,
          amount: payout.prizeAmount,
          currency: mockEnv.NEXT_PUBLIC_TOKEN_ADDRESS,
          network_id: mockEnv.CDP_BASE_NETWORK_ID,
          description: 'KissMint Prize Payout',
        });
        const message = expectedTimestamp + 'POST' + expectedPath + expectedBody;

        expect(crypto.createHmac).toHaveBeenCalledWith('sha256', mockEnv.CDP_API_KEY_SECRET);
        expect(mockUpdate).toHaveBeenCalledWith(message);
        expect(mockDigest).toHaveBeenCalledWith('hex');

        expect(fetch).toHaveBeenNthCalledWith(index + 1, 
          `${mockEnv.CDP_API_V2_BASE_URL}${expectedPath}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'CB-ACCESS-KEY': mockEnv.CDP_API_KEY_ID,
              'CB-ACCESS-TIMESTAMP': expectedTimestamp,
              'CB-ACCESS-SIGNATURE': 'mocked-signature',
            },
            body: expectedBody,
          }
        );
      });
      expect(results).toEqual([
        { userAddress: '0xUser1', status: 'SUCCESS', transactionHash: 'tx_hash_123', error: undefined },
        { userAddress: '0xUser2', status: 'SUCCESS', transactionHash: 'tx_hash_123', error: undefined },
      ]);
    });

    it('should handle API errors and return failure results', async () => {
      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce(
        new Response(JSON.stringify({ data: { id: 'tx_hash_success' } }), { status: 200 })
      ).mockResolvedValueOnce(
        new Response(JSON.stringify({ errors: [{ message: 'Insufficient funds' }] }), { status: 400 })
      );

      const results = await walletService.distributePrizes(mockPayouts);

      expect(fetch).toHaveBeenCalledTimes(2);
      expect(results).toEqual([
        { userAddress: '0xUser1', status: 'SUCCESS', transactionHash: 'tx_hash_success', error: undefined },
        { userAddress: '0xUser2', status: 'FAILED', transactionHash: undefined, error: 'API Error: Insufficient funds' },
      ]);
    });

    it('should handle network errors during fetch and return failure results', async () => {
      (fetch as jest.MockedFunction<typeof fetch>).mockRejectedValueOnce(new Error('Network failure'));
      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce(
        new Response(JSON.stringify({ data: { id: 'tx_hash_success_2' } }), { status: 200 })
      );

      const results = await walletService.distributePrizes(mockPayouts);

      expect(fetch).toHaveBeenCalledTimes(2);
      expect(results).toEqual([
        { userAddress: '0xUser1', status: 'FAILED', transactionHash: undefined, error: 'Network failure' },
        { userAddress: '0xUser2', status: 'SUCCESS', transactionHash: 'tx_hash_success_2', error: undefined },
      ]);
    });

    it('should return an empty array if no payouts are provided', async () => {
      const results = await walletService.distributePrizes([]);
      expect(results).toEqual([]);
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should correctly construct the signature message', async () => {
      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(
        new Response(JSON.stringify({ data: { id: 'tx_hash_sig_test' } }), { status: 200 })
      );
      
      const singlePayout: PrizePayout[] = [{ userAddress: '0xUserSig', prizeAmount: '500000000000000000' }];
      await walletService.distributePrizes(singlePayout);

      const expectedPath = `/v2/accounts/${mockEnv.CDP_PAYOUT_ACCOUNT_ID}/transactions`;
      const expectedTimestamp = '1678886400'; 
      const expectedBody = JSON.stringify({
        type: 'SEND_TOKEN',
        to: singlePayout[0].userAddress,
        amount: singlePayout[0].prizeAmount,
        currency: mockEnv.NEXT_PUBLIC_TOKEN_ADDRESS,
        network_id: mockEnv.CDP_BASE_NETWORK_ID,
        description: 'KissMint Prize Payout',
      });
      const expectedMessage = expectedTimestamp + 'POST' + expectedPath + expectedBody;

      expect(mockUpdate).toHaveBeenCalledWith(expectedMessage);
    });

  });
});
