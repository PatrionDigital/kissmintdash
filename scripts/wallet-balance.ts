#!/usr/bin/env tsx
import { walletService } from '../app/services/wallet.service';

async function main() {
  try {
    console.log('Fetching wallet balance...');
    
    // Initialize the wallet service
    await walletService.ensureInitialized();
    
    // Get wallet address
    const address = await walletService.getWalletAddress();
    
    // Get token balance in wei
    const balanceWei = await walletService.getTokenBalance();
    // Convert to ETH (assuming 18 decimals)
    const balanceEth = (parseInt(balanceWei) / 1e18).toFixed(4);
    
    console.log('\nWallet Information:');
    console.log('------------------');
    console.log(`Address: ${address}`);
    console.log(`Balance: ${balanceWei} wei (${balanceEth} tokens)`);
    
  } catch (error) {
    console.error('Error fetching wallet balance:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

main();
