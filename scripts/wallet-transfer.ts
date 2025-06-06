#!/usr/bin/env tsx
import { walletService } from '../app/services/wallet.service';

interface Args {
  to: string;
  amount: string;
}

async function main() {
  const args = parseArgs();
  
  try {
    console.log(`Preparing to transfer ${args.amount} tokens to ${args.to}...`);
    
    // Initialize the wallet service
    await walletService.ensureInitialized();
    
    // Execute the transfer
    const result = await walletService.distributePrizes([
      { userAddress: args.to, prizeAmount: args.amount }
    ]);
    
    if (!result || result.length === 0) {
      throw new Error('No transfer result received');
    }
    
    const txHash = result[0].transactionHash;
    const status = result[0].status;
    
    console.log('\nTransfer initiated successfully!');
    console.log('Transaction Hash:', txHash);
    console.log('Status:', status);
    
    // Check transaction status
    if (txHash) {
      console.log('\nChecking transaction status...');
      const txStatus = await walletService.getTransactionStatus(txHash);
      console.log('Transaction Status:', txStatus);
    }
    
  } catch (error) {
    console.error('Error during transfer:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

function parseArgs(): Args {
  const args = process.argv.slice(2);
  
  if (args.length !== 2) {
    console.error('Usage: pnpm wallet:transfer <to-address> <amount-in-wei>');
    process.exit(1);
  }
  
  const [to, amount] = args;
  
  // Basic validation
  if (!to.startsWith('0x') || to.length !== 42) {
    console.error('Error: Invalid recipient address');
    process.exit(1);
  }
  
  if (isNaN(Number(amount))) {
    console.error('Error: Amount must be a number');
    process.exit(1);
  }
  
  return { to, amount };
}

main();
