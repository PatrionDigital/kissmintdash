import { LRUCache } from 'lru-cache';

// Define the structure of the relevant part of the Neynar API response
interface NeynarUserResponse {
  users: {
    fid: number;
    username: string;
    display_name: string;
    verified_addresses: {
      eth_addresses: string[];
      sol_addresses: string[];
    };
    // ... other properties
  }[];
}

export class FarcasterProfileService {
  private apiKey: string;
  private cache: LRUCache<string, string | null>;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.NEYNAR_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('Neynar API key is not defined. Please set NEYNAR_API_KEY environment variable.');
    }

    // Cache to store FID to address mappings to reduce API calls
    // Cache up to 500 FIDs for 1 hour
    this.cache = new LRUCache<string, string | null>({
      max: 500,
      ttl: 1000 * 60 * 60, // 1 hour
    });
  }

  async getWalletAddressForFid(fid: string): Promise<string | null> {
    const cachedAddress = this.cache.get(fid);
    if (cachedAddress !== undefined) {
      return cachedAddress;
    }

    if (!fid) {
      console.error('[FarcasterProfileService] FID is undefined or empty.');
      return null;
    }

    const url = `https://api.neynar.com/v2/farcaster/user/bulk?fids=${fid}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'api_key': this.apiKey,
        },
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`[FarcasterProfileService] Neynar API request failed for FID ${fid}: ${response.status} ${response.statusText}`, errorBody);
        this.cache.set(fid, null); // Cache null for failed requests to avoid retrying too quickly
        return null;
      }

      const data = (await response.json()) as NeynarUserResponse;

      if (data.users && data.users.length > 0) {
        const user = data.users[0];
        // Prioritize Ethereum addresses. Use the first verified ETH address if available.
        if (user.verified_addresses && user.verified_addresses.eth_addresses && user.verified_addresses.eth_addresses.length > 0) {
          const walletAddress = user.verified_addresses.eth_addresses[0];
          this.cache.set(fid, walletAddress);
          return walletAddress;
        }
      }
      
      console.warn(`[FarcasterProfileService] No verified ETH wallet address found for FID ${fid}.`);
      this.cache.set(fid, null);
      return null;
    } catch (error) {
      console.error(`[FarcasterProfileService] Error fetching wallet address for FID ${fid}:`, error);
      this.cache.set(fid, null); // Cache null on error
      return null;
    }
  }
}
