import "@testing-library/jest-dom";

// Mock @farcaster/frame-sdk to avoid test import errors
import { vi } from "vitest";
vi.mock("@farcaster/frame-sdk", () => ({
  __esModule: true,
  default: {},
}));
