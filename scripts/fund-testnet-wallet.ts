import { Wallet, Coinbase, type WalletAddress } from "@coinbase/coinbase-sdk";
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables from .env.local
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  dotenv.config({ path: envPath });
} catch (error) {
  console.warn('⚠️  Could not load .env.local. Using system environment variables.', error);
}

interface WalletInfo {
  address: string;
  network: string;
  createdAt: string;
  mnemonic?: string;
}

async function fundTestnetWallet() {
  try {
    console.log("🚀 Creating a new testnet wallet...");
    
    // Create a new wallet on Base Sepolia testnet
    const wallet = await Wallet.create({ 
      networkId: Coinbase.networks.BaseSepolia 
    });

    // Get the wallet address
    const addressObj: WalletAddress | undefined = await wallet.getAddress('0'); // Get the first address
    if (!addressObj) {
      throw new Error('Failed to get wallet address');
    }
    const address = addressObj.toString(); // Convert WalletAddress to string
    console.log('✅ Wallet created successfully!');
    console.log(`📬 Wallet Address: ${address}`);

    // Request testnet ETH from the faucet
    console.log("⏳ Requesting testnet ETH from the faucet...");
    // The faucet method can take an optional assetId parameter
    // For Base Sepolia testnet ETH, we don't need to specify an assetId
    await wallet.faucet();
    
    console.log("🎉 Success! Testnet ETH has been requested.");
    console.log("💡 Note: It may take a few minutes for the funds to appear in your wallet.");
    
    // Export wallet data for backup
    const walletData = wallet.export();
    
    // Save wallet info to a file for future reference
    const walletInfo: WalletInfo = {
      address,
      network: 'Base Sepolia Testnet',
      createdAt: new Date().toISOString()
    };
    
    // Add mnemonic if available (depends on the wallet type)
    if (walletData && typeof walletData === 'object' && 'mnemonic' in walletData) {
      walletInfo.mnemonic = String((walletData as { mnemonic: unknown }).mnemonic);
    }
    
    const walletFilePath = path.join(process.cwd(), 'wallet-info.json');
    fs.writeFileSync(walletFilePath, JSON.stringify(walletInfo, null, 2));
    console.log(`\n🔐 Wallet info saved to: ${walletFilePath}`);
    console.log('⚠️  IMPORTANT: Keep this file secure and never commit it to version control!');
    
    // Add to .gitignore if not already present
    const gitignorePath = path.join(process.cwd(), '.gitignore');
    if (fs.existsSync(gitignorePath)) {
      const gitignore = fs.readFileSync(gitignorePath, 'utf8');
      if (!gitignore.includes('wallet-info.json')) {
        fs.appendFileSync(gitignore, '\n# Wallet info\nwallet-info.json\n');
      }
    }
    
    return walletInfo;
  } catch (error) {
    console.error("❌ Error:", error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

// Run the function
fundTestnetWallet();
