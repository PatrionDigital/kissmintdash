import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const packageJsonPath = join(__dirname, '../package.json');

// Read the current package.json
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

// Add the new scripts
packageJson.scripts = {
  ...packageJson.scripts,
  "wallet:balance": "tsx scripts/wallet-balance.ts",
  "wallet:transfer": "tsx scripts/wallet-transfer.ts",
  "wallet:info": "tsx scripts/wallet-info.ts"
};

// Write the updated package.json back to disk
writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');

console.log('Successfully updated package.json with wallet scripts!');
