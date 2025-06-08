import type { Config } from "@jest/types";

const config: Config.InitialOptions = {
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "node",
  testMatch: ["**/*.test.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/app/$1",
    "^@/app/(.*)$": "<rootDir>/app/$1",
    "^@/components/(.*)$": "<rootDir>/components/$1",
    "^@/styles/(.*)$": "<rootDir>/styles/$1",
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  setupFiles: ["dotenv/config", "./tests/setup.ts"],
  testTimeout: 30000, // 30 seconds timeout for async tests
  transform: {
    "^.+\\.(t|j)sx?$": [
      "ts-jest",
      {
        useESM: true,
        isolatedModules: true,
        tsconfig: "tsconfig.json",
      },
    ],
  },
  extensionsToTreatAsEsm: [".ts"],
  moduleDirectories: ["node_modules", "<rootDir>"],
  moduleFileExtensions: ["js", "json", "ts"],
  transformIgnorePatterns: [
    "node_modules/(?!(jose|@coinbase/cdp-sdk|uuid|@coinbase/cdp-sdk/node-fetch|node-fetch|@coinbase/cdp-sdk/node_modules/jose)/)",
  ],
  globals: {
    "ts-jest": {
      useESM: true,
      isolatedModules: true,
      tsconfig: "tsconfig.json",
    },
  },
  resolver: "jest-ts-webcompat-resolver",
};

export default config;
