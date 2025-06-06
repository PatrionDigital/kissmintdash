import { WalletService } from '../../app/services/wallet.service';

// These tests will only run if RUN_INTEGRATION_TESTS=true
const RUN_TESTS = process.env.RUN_INTEGRATION_TESTS === 'true';

// Use describe.skip or describe.only to control test execution
(RUN_TESTS ? describe : describe.skip)('WalletService Integration Tests', () => {
  let walletService: WalletService;
  // Use a test recipient address - replace with a test wallet you control
  const testRecipient = process.env.TEST_RECIPIENT_ADDRESS || '0x742d35Cc6634C0532925a3b844Bc454e4438f44e';
  
  beforeAll(() => {
    if (!process.env.COINBASE_API_KEY || !process.env.COINBASE_API_SECRET) {
      throw new Error('Missing required environment variables for integration tests');
    }
    walletService = new WalletService();
  });

  it('should initialize and get wallet address', async () => {
    const address = await walletService.getWalletAddress();
    expect(address).toMatch(/^0x[a-fA-F0-9]{40}$/);
    console.log('Wallet address:', address);
  });

  it('should get token balance', async () => {
    const balance = await walletService.getTokenBalance();
    expect(Number(balance)).toBeGreaterThanOrEqual(0);
    console.log('Token balance:', balance);
  });

  // Note: Only run this with test tokens to avoid real funds
  it('should distribute test prize', async () => {
    // Skip if no test recipient is set
    if (!process.env.TEST_RECIPIENT_ADDRESS) {
      console.warn('Skipping transfer test: No TEST_RECIPIENT_ADDRESS set');
      return;
    }

    const testAmount = '1000000000000000'; // 0.001 tokens (assuming 18 decimals)
    
    console.log(`Sending ${testAmount} tokens to ${testRecipient}`);
    
    const results = await walletService.distributePrizes([
      { userAddress: testRecipient, prizeAmount: testAmount }
    ]);
    
    if (!results || results.length === 0) {
      throw new Error('No results returned from distributePrizes');
    }
    
    console.log('Transfer result:', results[0]);
    
    expect(results[0].status).toBe('success');
    expect(results[0].transactionHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
  }, 60000); // 60s timeout for blockchain operations
});
