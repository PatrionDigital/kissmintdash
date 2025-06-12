import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { NextResponse, type NextRequest } from 'next/server';

interface RateLimitErrorResponse {
  error: string;
  message: string;
  code: string;
  requestId?: string;
  retryAfter?: number;
  reset?: number;
  limit?: number;
  remaining?: number;
}

interface RateLimitOptions {
  /** Number of requests allowed per window */
  limit?: number;
  /** Time window for rate limiting (e.g., '15 m', '1 h') */
  window?: string;
  /** Whether this endpoint requires admin authentication */
  adminOnly?: boolean;
  /** Custom error message when rate limit is exceeded */
  errorMessage?: string;
  /** Enable/disable rate limiting (default: true) */
  enabled?: boolean;
  /** Custom headers to include in rate-limited responses */
  headers?: Record<string, string>;
  /** Generate a unique request ID for tracing */
  generateRequestId?: boolean;
}

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: Date;
  retryAfter: number;
  resetEpoch: number;
  pending?: Promise<unknown>;
}

/**
 * Rate limiting configuration
 * 
 * Best practices from express-rate-limit and industry standards:
 * - Use sliding window for more accurate rate limiting
 * - Set reasonable defaults that protect your API without being too restrictive
 * - Include rate limit headers in responses
 * - Support for trusted proxies (via x-forwarded-for header)
 * - Skip rate limiting for admin endpoints with valid API keys
 */

// Initialize the Upstash Redis client
const redis = Redis.fromEnv();

// Create a new ratelimiter with sliding window algorithm
const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '15 m'), // 100 requests per 15 minutes
  analytics: true, // Enable analytics for monitoring
  prefix: 'kissmintdash:ratelimit', // Consistent prefix for all keys
});



/**
 * Get the client's IP address, handling proxies
 */
function getClientIpAddress(request: NextRequest): string {
  // Get the x-forwarded-for header which may contain multiple IPs
  const xForwardedFor = request.headers.get('x-forwarded-for');
  
  // If x-forwarded-for exists, the first IP is the client's IP
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim();
  }

  // Fallback to x-real-ip if available
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }

  // If we're in development, use a default value
  if (process.env.NODE_ENV === 'development') {
    return '127.0.0.1';
  }

  // As a last resort, use the connection remote address
  // Note: This might be the proxy's IP if not running behind a reverse proxy
  return request.headers.get('x-vercel-ip') || request.ip || 'unknown-ip';
};

/**
 * Check if the current request should bypass rate limiting
 */
const shouldBypassRateLimit = (request: NextRequest): boolean => {
  // Skip rate limiting for preflight requests
  if (request.method === 'OPTIONS') {
    return true;
  }
  
  // Skip rate limiting for health checks
  if (request.nextUrl.pathname === '/api/health') {
    return true;
  }
  
  return false;
};

/**
 * Check if the current request is from an admin
 */
const isAdminRequest = (request: NextRequest): boolean => {
  const apiKey = request.headers.get('x-api-key');
  return apiKey === process.env.ADMIN_API_KEY;
};

/**
 * Check rate limit for a request
 */
export const checkRateLimit = async (
  request: NextRequest, 
  identifier: string,
  options: {
    limit?: number;
    window?: string;
    adminBypass?: boolean;
  } = {}
): Promise<RateLimitResult> => {
  const { 
    limit = 100, 
    window = '15 m',
    adminBypass = true
  } = options;

  // Bypass rate limiting for admins if enabled
  if (adminBypass && isAdminRequest(request)) {
    return {
      success: true,
      limit,
      remaining: limit,
      reset: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes from now
      retryAfter: 0,
      resetEpoch: Math.floor(Date.now() / 1000) + 15 * 60,
    };
  }

  // Bypass rate limiting for certain requests
  if (shouldBypassRateLimit(request)) {
    return {
      success: true,
      limit,
      remaining: limit,
      reset: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes from now
      retryAfter: 0,
      resetEpoch: Math.floor(Date.now() / 1000) + 15 * 60,
    };
  }

  // Get client IP and user agent for rate limiting
  const ip = getClientIpAddress(request);
  const userAgent = request.headers.get('user-agent') || 'unknown';
  
  // Create a unique identifier for this rate limit rule and client
  const rateLimitKey = `rate-limit:${identifier}:${ip}:${userAgent}`;

  try {
    // Get the rate limit result with additional metadata
    const result = await ratelimit.limit(rateLimitKey);
    
    // Calculate reset time in seconds
    const now = Math.floor(Date.now() / 1000);
    const resetInSeconds = Math.max(0, result.reset - now);
    
    return {
      success: result.success,
      limit: 100, // Default limit for this window
      remaining: result.remaining,
      reset: new Date(result.reset * 1000), // Convert to milliseconds for Date
      retryAfter: resetInSeconds,
      resetEpoch: result.reset,
      pending: result.pending, // Promise that resolves when the request is done
    };
  } catch (error) {
    console.error('Rate limit error:', error);
    // Fail open in case of Redis errors to avoid blocking traffic
    return {
      success: true,
      limit,
      remaining: limit,
      reset: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes from now
      retryAfter: 0,
      resetEpoch: Math.floor(Date.now() / 1000) + 15 * 60,
    };
  }
};

