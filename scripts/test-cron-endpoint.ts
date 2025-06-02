import path from 'path';
import dotenv from 'dotenv';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import axios from 'axios';

// --- Custom Axios Error Handling ---
interface CustomAxiosError extends Error {
  isAxiosError: true;
  response?: {
    data: unknown;
    status: number;
    statusText: string;
    headers: Record<string, string>;
  };
  request?: unknown;
  config?: unknown; // Adjust as per Axios's actual AxiosError structure if more props are needed
}

function isCustomAxiosError(error: unknown): error is CustomAxiosError {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as CustomAxiosError).isAxiosError === true &&
    'message' in error && // Basic Error property
    ('response' in error || 'request' in error) // Characteristic properties of AxiosError
  );
}

// --- Argument Parsing with yargs ---
const argv = yargs(hideBin(process.argv))
  .option('mode', {
    alias: 'm',
    type: 'string',
    description: 'Execution mode: "local" or "real"',
    choices: ['local', 'real'],
    default: 'local',
  })
  .option('periodType', {
    alias: 'p',
    type: 'string',
    description: 'Period type for prize distribution: "daily" or "weekly"',
    choices: ['daily', 'weekly'],
    default: 'daily',
  })
  .option('periodIdentifier', {
    alias: 'i',
    type: 'string',
    description: 'Period identifier (e.g., YYYY-MM-DD for daily)',
    default: new Date().toISOString().split('T')[0],
  })
  .option('endpointType', {
    alias: 'e',
    type: 'string',
    description: 'Endpoint to test: "prize-distribution", "allocate-revenue", or "all"',
    choices: ['prize-distribution', 'allocate-revenue', 'all'],
    default: 'prize-distribution',
  })
  .help()
  .alias('help', 'h')
  .parseSync();

const { mode, periodType, periodIdentifier, endpointType: scriptEndpointType } = argv;

// --- Environment Variable Loading based on mode ---
console.log(`[Script] Running in ${mode.toUpperCase()} mode.`);

// Load environment variables based on mode
let effectiveEnv: NodeJS.ProcessEnv = process.env;

if (mode === 'local') {
  // For local mode, load .env.local which contains mock configurations
  const localEnvPath = path.resolve(__dirname, '../.env.local');
  const localLoaded = dotenv.config({ path: localEnvPath });
  if (localLoaded.error) {
    console.warn(`[Script] Warning: Could not load ${localEnvPath}:`, localLoaded.error.message);
    process.exit(1);
  } else {
    console.log(`[Script] Loaded local environment variables from ${localEnvPath}`);
    effectiveEnv = { ...process.env };
  }
} else {
  // For real mode, load .env which contains real endpoints and secrets
  const realEnvPath = path.resolve(__dirname, '../.env');
  const realLoaded = dotenv.config({ path: realEnvPath });
  if (realLoaded.error) {
    console.warn(`[Script] Warning: Could not load ${realEnvPath}:`, realLoaded.error.message);
    process.exit(1);
  } else {
    console.log(`[Script] Loaded real environment variables from ${realEnvPath}`);
    effectiveEnv = { ...process.env };
  }
}

// --- Determine Target API URL and CRON_SECRET for the SCRIPT ---
let TARGET_API_URL = '';
if (mode === 'local') {
  TARGET_API_URL = effectiveEnv.LOCAL_API_URL || 'http://localhost:3000';
  if (!effectiveEnv.LOCAL_API_URL) {
    console.warn(`[Script] LOCAL_API_URL not set, defaulting to http://localhost:3000`);
  }
} else { // mode === 'real'
  // Use NEXT_PUBLIC_URL for production API if set, otherwise VERCEL_URL or NEXT_PUBLIC_VERCEL_URL
  TARGET_API_URL = effectiveEnv.NEXT_PUBLIC_URL || effectiveEnv.VERCEL_URL || effectiveEnv.NEXT_PUBLIC_VERCEL_URL!;
  if (!TARGET_API_URL) {
    console.error('[Script] Error: No production API URL found. Please set NEXT_PUBLIC_URL, VERCEL_URL, or NEXT_PUBLIC_VERCEL_URL in your .env.');
    process.exit(1);
  }
  console.log(`[Script] Using real API URL: ${TARGET_API_URL}`);
}

