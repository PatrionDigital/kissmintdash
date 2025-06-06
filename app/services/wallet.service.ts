import { CdpClient } from '@coinbase/cdp-sdk'; // EvmAccount is not an exported member

import { PrizePayout, TransferResult } from '@/app/types/wallet.types';
import { parseUnits } from 'viem';

// Assuming 18 decimals for GLICO token, adjust if different
const GLICO_TOKEN_DECIMALS = 18;

export class WalletService {
  private cdpClient: CdpClient;
  private payoutAccountId: string;
  private tokenAddress: string;
  private baseNetworkId: string;

  constructor() {
    // These environment variables are critical and must be set for CDP SDK.
    // CDP_API_KEY_ID, CDP_API_KEY_SECRET, CDP_WALLET_SECRET are read by CdpClient constructor.
    this.payoutAccountId = process.env.CDP_PAYOUT_ACCOUNT_ID || '';
    this.tokenAddress = process.env.NEXT_PUBLIC_TOKEN_ADDRESS || '';
    this.baseNetworkId = process.env.BASE_NETWORK_ID || 'base-mainnet'; // e.g., 'base-mainnet', 'base-sepolia'

    if (!process.env.CDP_API_KEY_ID) {
      console.error('CDP_API_KEY_ID is not set');
      console.error('CONFIGURATION_ERROR: CDP_API_KEY_ID is not configured.');
      throw new Error('CONFIGURATION_ERROR: CDP_API_KEY_ID is not configured.');
    }
    if (!process.env.CDP_API_KEY_SECRET) {
      console.error('CDP_API_KEY_SECRET is not set');
      console.error('CONFIGURATION_ERROR: CDP_API_KEY_SECRET is not configured.');
      throw new Error('CONFIGURATION_ERROR: CDP_API_KEY_SECRET is not configured.');
    }
    if (!process.env.CDP_WALLET_SECRET) {
      console.error('CDP_WALLET_SECRET is not set');
      console.error('CONFIGURATION_ERROR: CDP_WALLET_SECRET is not configured.');
      throw new Error('CONFIGURATION_ERROR: CDP_WALLET_SECRET is not configured.');
    }
    if (!this.payoutAccountId) {
      console.error('CDP_PAYOUT_ACCOUNT_ID is not set');
      console.error('CONFIGURATION_ERROR: Payout account ID (CDP_PAYOUT_ACCOUNT_ID) is not configured.');
      throw new Error('CONFIGURATION_ERROR: Payout account ID (CDP_PAYOUT_ACCOUNT_ID) is not configured.');
    }
    if (!this.tokenAddress) {
      console.error('NEXT_PUBLIC_TOKEN_ADDRESS is not set');
      console.error('CONFIGURATION_ERROR: Token address (NEXT_PUBLIC_TOKEN_ADDRESS) is not configured.');
      throw new Error('CONFIGURATION_ERROR: Token address (NEXT_PUBLIC_TOKEN_ADDRESS) is not configured.');
    }
    if (!this.baseNetworkId) {
      console.error('BASE_NETWORK_ID is not set');
      console.error('CONFIGURATION_ERROR: Base network ID (BASE_NETWORK_ID) is not configured.');
      throw new Error('CONFIGURATION_ERROR: Base network ID (BASE_NETWORK_ID) is not configured.');
    }

    try {
      this.cdpClient = new CdpClient();
      console.log('CdpClient initialized successfully.');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Failed to initialize CdpClient:', errorMessage);
      console.error(`INITIALIZATION_ERROR: Failed to initialize CdpClient: ${errorMessage}`);
      throw new Error(`INITIALIZATION_ERROR: Failed to initialize CdpClient: ${errorMessage}`);
    }
  }

