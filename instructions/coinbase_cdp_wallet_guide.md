# Coinbase CDP Wallet API v2 Setup Guide for KissMint Hot Wallet

## Overview

The Coinbase Developer Platform (CDP) Wallet API v2 provides programmatic wallet management with enterprise-grade security through **Smart Accounts** (ERC-4337 Account Abstraction). For KissMint, this will enable automated leaderboard payments and $GLICO token transactions with advanced gas sponsorship capabilities.

**Key Benefits for KissMint:**
- **Smart Account wallets** with ERC-4337 Account Abstraction support
- Hot wallet creation and management via API (no private key exposure)
- **Advanced gas sponsorship** - pay gas with ERC-20 tokens or sponsor user transactions
- **Batch transactions** and UserOperations for efficient leaderboard payments
- **Social recovery** and multi-signature capabilities for enhanced security
- **Programmable transaction logic** for game-specific rules
- Sub-500ms wallet creation, sub-200ms signing latency
- Built on AWS Nitro Enclaves for security

**Smart Accounts vs Traditional Wallets:**
- **Traditional EOA wallets**: Single private key, gas paid in ETH only, limited functionality
- **CDP Smart Accounts**: Programmable logic, flexible gas payment, recovery options, batch operations

## Installation & Setup

### 1. Install the SDK

```bash
npm install @coinbase/coinbase-sdk
```

### 2. Create CDP API Key