// Get CRON_SECRET based on mode
let CRON_SECRET_FOR_SCRIPT = effectiveEnv.CRON_SECRET;
if (!CRON_SECRET_FOR_SCRIPT) {
  if (mode === 'local') {
    // For local mode, we can use a default test secret
    CRON_SECRET_FOR_SCRIPT = 'test-secret-123';
    console.warn('[Script] Warning: CRON_SECRET not defined in .env.local, using default test value');
  } else {
    // For real mode, we need the actual secret from the .env file
    console.error('[Script] Error: CRON_SECRET is not defined in .env for real mode.');
    console.error('[Script] Please add CRON_SECRET to your .env file with the actual production secret.');
    process.exit(1);
  }
}

console.log(`[Script] Configuration:`);
console.log(`  Mode: ${mode}`);
console.log(`  Target API URL: ${TARGET_API_URL}`);
console.log(`  Cron Secret for Script: ${CRON_SECRET_FOR_SCRIPT ? 'SET (value hidden)' : 'NOT SET'}`);
console.log(`  Period Type: ${periodType}`);
console.log(`  Period Identifier: ${periodIdentifier}`);
console.log(`  Endpoint(s) to Test: ${scriptEndpointType}`);

// --- Variable mapping for different modes ---
// This script DOES NOT LAUNCH the Next.js server.
// The server it contacts must be running independently and have its own env vars correctly set.
if (mode === 'local') {
  console.log('[Script] In LOCAL mode, using mock data from .env.local');
  // In local mode, we expect the local Next.js server to be using the same .env.local
  // with mock Redis and other services
} else {
  console.log('[Script] In REAL mode, using real endpoints and secrets from .env');
  console.log('[Script] The target Next.js server is expected to have these variables (or mappings):');
  const realModeExpectedVars = {
    REDIS_URL: effectiveEnv.REDIS_URL,
    REDIS_TOKEN: effectiveEnv.REDIS_TOKEN,
    NEXT_PUBLIC_TURSO_URL: effectiveEnv.NEXT_PUBLIC_TURSO_URL,
    NEXT_PUBLIC_TURSO_API_SECRET: effectiveEnv.NEXT_PUBLIC_TURSO_API_SECRET,
    NEXT_PUBLIC_TOKEN_ADDRESS: effectiveEnv.NEXT_PUBLIC_TOKEN_ADDRESS,
    CRON_SECRET: effectiveEnv.CRON_SECRET,
    NEYNAR_API_KEY: effectiveEnv.NEYNAR_API_KEY,
    NODE_ENV: 'production',
  };
  console.log('  Expected by Next.js app (from .env via mappings):');
  for (const [key, value] of Object.entries(realModeExpectedVars)) {
    const displayValue = (value && (key.includes('TOKEN') || key.includes('SECRET') || key.includes('API_KEY'))) ? 'SET (value hidden)' : value;
    console.log(`    ${key}: ${displayValue || 'NOT SET in .env with expected source name'}`);
  }
  console.log('  Optionally, for client-side wallet integration:');
  console.log('    NEXT_PUBLIC_WC_PROJECT_ID: SET (value hidden or not set)');
  console.log('    NEXT_PUBLIC_CDP_API_KEY: SET (value hidden or not set)');
}

interface TestResult {
  status: 'Passed' | 'Failed';
  endpoint: string;
  statusCode?: number;
  responseData?: unknown; // Response data if available
  error?: unknown; // Error information if failed
}

