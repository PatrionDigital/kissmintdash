// Import test globals from vitest
import { expect, vi, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Import and extend Vitest's expect with jest-dom matchers
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
Object.entries(matchers).forEach(([key, matcher]) => {
  // @ts-expect-error - Dynamic property access
  expect[key] = matcher;
});

// Add type definitions for the matchers
type MatcherResult = Promise<void> | void;

declare global {
  // Extend Vitest's expect with custom matchers
  namespace Vi {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface JestAssertion<T = unknown> extends CustomMatchers<T> {}
    interface AsymmetricMatchersContaining extends CustomMatchers {}
  }

  // Extend Window and GlobalThis with our mocks
  interface Window {
    matchMedia: (query: string) => MediaQueryList;
    ethereum: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, callback: (...args: unknown[]) => void) => void;
      removeListener: (event: string, callback: (...args: unknown[]) => void) => void;
      isMetaMask: boolean;
    };
  }

  // Extend NodeJS.Global for Node.js global types
  namespace NodeJS {
    interface Global {
      ethereum: Window['ethereum'];
      TextEncoder: typeof TextEncoder;
      TextDecoder: typeof TextDecoder;
      Blob: typeof Blob;
      File: typeof File;
      Readable: typeof Readable;
      Request: typeof Request;
      Response: typeof Response;
    }
  }
}

// Cleanup after each test case
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Mock Next.js router
vi.mock("next/router", () => require("next-router-mock"));

// Mock Next.js navigation (App Router)
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/",
}));

// Mock environment variables
process.env = {
  ...process.env,
  NODE_ENV: "test",
  NEXT_PUBLIC_ONCHAINKIT_API_KEY: "test_api_key",
  NEYNAR_API_KEY: "test_neynar_key",
  NEXT_PUBLIC_TOKEN_ADDRESS: "0x1234567890abcdef1234567890abcdef12345678",
  CDP_PAYOUT_ACCOUNT_ID: "test_payout_account_id",
  CDP_BASE_NETWORK_ID: "test_network_id",
  TURSO_DB_URL: "file:test.db",
  TURSO_DB_AUTH_TOKEN: "test_auth_token",
  REDIS_URL: "redis://localhost:6379",
  NEXTAUTH_URL: "http://localhost:3000",
};

// Mock Web3/Wallet APIs
global.ethereum = {
  request: vi.fn(),
  on: vi.fn(),
  removeListener: vi.fn(),
  isMetaMask: true,
};

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock Web APIs that might be needed
if (!global.TextEncoder) {
  const { TextEncoder, TextDecoder } = require("node:util");
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

if (!global.Blob) {
  global.Blob = require("node:buffer").Blob;
}

if (!global.File) {
  global.File = require("node:buffer").File;
}

if (!global.Readable) {
  global.Readable = require("node:stream").Readable;
}

// Mock Request and Response if needed
if (!global.Request) {
  class MockRequest implements Request {
    readonly cache: RequestCache = 'default';
    readonly credentials: RequestCredentials = 'same-origin';
    readonly destination: RequestDestination = '';
    readonly headers: Headers;
    readonly integrity: string = '';
    readonly isHistoryNavigation: boolean = false;
    readonly isReloadNavigation: boolean = false;
    readonly keepalive: boolean = false;
    method: string;
    readonly mode: RequestMode = 'cors';
    readonly redirect: RequestRedirect = 'follow';
    readonly referrer: string = '';
    readonly referrerPolicy: ReferrerPolicy = '';
    readonly signal: AbortSignal = new AbortController().signal;
    readonly url: string;
    body: ReadableStream<Uint8Array> | null = null;
    bodyUsed: boolean = false;
    readonly duplex: RequestDuplex = 'half';
    readonly priority: string = 'auto';

    constructor(input: RequestInfo | URL, init: RequestInit = {}) {
      this.url = input instanceof URL ? input.href : input.toString();
      this.method = init.method?.toUpperCase() || 'GET';
      this.headers = new Headers(init.headers);
      
      if (init.body) {
        if (typeof init.body === 'string') {
          const encoder = new TextEncoder();
          const stream = new ReadableStream({
            start(controller) {
              controller.enqueue(encoder.encode(init.body as string));
              controller.close();
            }
          });
          this.body = stream;
        }
      }
    }

    async arrayBuffer(): Promise<ArrayBuffer> {
      return new ArrayBuffer(0);
    }

    async blob(): Promise<Blob> {
      return new Blob();
    }

    async formData(): Promise<FormData> {
      return new FormData();
    }

    async json(): Promise<unknown> {
      return {};
    }

    async text(): Promise<string> {
      return '';
    }

    clone(): Request {
      return new MockRequest(this.url, {
        method: this.method,
        headers: this.headers,
        body: this.body,
      });
    }
  }

  global.Request = MockRequest as unknown as typeof Request;
}

if (!global.Response) {
  class MockResponse implements Response {
    readonly body: ReadableStream<Uint8Array> | null = null;
    readonly bodyUsed: boolean = false;
    readonly headers: Headers;
    readonly ok: boolean;
    readonly redirected: boolean = false;
    readonly status: number;
    readonly statusText: string;
    readonly type: ResponseType = 'default';
    readonly url: string = '';
    readonly trailer: Promise<Headers> = Promise.resolve(new Headers());

    constructor(body?: BodyInit | null, init: ResponseInit = {}) {
      this.status = init.status || 200;
      this.statusText = init.statusText || 'OK';
      this.headers = new Headers(init.headers);
      this.ok = this.status >= 200 && this.status < 300;

      if (body) {
        if (typeof body === 'string') {
          const encoder = new TextEncoder();
          this.body = new ReadableStream({
            start(controller) {
              controller.enqueue(encoder.encode(body as string));
              controller.close();
            }
          });
        }
      }
    }

    get [Symbol.toStringTag](): string {
      return 'Response';
    }

    async arrayBuffer(): Promise<ArrayBuffer> {
      return new ArrayBuffer(0);
    }

    async blob(): Promise<Blob> {
      return new Blob();
    }

    async formData(): Promise<FormData> {
      return new FormData();
    }

    async json(): Promise<unknown> {
      try {
        const text = await this.text();
        return text ? JSON.parse(text) : {};
      } catch {
        return {};
      }
    }

    async text(): Promise<string> {
      if (!this.body) return '';
      
      const reader = this.body.getReader();
      const decoder = new TextDecoder();
      let result = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        result += decoder.decode(value, { stream: true });
      }
      
      return result;
    }

    clone(): Response {
      return new MockResponse(this.body, {
        status: this.status,
        statusText: this.statusText,
        headers: this.headers,
      });
    }

    get bodyUsed(): boolean {
      return this.bodyUsed;
    }
  }

  // Add static methods to Response
  MockResponse.error = (): Response => new MockResponse(null, { status: 0 });
  MockResponse.redirect = (url: string | URL, status: number): Response => {
    const response = new MockResponse(null, { status });
    response.headers.set('Location', url.toString());
    return response;
  };
  MockResponse.json = (data: unknown, init: ResponseInit = {}): Response => {
    const headers = new Headers(init.headers);
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    return new MockResponse(JSON.stringify(data), {
      ...init,
      headers,
    });
  };

  global.Response = MockResponse as unknown as typeof Response;
}