interface RateLimitOptions {
  /**
   * Number of requests allowed per window
   * @default 100
   */
  limit?: number;
  
  /**
   * Time window for rate limiting
   * @default '15 m' (15 minutes)
   */
  window?: string;
  
  /**
   * Whether to bypass rate limiting for admin requests
   * @default true
   */
  adminBypass?: boolean;
  
  /**
   * Whether this endpoint requires admin authentication
   * @default false
   */
  adminOnly?: boolean;
  
  /**
   * Custom error message when rate limit is exceeded
   */
  errorMessage?: string;
}

/**
 * Higher-order function to wrap API route handlers with rate limiting
 */
// Generate a unique request ID for tracing
const generateRequestId = (): string => {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
};

// Type for the handler function
type Handler = (
  request: NextRequest,
  ...args: any[]
) => Promise<NextResponse>;

// Type for the rate-limited handler
type RateLimitedHandler = (
  request: NextRequest,
  ...args: any[]
) => Promise<NextResponse>;

export function withRateLimit(
  handler: Handler,
  identifier: string,
  options: RateLimitOptions = {}
): RateLimitedHandler {
  return async function rateLimitedHandler(
    request: NextRequest,
    ...args: any[]
  ): Promise<NextResponse> {
    const requestStartTime = Date.now();
    const requestId = options.generateRequestId !== false ? generateRequestId() : undefined;
    const { 
      adminOnly = false, 
      errorMessage = 'Too many requests. Please try again later.',
      ...rateLimitOptions 
    } = options;
    // Skip rate limiting if disabled
    if (options.enabled === false) {
      return handler(request, ...args);
    }

    // Skip rate limiting for preflight requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { 
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
        } 
      });
    }

    // Skip rate limiting for health checks
    if (request.nextUrl.pathname === '/api/health') {
      return handler(request, ...args);
    }

    // Check for admin API key
    if (options.adminOnly) {
      const apiKey = request.headers.get('x-api-key');
      if (apiKey !== process.env.ADMIN_API_KEY) {
        const errorResponse: RateLimitErrorResponse = {
          error: 'Unauthorized',
          message: 'Admin access required',
          code: 'UNAUTHORIZED',
          requestId
        };

        return NextResponse.json(errorResponse, { 
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, max-age=0',
            ...(requestId && { 'X-Request-ID': requestId }),
            ...options.headers
          }
        });  
      }
      // Admin requests bypass rate limiting
      return handler(request, ...args);
    }

    try {
      // Check rate limit
      const rateLimit = await checkRateLimit(request, identifier, rateLimitOptions);
      
      // Handle rate limit exceeded
      if (!rateLimit.success) {
        const errorResponse: RateLimitErrorResponse = {
        error: 'Rate limit exceeded',
        message: errorMessage,
        code: 'RATE_LIMIT_EXCEEDED',
        requestId,
        limit: rateLimit.limit,
        remaining: rateLimit.remaining,
        reset: rateLimit.resetEpoch,
        retryAfter: rateLimit.retryAfter,
      };
      
      const headers = new Headers({
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, max-age=0',
        'X-RateLimit-Limit': rateLimit.limit.toString(),
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        'X-RateLimit-Reset': rateLimit.resetEpoch.toString(),
        'Retry-After': rateLimit.retryAfter.toString(),
        ...(requestId && { 'X-Request-ID': requestId }),
        ...options.headers
      });
      
      return new NextResponse(
        JSON.stringify(errorResponse), 
        { status: 429, statusText: 'Too Many Requests', headers }
      );
      }

      // Proceed with the original handler if rate limit is not exceeded
      const response = await handler(request, ...args);
      
      // Add rate limit and timing headers to the response
      const headers = new Headers(response.headers);
      headers.set('X-RateLimit-Limit', rateLimit.limit.toString());
      headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString());
      headers.set('X-RateLimit-Reset', rateLimit.resetEpoch.toString());
      
      if (requestId) {
        headers.set('X-Request-ID', requestId);
      }
      
      // Add server timing header
      const requestDuration = Date.now() - requestStartTime;
      headers.append('Server-Timing', `total;dur=${requestDuration}`);
      
      // Add custom headers if provided
      if (options.headers) {
        Object.entries(options.headers).forEach(([key, value]) => {
          headers.set(key, value);
        });
      }
      
      return new NextResponse(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      }) as unknown as NextResponse;
    } catch (error) {
      console.error('Rate limiting error:', error);
      // In case of errors, fail open but add error headers
      try {
        const response = await handler(request, ...args);
        const headers = new Headers(response.headers);
        if (requestId) {
          headers.set('X-Request-ID', requestId);
          headers.set('X-RateLimit-Error', 'true');
        }
        return new NextResponse(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers,
        });
      } catch (handlerError) {
        console.error('Handler error:', handlerError);
        throw handlerError;
      }
    }
  };
};

/**
 * Middleware to add rate limiting to Next.js API routes
 */
export const rateLimitMiddleware = (options: RateLimitOptions & { identifier: string }) => {
  return withRateLimit(
    async (request: Request) => {
      // This is a no-op handler that will be replaced by the actual route handler
      return new NextResponse(null, { status: 500 });
    },
    options.identifier,
    options
  );
};