  public async distributePrizes(prizePayouts: PrizePayout[]): Promise<TransferResult[]> {
    console.log(
      `Attempting to distribute prizes to ${prizePayouts.length} users. Using CDP Payout Account: ${this.payoutAccountId}, Token: ${this.tokenAddress}, Network: ${this.baseNetworkId}`,
    );

    if (prizePayouts.length === 0) {
      console.warn('No prize payouts to process.');
      return [];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- EvmAccount type is not exported by SDK
    let senderAccount: any;
    try {
      console.log(`Listing accounts to find payout account: ${this.payoutAccountId}`);
      // TODO: Implement pagination if the list of accounts can be very large.
      // For now, assuming the payout account is on the first page if it exists.
      const { accounts /*, nextPageToken */ } = await this.cdpClient.evm.listAccounts();

      if (!accounts || accounts.length === 0) {
        console.error(`No EVM accounts found for the configured CDP client.`);
        throw new Error(`ACCOUNT_NOT_FOUND: No EVM accounts returned by listAccounts.`);
      }

      senderAccount = accounts.find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- EvmAccount type is not exported by SDK
        (acc: any) => acc.address.toLowerCase() === this.payoutAccountId.toLowerCase()
      );

      if (!senderAccount) {
        console.error(`Payout account ${this.payoutAccountId} not found in the listed accounts.`);
        throw new Error(`ACCOUNT_NOT_FOUND: Payout account ${this.payoutAccountId} not found via listAccounts.`);
      }
      console.log(`Successfully found and using sender account: ${senderAccount.address}`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Error obtaining sender account (${this.payoutAccountId}) via listAccounts: ${errorMessage}`);
      throw new Error(`ACCOUNT_ERROR: Failed to obtain sender account for prize distribution: ${errorMessage}`);
    }

    const results: TransferResult[] = [];
    for (const payout of prizePayouts) {
      if (!payout.userAddress || !payout.prizeAmount) {
        const idForLog = payout.userId ? `FID ${payout.userId}` : `address ${payout.userAddress?.slice(0,8)}...`;
        console.warn(
          `Skipping prize for ${idForLog} due to missing userAddress or prizeAmount.`,
          payout,
        );
        results.push({
          status: 'skipped', // Corrected from 'failed' to 'skipped' for this case
          error: 'Missing userAddress or prizeAmount',
          userAddress: payout.userAddress,
          prizeAmount: payout.prizeAmount,
          userId: payout.userId,
        });
        continue;
      }

      try {
        // Convert prizeAmount (string) to bigint using token decimals
        const amountAsBigInt = parseUnits(payout.prizeAmount, GLICO_TOKEN_DECIMALS);

        console.log(
          `Processing prize for ${payout.userAddress}: amount ${payout.prizeAmount} (${amountAsBigInt.toString()} units), token ${this.tokenAddress}, network ${this.baseNetworkId}`,
        );

        const result = await senderAccount.transfer({
          to: payout.userAddress as `0x${string}`,
          amount: amountAsBigInt,
          token: this.tokenAddress as `0x${string}`,
          network: this.baseNetworkId // this.baseNetworkId is already a string
        });

        const transactionHash = result.transactionHash; // SDK returns transactionHash
        const currentStatus = 'success'; // If transfer didn't throw, assume success for now

        const successIdForLog = payout.userId ? `User ID ${payout.userId} (${payout.userAddress})` : payout.userAddress;
        console.log(
          `Successfully initiated prize transfer for ${successIdForLog}. TxHash: ${transactionHash}`,
        );
        results.push({
          status: currentStatus,
          transactionHash,
          userAddress: payout.userAddress,
          prizeAmount: payout.prizeAmount,
          userId: payout.userId,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorIdForLog = payout.userId ? `User ID ${payout.userId} (${payout.userAddress})` : payout.userAddress;
        console.error(
          `Failed to process prize for ${errorIdForLog}: ${errorMessage}`,
        );
        results.push({
          status: 'failed',
          error: errorMessage,
          userAddress: payout.userAddress,
          prizeAmount: payout.prizeAmount,
          userId: payout.userId,
        });
      }
    }
    return results;
  }
}

// Singleton instance
export const walletService = new WalletService();