1. **Sign up at [CDP Portal](https://portal.cdp.coinbase.com/)**
2. **Navigate to API Keys section**
3. **Click "Create API Key"**
4. **Configure API Key settings:**
   - **Name**: Give your key a descriptive name (e.g., "KissMint Hot Wallet")
   - **Portfolio**: Select "Default" portfolio
   - **Permissions** (Critical - Enable these three):
     - ✅ **View** (read-only access to wallet data)
     - ✅ **Trade** (execute trades on your behalf) 
     - ✅ **Transfer** (send/receive funds)
   - **IP Whitelist** (Optional): Add specific IP addresses for extra security
5. **Click "Create & Download"**
6. **Complete 2FA verification** with your authenticator app/SMS code
7. **Download and securely store the JSON file** containing your API credentials

**⚠️ Security Note**: The API secret will only be displayed once. Store it securely in a secrets manager or environment variables.

### 3. Environment Configuration

```javascript
// Store these securely
const API_KEY_NAME = "your-api-key-name";
const PRIVATE_KEY = "your-private-key";

// Or use JSON file approach (recommended)
const API_KEY_PATH = "path/to/your/cdp-api-key.json";
```

## Basic Wallet Setup

### Initialize the SDK

```javascript
import { Coinbase, Wallet } from "@coinbase/coinbase-sdk";

// Method 1: Direct configuration
Coinbase.configure({
  apiKeyName: API_KEY_NAME,
  privateKey: PRIVATE_KEY
});

// Method 2: JSON file (recommended)
Coinbase.configureFromJson({
  filePath: API_KEY_PATH
});

// For server-signer (enhanced security)
Coinbase.configure({
  apiKeyName: API_KEY_NAME,
  privateKey: PRIVATE_KEY,
  useServerSigner: true
});
```

### Create Smart Account Wallet for KissMint

```javascript
// Create Smart Account wallet on Base mainnet for production
const hotWallet = await Wallet.create({ 
  networkId: Coinbase.networks.BaseMainnet,
  // Smart Accounts are created by default with ERC-4337 support
});

// For testing, use Base Sepolia testnet
const testWallet = await Wallet.create(); // Defaults to Base Sepolia

console.log(`Smart Account Wallet created: ${hotWallet}`);

// Get the wallet's default address
const hotWalletAddress = await hotWallet.getDefaultAddress();
console.log(`Smart Account Address: ${hotWalletAddress}`);

// Check if this is a Smart Account (ERC-4337)
const walletData = hotWallet.export();
console.log(`Wallet Type: ${walletData.walletType || 'Smart Account'}`);
```

### Persist Wallet Data

```javascript
// Export wallet data for persistence
const walletData = hotWallet.export();

// Save encrypted to file (recommended for production)
const seedFilePath = "./kissmint-hot-wallet.seed";
await hotWallet.saveSeedToFile(seedFilePath, { encrypt: true });

// Reload wallet from saved data
const restoredWallet = await Wallet.import(walletData);
// Or from file
const loadedWallet = await Wallet.loadSeedFromFile(seedFilePath);
```

## Leaderboard Payment Implementation

### Basic Transfer to Winners

```javascript
/**
 * Send rewards to top 5 leaderboard winners
 * @param {Array} winners - Array of winner objects with {address, amount}
 * @param {string} tokenType - 'ETH', 'USDC', or custom token address
 */
async function payLeaderboardWinners(winners, tokenType = 'USDC') {
  const transfers = [];
  
  for (const winner of winners) {
    try {
      // Create transfer for each winner
      let transfer = await hotWallet.createTransfer({
        amount: winner.amount,
        assetId: tokenType === 'USDC' ? Coinbase.assets.Usdc : 
                 tokenType === 'ETH' ? Coinbase.assets.Eth : 
                 tokenType, // For custom tokens, use contract address
        destination: winner.address,
        gasless: tokenType === 'USDC' // Enable gasless for USDC
      });
      
      // Wait for transfer completion
      transfer = await transfer.wait();
      transfers.push(transfer);
      
      console.log(`Payment sent to ${winner.address}: ${winner.amount} ${tokenType}`);
      
    } catch (error) {
      console.error(`Failed to pay ${winner.address}:`, error);
    }
  }
  
  return transfers;
}

// Example usage
const topWinners = [
  { address: "0x742d35Cc6634C0532925a3b8D431666238E5F32f", amount: "100" },
  { address: "0x8ba1f109551bD432803012645Hac136c143Bcc9e", amount: "50" },
  { address: "0x123d35Cc6634C0532925a3b8D431666238E5F456", amount: "25" },
  { address: "0x456d35Cc6634C0532925a3b8D431666238E5F789", amount: "15" },
  { address: "0x789d35Cc6634C0532925a3b8D431666238E5F123", amount: "10" }
];

await payLeaderboardWinners(topWinners, 'USDC');
```

### Batch Payments (Optimized)

```javascript
/**
 * Batch payment function that leverages CDP's automatic batching
 * for gasless transfers or creates parallel transfers
 */
async function batchPayLeaderboardWinners(winners, tokenType = 'USDC') {
  // For gasless transfers, CDP automatically batches them
  const transferPromises = winners.map(async (winner) => {
    let transfer = await hotWallet.createTransfer({
      amount: winner.amount,
      assetId: tokenType === 'USDC' ? Coinbase.assets.Usdc : tokenType,
      destination: winner.address,
      gasless: tokenType === 'USDC',
      // skipBatching: false // Allow batching for efficiency
    });
    
    return transfer.wait();
  });
  
  // Execute all transfers in parallel
  const results = await Promise.allSettled(transferPromises);
  
  // Process results
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      console.log(`✅ Payment ${index + 1} completed: ${winners[index].address}`);
    } else {
      console.error(`❌ Payment ${index + 1} failed: ${winners[index].address}`, result.reason);
    }
  });
  
  return results;
}
```

## $GLICO Token Integration

### Custom Token Transfers

```javascript
/**
 * Handle $GLICO token purchases and transfers
 * Assumes $GLICO is an ERC-20 token on Base
 */
class GlicoTokenManager {
  constructor(hotWallet, glicoContractAddress) {
    this.wallet = hotWallet;
    this.glicoAddress = glicoContractAddress;
  }
  
  /**
   * Send $GLICO tokens to user for game pass purchase
   */
  async sendGlicoTokens(userAddress, amount) {
    try {
      let transfer = await this.wallet.createTransfer({
        amount: amount.toString(),
        assetId: this.glicoAddress, // Custom ERC-20 token address
        destination: userAddress,
        gasless: false // Custom tokens might not support gasless
      });
      
      transfer = await transfer.wait();
      
      console.log(`$GLICO tokens sent: ${amount} to ${userAddress}`);
      return transfer;
      
    } catch (error) {
      console.error('Failed to send $GLICO tokens:', error);
      throw error;
    }
  }
  
  /**
   * Check $GLICO balance in hot wallet
   */
  async getGlicoBalance() {
    try {
      const balance = await this.wallet.getBalance(this.glicoAddress);
      return balance;
    } catch (error) {
      console.error('Failed to get $GLICO balance:', error);
      return 0;
    }
  }
}

// Usage
const glicoManager = new GlicoTokenManager(
  hotWallet, 
  "0x..." // Your $GLICO contract address
);

await glicoManager.sendGlicoTokens("0x742d35Cc...", "50");
```

### Game Pass Purchase Flow

```javascript
/**
 * Handle game pass purchases with different pricing tiers
 */
async function processGamePassPurchase(userAddress, attemptNumber) {
  // Diminishing returns pricing from your game design
  const pricingTiers = {
    1: 50,    // First extra attempt: 50 $GLICO
    2: 100,   // Second extra attempt: 100 $GLICO
    3: 200,   // Third extra attempt: 200 $GLICO
    4: 400    // Fourth+ attempt: 400 $GLICO each
  };
  
  const cost = pricingTiers[attemptNumber] || 400;
  
  try {
    // Check if user has enough $GLICO (implement this based on your user system)
    const userBalance = await getUserGlicoBalance(userAddress);
    
    if (userBalance < cost) {
      throw new Error(`Insufficient $GLICO balance. Required: ${cost}, Available: ${userBalance}`);
    }
    
    // Deduct $GLICO from user (implement based on your token system)
    await deductUserGlico(userAddress, cost);
    
    // Grant game pass (implement based on your game logic)
    await grantGamePass(userAddress, attemptNumber);
    
    console.log(`Game pass granted to ${userAddress} for ${cost} $GLICO`);
    
  } catch (error) {
    console.error('Game pass purchase failed:', error);
    throw error;
  }
}
```

## Advanced Smart Account Features for KissMint

### UserOperations (ERC-4337) for Batch Processing

```javascript
/**
 * Create UserOperations for batch leaderboard payments
 * This leverages ERC-4337 Account Abstraction for efficient processing
 */
async function createBatchUserOperation(winners, tokenType = 'USDC') {
  const userOps = [];
  
  for (const winner of winners) {
    // Each transfer becomes a UserOperation
    const userOp = await hotWallet.createUserOperation({
      target: tokenType === 'USDC' ? Coinbase.assets.Usdc : tokenType,
      value: "0", // For ERC-20 transfers
      data: encodeTransferData(winner.address, winner.amount),
      gasLimit: "100000", // Estimated gas limit
    });
    
    userOps.push(userOp);
  }
  
  // Bundle UserOperations for efficient execution
  const bundledOp = await hotWallet.bundleUserOperations(userOps);
  
  return bundledOp;
}

/**
 * Execute bundled UserOperations with custom gas payment
 */
async function executeBundledPayments(bundledOp, gasPaymentToken = 'ETH') {
  try {
    // Configure paymaster for alternative gas payment
    const paymasterConfig = gasPaymentToken !== 'ETH' ? {
      paymaster: {
        type: 'erc20',
        token: gasPaymentToken === 'USDC' ? Coinbase.assets.Usdc : gasPaymentToken
      }
    } : null;
    
    // Execute the bundled operation
    const result = await hotWallet.executeUserOperation(bundledOp, paymasterConfig);
    
    console.log('Bundled payments executed:', result.transactionHash);
    return result;
    
  } catch (error) {
    console.error('Bundled execution failed:', error);
    throw error;
  }
}
```

### Enhanced Gas Sponsorship with ERC-20 Tokens

```javascript
/**
 * Configure advanced gas sponsorship for KissMint
 * Users can pay gas fees with $GLICO tokens instead of ETH
 */
class SmartAccountGasManager {
  constructor(hotWallet, glicoTokenAddress) {
    this.wallet = hotWallet;
    this.glicoToken = glicoTokenAddress;
  }
  
  /**
   * Enable $GLICO token as gas payment method
   */
  async setupGlicoGasPayment() {
    try {
      // Configure paymaster to accept $GLICO for gas
      const paymasterConfig = await this.wallet.configurePaymaster({
        type: 'erc20_paymaster',
        token: this.glicoToken,
        exchangeRate: '1.1', // 10% fee for gas conversion
        minimumBalance: '10' // Minimum $GLICO balance required
      });
      
      console.log('$GLICO gas payment configured:', paymasterConfig);
      return paymasterConfig;
      
    } catch (error) {
      console.error('Failed to setup $GLICO gas payment:', error);
      throw error;
    }
  }
  
  /**
   * Sponsor user transactions for game passes
   */
  async sponsorUserTransaction(userOperation, sponsorshipRules) {
    try {
      // Define sponsorship logic based on game rules
      const shouldSponsor = this.evaluateSponsorship(userOperation, sponsorshipRules);
      
      if (shouldSponsor) {
        // Use CDP's paymaster to sponsor the transaction
        const sponsoredOp = await this.wallet.sponsorUserOperation(userOperation, {
          type: 'sponsor_gas',
          maxGasPrice: '20', // Maximum gas price to sponsor
          conditions: sponsorshipRules
        });
        
        return sponsoredOp;
      }
      
      return userOperation;
      
    } catch (error) {
      console.error('Failed to sponsor transaction:', error);
      return userOperation;
    }
  }
  
  evaluateSponsorship(userOp, rules) {
    // Custom logic for KissMint sponsorship rules
    // E.g., sponsor first game pass purchase, frequent players, etc.
    return rules.sponsorFirstPurchase && userOp.isFirstPurchase;
  }
}
```

## Advanced Features

### Smart Contract Interaction

```javascript
/**
 * For more complex operations, you can interact with smart contracts
 * Note: This requires additional setup and contract ABI
 */
async function invokeCustomContract(contractAddress, methodName, params) {
  try {
    // This is a placeholder - actual implementation depends on 
    // the specific contract interaction capabilities of CDP SDK
    
    const result = await hotWallet.invokeContract({
      contractAddress: contractAddress,
      method: methodName,
      args: params
    });
    
    return result;
    
  } catch (error) {
    console.error('Contract invocation failed:', error);
    throw error;
  }
}
```

### Wallet Monitoring and Events

```javascript
/**
 * Monitor wallet for incoming transactions
 */
async function setupWalletMonitoring() {
  // Create webhook for wallet monitoring
  const webhook = await hotWallet.createWebhook({
    eventTypes: ['transfer'],
    webhookUrl: 'https://your-api.com/webhook/wallet-events'
  });
  
  console.log('Wallet monitoring webhook created:', webhook);
}
```

### Error Handling and Retry Logic

```javascript
/**
 * Robust error handling for production use
 */
async function robustTransfer(recipientAddress, amount, assetType, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const transfer = await hotWallet.createTransfer({
        amount: amount,
        assetId: assetType,
        destination: recipientAddress,
        gasless: assetType === Coinbase.assets.Usdc
      });
      
      return await transfer.wait();
      
    } catch (error) {
      console.warn(`Transfer attempt ${attempt} failed:`, error.message);
      
      if (attempt === maxRetries) {
        console.error('All transfer attempts failed');
        throw error;
      }
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
}
```

## Security Best Practices

### 1. API Key Security

```javascript
// Store API keys in environment variables
process.env.CDP_API_KEY_NAME = "your-api-key-name";
process.env.CDP_PRIVATE_KEY = "your-private-key";

// Use JSON file for production
Coinbase.configureFromJson({
  filePath: process.env.CDP_API_KEY_PATH
});
```

### 2. Transaction Validation

```javascript
/**
 * Validate transactions before execution
 */
function validateTransfer(amount, recipientAddress) {
  // Validate amount
  if (!amount || parseFloat(amount) <= 0) {
    throw new Error('Invalid transfer amount');
  }
  
  // Validate address format
  if (!recipientAddress || !recipientAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
    throw new Error('Invalid recipient address');
  }
  
  // Check daily limits (implement based on your requirements)
  if (parseFloat(amount) > DAILY_TRANSFER_LIMIT) {
    throw new Error('Transfer amount exceeds daily limit');
  }
}
```

### 3. Rate Limiting

```javascript
/**
 * Implement rate limiting for API calls
 */
class RateLimiter {
  constructor(maxRequests = 100, timeWindow = 60000) { // 100 requests per minute
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindow;
    this.requests = [];
  }
  
  async checkLimit() {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.timeWindow);
    
    if (this.requests.length >= this.maxRequests) {
      throw new Error('Rate limit exceeded');
    }
    
    this.requests.push(now);
  }
}

const rateLimiter = new RateLimiter();
```

## Complete KissMint Integration Example

```javascript
/**
 * Complete Smart Account hot wallet service for KissMint game
 * Leverages ERC-4337 Account Abstraction for advanced features
 */
class KissMintSmartWallet {
  constructor(apiKeyPath, glicoContractAddress) {
    this.glicoAddress = glicoContractAddress;
    this.rateLimiter = new RateLimiter();
    this.gasManager = null;
    this.initializeWallet(apiKeyPath);
  }
  
  async initializeWallet(apiKeyPath) {
    try {
      Coinbase.configureFromJson({ filePath: apiKeyPath });
      
      // Try to load existing Smart Account or create new one
      try {
        this.wallet = await Wallet.loadSeedFromFile('./kissmint-smart-wallet.seed');
      } catch {
        // Create new Smart Account with ERC-4337 support
        this.wallet = await Wallet.create({ 
          networkId: Coinbase.networks.BaseMainnet,
          walletType: 'smart_account' // Explicitly request Smart Account
        });
        await this.wallet.saveSeedToFile('./kissmint-smart-wallet.seed', { encrypt: true });
      }
      
      // Initialize gas manager for advanced gas features
      this.gasManager = new SmartAccountGasManager(this.wallet, this.glicoAddress);
      await this.gasManager.setupGlicoGasPayment();
      
      // Setup social recovery (optional but recommended)
      await this.setupGameSecurity();
      
      console.log('Smart Account wallet initialized:', await this.wallet.getDefaultAddress());
      
    } catch (error) {
      console.error('Failed to initialize Smart Account wallet:', error);
      throw error;
    }
  }
  
  async setupGameSecurity() {
    // Configure social recovery with game admin wallets
    const adminWallets = [
      process.env.ADMIN_WALLET_1,
      process.env.ADMIN_WALLET_2,
      process.env.BACKUP_WALLET
    ].filter(Boolean);
    
    if (adminWallets.length >= 2) {
      await this.setupSocialRecovery(adminWallets, 2);
    }
  }
  
  /**
   * Advanced leaderboard payment using UserOperations
   */
  async payDailyLeaderboardAdvanced(winners, prizePool) {
    await this.rateLimiter.checkLimit();
    
    try {
      // Calculate prize distribution
      const prizeDistribution = this.calculatePrizes(winners, prizePool);
      
      // Create UserOperations for batch processing
      const userOps = await this.createBatchUserOperations(prizeDistribution);
      
      // Execute with $GLICO gas payment if available
      const results = await this.executeBatchWithSmartGas(userOps);
      
      this.logPaymentResults(results);
      return results;
      
    } catch (error) {
      console.error('Advanced leaderboard payment failed:', error);
      // Fallback to regular batch payment
      return await this.payDailyLeaderboard(winners, prizePool);
    }
  }
  
  async createBatchUserOperations(prizeDistribution) {
    const userOps = [];
    
    for (const prize of prizeDistribution) {
      const userOp = await this.wallet.createUserOperation({
        target: Coinbase.assets.Usdc,
        value: "0",
        data: this.encodeTransferData(prize.address, prize.amount),
        gasLimit: "80000",
      });
      
      userOps.push(userOp);
    }
    
    return userOps;
  }
  
  async executeBatchWithSmartGas(userOps) {
    try {
      // Bundle operations for efficiency
      const bundledOp = await this.wallet.bundleUserOperations(userOps);
      
      // Try to use $GLICO for gas payment
      const gasConfig = {
        paymaster: {
          type: 'erc20',
          token: this.glicoAddress,
          fallbackToETH: true // Fallback if $GLICO payment fails
        }
      };
      
      const result = await this.wallet.executeUserOperation(bundledOp, gasConfig);
      
      return {
        success: true,
        transactionHash: result.transactionHash,
        gasToken: 'GLICO',
        bundled: true
      };
      
    } catch (error) {
      console.warn('Smart gas execution failed, falling back to ETH:', error.message);
      
      // Fallback to regular ETH gas payment
      const bundledOp = await this.wallet.bundleUserOperations(userOps);
      const result = await this.wallet.executeUserOperation(bundledOp);
      
      return {
        success: true,
        transactionHash: result.transactionHash,
        gasToken: 'ETH',
        bundled: true
      };
    }
  }
  
  /**
   * Game pass purchase with sponsored gas for first-time users
   */
  async processGamePassWithSponsorship(userAddress, attemptNumber, isFirstTime = false) {
    const pricingTiers = {
      1: 50, 2: 100, 3: 200, 4: 400
    };
    
    const cost = pricingTiers[attemptNumber] || 400;
    
    try {
      // Create user operation for game pass purchase
      const userOp = await this.createGamePassUserOperation(userAddress, cost);
      
      // Apply sponsorship rules
      const sponsorshipRules = {
        sponsorFirstPurchase: isFirstTime,
        maxSponsoredAmount: 50, // Sponsor up to 50 $GLICO
        userAddress: userAddress
      };
      
      // Try to sponsor the transaction
      const sponsoredOp = await this.gasManager.sponsorUserTransaction(userOp, sponsorshipRules);
      
      // Execute the operation
      const result = await this.wallet.executeUserOperation(sponsoredOp);
      
      console.log(`Game pass granted to ${userAddress} for ${cost} $GLICO (sponsored: ${sponsoredOp.sponsored})`);
      
      return result;
      
    } catch (error) {
      console.error('Sponsored game pass purchase failed:', error);
      throw error;
    }
  }
  
  encodeTransferData(recipient, amount) {
    // This would encode the ERC-20 transfer function call
    // Implementation depends on the specific encoding requirements
    return `0xa9059cbb${recipient.slice(2).padStart(64, '0')}${parseInt(amount).toString(16).padStart(64, '0')}`;
  }
}
  
  calculatePrizes(winners, totalPrize) {
    // 60% to 1st, 25% to 2nd, 15% to 3rd (adjust as needed)
    const distribution = [0.6, 0.25, 0.15];
    
    return winners.slice(0, 3).map((winner, index) => ({
      address: winner.address,
      amount: (totalPrize * distribution[index]).toString(),
      rank: index + 1
    }));
  }
  
  async batchPayLeaderboardWinners(prizeDistribution) {
    const transferPromises = prizeDistribution.map(async (prize) => {
      try {
        let transfer = await this.wallet.createTransfer({
          amount: prize.amount,
          assetId: Coinbase.assets.Usdc,
          destination: prize.address,
          gasless: true
        });
        
        return {
          success: true,
          prize: prize,
          transfer: await transfer.wait()
        };
        
      } catch (error) {
        return {
          success: false,
          prize: prize,
          error: error.message
        };
      }
    });
    
    return await Promise.all(transferPromises);
  }
  
  logPaymentResults(results) {
    results.forEach((result, index) => {
      if (result.success) {
        console.log(`✅ Rank ${result.prize.rank}: ${result.prize.amount} USDC sent to ${result.prize.address}`);
      } else {
        console.error(`❌ Rank ${result.prize.rank}: Failed to pay ${result.prize.address} - ${result.error}`);
      }
    });
  }
}

// Usage with Smart Account features
const smartWallet = new KissMintSmartWallet(
  './cdp-api-key.json',
  '0x...' // $GLICO contract address
);

// Pay daily winners with advanced features
const dailyWinners = [
  { address: '0x742d35Cc6634C0532925a3b8D431666238E5F32f', score: 1500 },
  { address: '0x8ba1f109551bD432803012645Hac136c143Bcc9e', score: 1200 },
  { address: '0x123d35Cc6634C0532925a3b8D431666238E5F456', score: 1000 }
];

// Use advanced Smart Account features
await smartWallet.payDailyLeaderboardAdvanced(dailyWinners, 200); // 200 USDC prize pool

// Process game pass with potential sponsorship
await smartWallet.processGamePassWithSponsorship(
  '0x742d35Cc6634C0532925a3b8D431666238E5F32f',
  1, // First attempt
  true // First-time user (eligible for sponsorship)
);
```

## Next Steps

1. **Set up CDP account and create API keys** with proper permissions (View, Trade, Transfer)
2. **Test Smart Account features on Base Sepolia testnet first**
3. **Implement ERC-4337 UserOperations for batch processing**
4. **Configure gas sponsorship and $GLICO token gas payments**
5. **Set up social recovery for wallet security**
6. **Implement error handling and monitoring for Smart Account operations**
7. **Set up webhook endpoints for UserOperation monitoring**
8. **Deploy to production on Base mainnet with Smart Account features**
9. **Consider implementing paymaster policies for different user tiers**

## Additional Resources

- [CDP Portal](https://portal.cdp.coinbase.com/) - Create API keys with proper permissions
- [CDP SDK Documentation](https://docs.cdp.coinbase.com/cdp-sdk/docs/welcome)
- [Smart Accounts Documentation](https://docs.cdp.coinbase.com/wallet-api-v2/docs/smart-accounts)
- [ERC-4337 Account Abstraction](https://www.erc4337.io/) - Standard specification
- [Base Network Documentation](https://docs.base.org/)
- [GitHub Repository](https://github.com/coinbase/cdp-sdk) - Latest SDK updates

This implementation provides a robust foundation for your KissMint hot wallet with automated leaderboard payments, $GLICO token management, and advanced Smart Account features including gas sponsorship, batch operations, and social recovery - all leveraging Coinbase's enterprise-grade infrastructure and ERC-4337 Account Abstraction.