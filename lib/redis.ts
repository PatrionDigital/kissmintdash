import { Redis } from "@upstash/redis";

// Use REDIS_URL and REDIS_TOKEN environment variables
const redisUrl = process.env.REDIS_URL;
const redisToken = process.env.REDIS_TOKEN;

// Create a mock Redis client for development
const createMockRedis = () => {
  console.warn('[Redis] Running in development mode without Redis. Some features may not work.');
  return {
    get: () => Promise.resolve(null),
    set: () => Promise.resolve('OK'),
    del: () => Promise.resolve(0),
    zadd: () => Promise.resolve(0),
    zrange: () => Promise.resolve([]),
    zscore: () => Promise.resolve(null),
  } as unknown as Redis; // Cast to Redis type
};

// Create the Redis client based on environment
let redisClient: Redis;

if (!redisUrl || !redisToken) {
  console.error('[Redis] Missing required environment variables. Please set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN or REDIS_URL and REDIS_TOKEN');
  
  // In development, we can continue without Redis
  if (process.env.NODE_ENV === 'development') {
    redisClient = createMockRedis();
  } else {
    throw new Error(
      '[Redis] Missing required environment variables: UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN (or REDIS_URL and REDIS_TOKEN)'
    );
  }
} else {
  // Create a proper Redis client
  redisClient = new Redis({
    url: redisUrl,
    token: redisToken,
  });
}

export const redis = redisClient;
