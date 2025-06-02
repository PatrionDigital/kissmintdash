import { createServer } from 'http';
import { exec } from 'child_process';
import { promisify } from 'util';
import { createClient } from '@libsql/client';
import { Redis } from '@upstash/redis';
import * as fs from 'fs';

const execAsync = promisify(exec);

// Test configuration
const PORT = 3002; // Use a different port to avoid conflicts
const CRON_SECRET = 'test-secret-123';
const TEST_DB_PATH = './test.db';

// Mock Redis server for testing
const mockRedisServer = createServer((req, res) => {
  // Simulate Redis responses
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ result: 'mocked' }));
});

async function setupTestEnvironment() {
  console.log('Setting up test environment...');
  
  // Start mock Redis server
  await new Promise<void>((resolve) => {
    mockRedisServer.listen(8080, 'localhost', () => {
      console.log('Mock Redis server running on port 8080');
      resolve();
    });
  });

  // Set up test database
  const turso = createClient({
    url: `file:${TEST_DB_PATH}`,
  });

  // Apply schema
  await turso.execute(`
    CREATE TABLE IF NOT EXISTS leaderboard_archives (
      id TEXT PRIMARY KEY,
      period_type TEXT NOT NULL,
      period_identifier TEXT NOT NULL,
      entries JSONB NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('Test environment ready');
}

async function testCronEndpoint() {
  console.log('\nTesting cron endpoint...');
  
  // Set environment variables
  process.env.CRON_SECRET = CRON_SECRET;
  process.env.UPSTASH_REDIS_REST_URL = 'http://localhost:8080';
  process.env.UPSTASH_REDIS_REST_TOKEN = 'dummy-token';
  process.env.TURSO_DATABASE_URL = `file:${TEST_DB_PATH}`;
  process.env.TURSO_AUTH_TOKEN = 'dummy-auth-token';

  // Kill any existing processes on the test port
  try {
    await exec(`lsof -ti:${PORT} | xargs kill -9`);
  } catch (e) {
    // Ignore errors if no process was found
  }

  // Prepare environment variables with proper typing
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    PORT: PORT.toString(),
    NODE_ENV: 'development',
    DEBUG: '*',
    // Required for PrizePoolManager
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL || 'http://localhost:8080',
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN || 'dummy-token',
    TURSO_DATABASE_URL: process.env.TURSO_DATABASE_URL || `file:${TEST_DB_PATH}`,
    TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN || 'dummy-auth-token',
    // Required for FarcasterProfileService
    NEYNAR_API_KEY: process.env.NEYNAR_API_KEY || 'dummy-neynar-key',
    // Required for WalletService
    COINBASE_API_KEY: process.env.COINBASE_API_KEY || 'dummy-coinbase-key',
    COINBASE_API_SECRET: process.env.COINBASE_API_SECRET || 'dummy-coinbase-secret',
    COINBASE_SMART_WALLET_ACCOUNT_ID: process.env.COINBASE_SMART_WALLET_ACCOUNT_ID || 'dummy-account-id',
    GLICO_TOKEN_ADDRESS: process.env.GLICO_TOKEN_ADDRESS || '0xdummy-token-address',
    // Cron secret
    CRON_SECRET,
  };

  // Log environment variables for debugging
  console.log('Environment variables being passed to Next.js:');
  console.log('- UPSTASH_REDIS_REST_URL:', env.UPSTASH_REDIS_REST_URL);
  console.log('- TURSO_DATABASE_URL:', env.TURSO_DATABASE_URL);
  console.log('- NEYNAR_API_KEY:', env.NEYNAR_API_KEY ? '***' : 'not set');
  console.log('- COINBASE_API_KEY:', env.COINBASE_API_KEY ? '***' : 'not set');
  console.log('- CRON_SECRET:', env.CRON_SECRET ? '***' : 'not set');

  // Create a temporary .env file for testing
  const tempEnvPath = './.env.test';
  const envContent = `
    UPSTASH_REDIS_REST_URL=${env.UPSTASH_REDIS_REST_URL}
    UPSTASH_REDIS_REST_TOKEN=${env.UPSTASH_REDIS_REST_TOKEN}
    TURSO_DATABASE_URL=${env.TURSO_DATABASE_URL}
    TURSO_AUTH_TOKEN=${env.TURSO_AUTH_TOKEN}
    NEYNAR_API_KEY=${env.NEYNAR_API_KEY}
    COINBASE_API_KEY=${env.COINBASE_API_KEY}
    COINBASE_API_SECRET=${env.COINBASE_API_SECRET}
    COINBASE_SMART_WALLET_ACCOUNT_ID=${env.COINBASE_SMART_WALLET_ACCOUNT_ID}
    GLICO_TOKEN_ADDRESS=${env.GLICO_TOKEN_ADDRESS}
    CRON_SECRET=${env.CRON_SECRET}
    NODE_ENV=test
    DEBUG=*
    PORT=${PORT}
  `;

  // Write the temporary .env file
  await fs.promises.writeFile(tempEnvPath, envContent);
  console.log(`Created temporary ${tempEnvPath} file`);

  // Start the Next.js server in test mode with the temporary .env file
  console.log('\nStarting Next.js server...');
  const nextProcess = exec(`
    set -a && source .env.test && set +a && \
    NODE_ENV=test \
    PORT=${PORT} \
    npx next dev -p ${PORT}
  `);

  // Handle process errors
  nextProcess.on('error', (error) => {
    console.error('Failed to start Next.js process:', error);
  });

  // Handle process exit
  nextProcess.on('exit', (code, signal) => {
    if (code !== 0) {
      console.error(`Next.js process exited with code ${code} and signal ${signal}`);
    } else {
      console.log('Next.js process exited successfully');
    }
  });

  // Capture server output
  let serverOutput = '';
  if (nextProcess.stdout) {
    nextProcess.stdout.on('data', (data) => {
      console.log(`[Next.js] ${data}`);
      serverOutput += data.toString();
    });
  }
  if (nextProcess.stderr) {
    nextProcess.stderr.on('data', (data) => {
      console.error(`[Next.js Error] ${data}`);
      serverOutput += `ERROR: ${data}`;
    });
  }

  // Wait for server to start (longer timeout for better reliability)
  console.log('Waiting for Next.js server to start...');
  await new Promise(resolve => setTimeout(resolve, 10000));
  console.log('Server startup wait complete, proceeding with test...');

  try {
    // Test the cron endpoint
    console.log('\nSending test request...');
    const response = await fetch(
      `http://localhost:${PORT}/api/cron/prize-distribution?periodType=daily`,
      {
        headers: {
          'Authorization': `Bearer ${CRON_SECRET}`,
        },
      }
    );

    // Log response status and headers for debugging
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log('Response Headers:');
    response.headers.forEach((value, key) => {
      console.log(`  ${key}: ${value}`);
    });

    // Get response as text first for debugging
    const responseText = await response.text();
    console.log('\nResponse Body:', responseText);

    // Try to parse as JSON if possible
    try {
      const result = JSON.parse(responseText);
      console.log('\nParsed Response:', result);
    } catch (e) {
      console.log('Response is not valid JSON');
    }
    
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status} ${response.statusText}`);
    }
    
    console.log('\n✅ Test passed!');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
  } finally {
    // Clean up
    nextProcess.kill();
    mockRedisServer.close();
    console.log('\nTest environment cleaned up');
  }
}

// Run the test
async function main() {
  try {
    await setupTestEnvironment();
    await testCronEndpoint();
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

main();
