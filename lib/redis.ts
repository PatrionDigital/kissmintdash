import { Redis } from "@upstash/redis";

const redisUrl = process.env.REDIS_URL;
const redisToken = process.env.REDIS_TOKEN;

if (!redisUrl || !redisToken) {
  throw new Error(
    '[Redis] Missing required environment variables: REDIS_URL and/or REDIS_TOKEN.'
  );
}

export const redis = new Redis({
  url: redisUrl,
  token: redisToken,
});