async function runTestOnEndpoint(
  currentEndpointType: 'prize-distribution' | 'allocate-revenue',
  pType: 'daily' | 'weekly',
  pIdentifier?: string
): Promise<TestResult> {
  let endpointPath = '';
  let queryParams: Record<string, string> = {};
  let requestBody: Record<string, unknown> | null = null;

  if (currentEndpointType === 'prize-distribution') {
    endpointPath = '/api/cron/prize-distribution';
    queryParams = {
      periodType: pType,
      ...(pIdentifier ? { periodIdentifier: pIdentifier } : {}),
    };

  } else if (currentEndpointType === 'allocate-revenue') {
    endpointPath = '/api/allocate-revenue';
    requestBody = {
      amount: 100,
      currency: 'USD',
      transactionId: `txn_${Date.now()}`,
      description: `Test revenue allocation (${mode} mode)`
    };

  } else {
    // Corrected: Handle unknown endpoint type to satisfy compiler for return path
    const errMessage = `[Script] Unknown endpoint type: ${currentEndpointType}`;
    console.error(errMessage);
    return {
      endpoint: `Unknown: ${currentEndpointType}`,
      status: 'Failed',
      error: errMessage,
    };
  }

  const fullUrl = new URL(`${TARGET_API_URL}${endpointPath}`);
  Object.keys(queryParams).forEach(key => fullUrl.searchParams.append(key, queryParams[key]));

  console.log('\n--------------------------------------------------');
  console.log(`[Script] 🚀 Testing endpoint: ${currentEndpointType} (${mode} mode)`);
  console.log(`[Script] 🔗 Full URL: ${fullUrl.toString()}`);
  if (requestBody) {
    console.log(`[Script] 📦 Request Body: ${JSON.stringify(requestBody, null, 2)}`);
  }
  console.log('--------------------------------------------------\n\n');

  try {
    const response = await axios.request({
      method: currentEndpointType === 'allocate-revenue' ? 'POST' : 'GET',
      url: fullUrl.toString(),
      headers: {
        'Authorization': `Bearer ${CRON_SECRET_FOR_SCRIPT}`,
        ...(currentEndpointType === 'allocate-revenue' && { 'Content-Type': 'application/json' })
      },
      ...(requestBody ? { data: requestBody } : {}),
      timeout: 30000,
    });

    console.log(`[Script] Status: ${response.status} ${response.statusText}`);
    console.log('[Script] Response Headers:');
    Object.entries(response.headers).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });
    console.log('[Script] Response Body:', JSON.stringify(response.data, null, 2));
    console.log('[Script] Parsed Response:', response.data);

    if (response.status >= 200 && response.status < 300) {
      console.log(`[Script] ✅ Test passed for ${currentEndpointType}`);
      return {
        endpoint: fullUrl.toString(),
        status: 'Passed',
        statusCode: response.status,
        responseData: response.data,
      };
    } else {
      console.error(`[Script] ❌ Test failed for ${currentEndpointType}: Unexpected status code ${response.status}`);
      return {
        endpoint: fullUrl.toString(),
        status: 'Failed',
        statusCode: response.status,
        responseData: response.data,
        error: `Unexpected status code ${response.status}`,
      };
    }
  } catch (error: unknown) {
    console.error(`\n[Script] ❌ Test failed for ${currentEndpointType}: Error during request`);
    // Corrected: Use instanceof AxiosError
    if (isCustomAxiosError(error)) {
      if (error.response) {
        console.error(`  Status: ${error.response.status} ${error.response.statusText}`);
        console.error('  Response Headers:');
        Object.entries(error.response.headers).forEach(([key, value]) => {
          console.error(`    ${key}: ${value}`);
        });
        console.error('  Response Body:', JSON.stringify(error.response.data, null, 2));
        console.error('\n  Parsed Response:', error.response.data);
        return {
          endpoint: fullUrl.toString(),
          status: 'Failed',
          statusCode: error.response.status,
          responseData: error.response.data,
          error: `Request failed: ${error.response.status} ${error.response.statusText}`,
        };
      } else if (error.request) {
        console.error('  Error: No response received from server. Is the server running at the TARGET_API_URL?');
        console.error('  Target URL was:', fullUrl.toString());
        return {
          endpoint: fullUrl.toString(),
          status: 'Failed',
          error: 'No response received from server.',
        };
      } else {
        console.error('  Error setting up request:', error.message);
        return {
          endpoint: fullUrl.toString(),
          status: 'Failed',
          error: `Error setting up request: ${error.message}`,
        };
      }
    } else { // Non-Axios error
      console.error('  Non-Axios error (or error of unknown type):', error);
      return {
        endpoint: fullUrl.toString(),
        status: 'Failed',
        error: error instanceof Error ? `Non-Axios error: ${error.message}` : 'An unknown error occurred',
      };
    }
  }
}

async function main() {
  const results: TestResult[] = [];

  if (scriptEndpointType === 'all' || scriptEndpointType === 'prize-distribution') {
    results.push(
      await runTestOnEndpoint(
        'prize-distribution',
        periodType as 'daily' | 'weekly',
        periodIdentifier
      )
    );
  }

  if (scriptEndpointType === 'all' || scriptEndpointType === 'allocate-revenue') {
    results.push(await runTestOnEndpoint('allocate-revenue', 'daily')); // Defaulting pType for allocate-revenue
  }

  console.log('\n--- Test Summary ---');
  results.forEach(result => {
    console.log(
      `Endpoint: ${result.endpoint} -> Status: ${result.status}` +
      `${result.statusCode ? ` (${result.statusCode})` : ''}` +
      `${result.error ? ` - Error: ${result.error}` : ''}`
    );
  });

  const allPassed = results.every(r => r.status === 'Passed');
  if (!allPassed) {
    console.error('\n[Script] ❌ One or more tests failed.');
    process.exit(1);
  }
  console.log('\n[Script] ✅ All tests passed.');
  process.exit(0); // Ensure script exits cleanly after tests
}

main().catch(error => {
  console.error('[Script] Unhandled error in main function:', error);
  process.exit(1);
});
