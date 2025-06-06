import { CdpClient } from "@coinbase/cdp-sdk";

// Define a local interface for the account structure we expect
interface CdpAccountInfo {
  address: string;
  type?: string; // From listAccounts output
  name?: string; // Can be set via update, optional in list output
  // accountId is not directly available from listAccounts from what we've seen
}
import dotenv from "dotenv";
import path from 'path';
import { fileURLToPath } from 'url';
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

// ESM-friendly way to get __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Initialize CDP Client (do this once)
let cdp: CdpClient;
// Placeholder for the account type. We'll rely on inference within functions primarily.
// If we were to define it globally: type CdpEvmListedAccount = Awaited<ReturnType<typeof cdp.evm.listAccounts>>['accounts'][number];

function initializeCdpClient(requiresWalletSecret: boolean = false) {
  if (cdp) return cdp;

  console.log("Checking for required environment variables for CDP SDK:");
  const apiKeyId = process.env.CDP_API_KEY_ID;
  const apiKeySecret = process.env.CDP_API_KEY_SECRET;
  const walletSecret = process.env.CDP_WALLET_SECRET; // Needed for create/update operations

  console.log(`- CDP_API_KEY_ID: ${apiKeyId ? 'Found' : 'MISSING!'}`);
  console.log(`- CDP_API_KEY_SECRET: ${apiKeySecret ? 'Found' : 'MISSING!'}`);
  console.log(`- CDP_WALLET_SECRET: ${walletSecret ? 'Found' : 'MISSING!'}`);

  if (!apiKeyId || !apiKeySecret) { // Wallet secret might not be needed for list
    console.error("\nError: Missing CDP_API_KEY_ID or CDP_API_KEY_SECRET.");
    console.error("Please ensure they are set in your .env file at the project root.");
    process.exit(1);
  }
  
  // For create/name, walletSecret is essential
  if (requiresWalletSecret && !walletSecret) {
    console.error("\nError: CDP_WALLET_SECRET is required for this operation.");
    process.exit(1);
  }

  console.log("\nAttempting to initialize CdpClient...");
  cdp = new CdpClient(); // SDK reads from env vars by default
  console.log("CdpClient initialized successfully.");
  return cdp;
}

async function handleCreateCommand() {
  const client = initializeCdpClient(true);
  if (!process.env.CDP_WALLET_SECRET) { // Explicit check for create
    console.error("\nError: CDP_WALLET_SECRET is required to create an account.");
    process.exit(1);
  }
  try {
    console.log("\nCreating new EVM account via CDP SDK...");
    const account = await client.evm.createAccount();
    console.log("\n----------------------------------------------------------------");
    console.log(`SUCCESS! Created EVM account address: ${account.address}`);
    console.log("----------------------------------------------------------------");
    console.log("\nIMPORTANT NEXT STEPS:");
    console.log(`1. Update your .env file: Set CDP_PAYOUT_ACCOUNT_ID=${account.address}`);
    console.log("2. Ensure this new account is funded with $GLICO tokens (and likely some ETH for gas on Base) before attempting prize payouts.");
  } catch (error) {
    console.error("\nError during CDP EVM account creation:", error);
  }
}

async function findAccountByAddress(client: CdpClient, addressToFind: string): Promise<CdpAccountInfo | null> {
  let response = await client.evm.listAccounts();
  while (true) {
    for (const account of response.accounts) {
      if (account.address.toLowerCase() === addressToFind.toLowerCase()) {
        return account;
      }
    }
    if (!response.nextPageToken) break;
    response = await client.evm.listAccounts({ pageToken: response.nextPageToken });
  }
  return null;
}

async function handleNameCommand() {
  const client = initializeCdpClient(true);
  if (!process.env.CDP_WALLET_SECRET) { // Explicit check for name update
    console.error("\nError: CDP_WALLET_SECRET is required to name an account.");
    process.exit(1);
  }
  const rl = readline.createInterface({ input, output });
  try {
    const address = await rl.question('Enter the EVM address of the account to name: ');
    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      console.error('Invalid EVM address format.');
      return;
    }
    const newName = await rl.question(`Enter the new human-readable name for ${address}: `);
    if (!newName.trim()) {
      console.error('Name cannot be empty.');
      return;
    }

    console.log(`\nSearching for account with address: ${address}...`);
    const accountToName: CdpAccountInfo | null = await findAccountByAddress(client, address);

    if (!accountToName) {
      console.error(`Account with address ${address} not found in your CDP project.`);
      return;
    }

    console.log(`Found account. Address: ${accountToName.address}, Current name: '${accountToName.name || "(not set)"}'`);
    console.log(`Attempting to update name to '${newName}'...`);

    const updatedAccountResponse = await client.evm.updateAccount({
      address: accountToName.address, // Use address to identify
      update: {
        name: newName, // Name is nested under update
      },
    });
    console.log(`\nSUCCESS! Account ${accountToName.address} named/renamed.`);
    console.log('Updated account details:', JSON.stringify(updatedAccountResponse, null, 2));

  } catch (error) {
    console.error("\nError during account naming process:", error);
  } finally {
    rl.close();
  }
}

async function handleListCommand() {
  const client = initializeCdpClient(false); // List does not require wallet secret
  try {
    console.log("\nListing all EVM accounts in your CDP project:");
    let response = await client.evm.listAccounts();
    let count = 0;
    while (true) {
      for (const account of response.accounts as CdpAccountInfo[]) {
        count++;
        console.log(`- Address: ${account.address}, Type: ${account.type}, Name: ${account.name || '(not set)'}`);
      }
      if (!response.nextPageToken) break;
      console.log("Fetching next page...");
      response = await client.evm.listAccounts({ pageToken: response.nextPageToken });
    }
    if (count === 0) {
        console.log("No EVM accounts found in this CDP project.");
    }
    console.log(`\nFound ${count} account(s).`);
  } catch (error) {
    console.error("\nError listing CDP EVM accounts:", error);
  }
}

yargs(hideBin(process.argv))
  .command('create', 'Create a new EVM account', {}, handleCreateCommand)
  .command('name', 'Assign or update a human-readable name for an existing EVM account by its address', {}, handleNameCommand)
  .command('list', 'List all EVM accounts in the CDP project', {}, handleListCommand)
  .demandCommand(1, 'You need to specify a command: create, name, or list.')
  .strict()
  .help()
  .parse(); // Ensures yargs executes and parses arguments
