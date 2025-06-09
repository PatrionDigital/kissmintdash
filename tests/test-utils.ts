import { NextRequest, NextResponse } from 'next/server';
import { IncomingHttpHeaders } from 'http';

/**
 * Creates a mock NextRequest for testing
 */
export function createMockRequest(
  method: string = 'GET',
  url: string = 'http://localhost:3000/api/test',
  headers: Record<string, string> = {},
  body: any = null
): NextRequest {
  const requestHeaders = new Headers();
  Object.entries(headers).forEach(([key, value]) => {
    requestHeaders.set(key, value);
  });

  const requestInit: RequestInit = {
    method,
    headers: requestHeaders,
  };

  if (body) {
    requestInit.body = JSON.stringify(body);
    requestHeaders.set('Content-Type', 'application/json');
  }

  // Create a Request object that NextRequest extends
  const request = new Request(url, requestInit) as any;
  
  // Add Next.js specific properties
  request.nextUrl = new URL(url);
  request.cookies = {};
  request.ip = headers['x-real-ip'] || headers['x-forwarded-for']?.split(',')[0] || '127.0.0.1';
  request.geo = {};
  request.ua = headers['user-agent'] || '';
  
  return request as NextRequest;
}

/**
 * Creates a mock NextResponse for testing
 */
export function createMockResponse() {
  const response = new NextResponse();
  // Add any mock response methods if needed
  return response;
}

/**
 * Extracts JSON body from a Response
 */
export async function getJsonResponse<T = any>(response: NextResponse): Promise<T> {
  const text = await response.text();
  return text ? JSON.parse(text) : {} as T;
}

/**
 * Mocks the Redis client for rate limiting tests
 */
export function mockRateLimitRedis() {
  const mockIncrement = jest.fn().mockImplementation(() => {
    return Promise.resolve([1, Date.now() + 60000]);
  });
  
  const mockGet = jest.fn().mockResolvedValue(0);
  
  // Mock the Redis client
  const mockRedis = {
    eval: jest.fn().mockImplementation((script: string, keys: string[], argv: any[]) => {
      if (script.includes('INCR')) {
        return mockIncrement();
      } else if (script.includes('GET')) {
        return mockGet();
      }
      return null;
    }),
  };

  // Mock the Ratelimit class
  const mockRatelimit = jest.fn().mockImplementation(() => ({
    limit: jest.fn().mockImplementation((identifier: string) => {
      return {
        success: true,
        limit: 100,
        remaining: 99,
        reset: Math.floor(Date.now() / 1000) + 60,
        pending: Promise.resolve({
          success: true,
          limit: 100,
          remaining: 99,
          reset: Math.floor(Date.now() / 1000) + 60,
        }),
      };
    }),
    // Add slidingWindow as a property of the mock function
    slidingWindow: jest.fn().mockReturnValue({
      points: 100,
      duration: 60,
    }),
  }));

  jest.mock('@upstash/ratelimit', () => ({
    Ratelimit: mockRatelimit,
  }));

  jest.mock('@upstash/redis', () => ({
    Redis: {
      fromEnv: jest.fn().mockImplementation(() => mockRedis),
    },
  }));

  return { mockIncrement, mockGet, mockRedis, mockRatelimit };
}
