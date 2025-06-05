#!/usr/bin/env tsx
import { walletService } from '../app/services/wallet.service';

async function main() {
  try {
    console.log('Fetching wallet information...');
    
    // Initialize the wallet service
    await walletService.ensureInitialized();
    
    // Get wallet address
    const address = await walletService.getWalletAddress();
    console.log('Wallet Address:', address);
    
    // Get token balance
    const balance = await walletService.getTokenBalance();
    console.log('Token Balance (wei):', balance);
    
    console.log('\nWallet information retrieved successfully!');
  } catch (error) {
    console.error('Error retrieving wallet information:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

main();
