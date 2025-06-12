// Import test globals from vitest
import { expect, vi, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import matchers from "@testing-library/jest-dom/matchers";

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Cleanup after each test case
afterEach(() => {
  cleanup();
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
  global.Request = class MockRequest {
    constructor(input, init = {}) {
      this.url = input instanceof URL ? input.href : input;
      this.method = init.method || "GET";
      this.headers = new Headers(init.headers);
      this.body = init.body || null;
      this.bodyUsed = false;
    }

    async arrayBuffer() {
      return new ArrayBuffer(0);
    }

    async text() {
      return "";
    }

    async json() {
      return {};
    }
  };
}

if (!global.Response) {
  global.Response = class MockResponse {
    constructor(body, init = {}) {
      this.body = body;
      this.status = init.status || 200;
      this.statusText = init.statusText || "OK";
      this.headers = new Headers(init.headers);
    }

    async arrayBuffer() {
      return new ArrayBuffer(0);
    }

    async text() {
      return this.body || "";
    }

    async json() {
      return JSON.parse(this.body || "{}");
    }
  };
}
