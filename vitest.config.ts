import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

const coverageScope = process.env.VITEST_COVERAGE_SCOPE ?? "all";
const showTestConsole = /^(1|true|yes|on)$/i.test(
  process.env.TEST_SHOW_CONSOLE ?? process.env.VITEST_VERBOSE_CONSOLE ?? ""
);
const maxWorkers = process.env.VITEST_MAX_WORKERS ?? "50%";
const minWorkers = process.env.VITEST_MIN_WORKERS;
const coverageReportsDirectory =
  coverageScope === "all" ? "coverage" : `coverage/${coverageScope}`;
const isCoreCoverage = coverageScope === "core";
const isPackCoverage = coverageScope === "packs";
const coreCoverageInclude = [
  "src/middleware.ts",
  "src/lib/access/**/*.{ts,tsx}",
  "src/lib/auth.ts",
  "src/lib/browser-storage.ts",
  "src/lib/chat/**/*.{ts,tsx}",
  "src/lib/chatHistory.ts",
  "src/lib/http/**/*.{ts,tsx}",
  "src/lib/i18n.ts",
  "src/lib/legacy-compat.ts",
  "src/lib/platform/pack-ui.tsx",
  "src/lib/platform/packs.ts",
  "src/lib/platform/public-routes.ts",
  "src/lib/platform/settings.ts",
  "src/lib/profile/**/*.{ts,tsx}",
  "src/lib/query/**/*.{ts,tsx}",
  "src/lib/security.ts",
  "src/lib/theme.ts",
  "src/lib/types/**/*.{ts,tsx}",
];

const testInclude = isCoreCoverage
  ? ["src/**/*.test.ts", "src/**/*.test.tsx"]
  : isPackCoverage
    ? ["flow-packs/**/*.test.ts", "flow-packs/**/*.test.tsx"]
    : [
        "src/**/*.test.ts",
        "src/**/*.test.tsx",
        "flow-packs/**/*.test.ts",
        "flow-packs/**/*.test.tsx",
      ];

const coverageInclude = isCoreCoverage
  ? coreCoverageInclude
  : isPackCoverage
    ? ["flow-packs/**/*.{ts,tsx}"]
    : ["src/**/*.{ts,tsx}", "flow-packs/**/*.{ts,tsx}"];

const coverageThresholds = isCoreCoverage
  ? {
      statements: 95,
      branches: 95,
      functions: 95,
      lines: 95,
    }
  : undefined;

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    pool: "threads",
    fileParallelism: true,
    include: testInclude,
    exclude: ["e2e/**", "**/node_modules/**", "src/mcp-server/node_modules/**"],
    maxWorkers,
    ...(minWorkers ? { minWorkers } : {}),
    onConsoleLog() {
      if (showTestConsole) {
        return;
      }

      // Keep output clean by default. Enable TEST_SHOW_CONSOLE=1 when debugging.
      return false;
    },
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@packs": path.resolve(__dirname, "./flow-packs"),
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json-summary", "lcov"],
      reportsDirectory: coverageReportsDirectory,
      include: coverageInclude,
      exclude: [
        "**/*.test.ts",
        "**/*.test.tsx",
        "**/node_modules/**",
        "src/mcp-server/node_modules/**",
        "src/mcp-server/**",
        "src/lib/platform/generated-*.ts",
        "src/lib/platform/generated-*.tsx",
        "src/app/admin/layout.tsx",
        "src/app/sign-in/**",
        "src/app/sign-up/**",
        "src/app/sign-in/[[...sign-in]]/page.tsx",
        "src/app/sign-up/[[...sign-up]]/page.tsx",
        "**/types.ts",
        "src/lib/platform/pack-server.ts",
        "src/app/api/chat/agent-tools-types.ts",
        "src/app/globals.css",
      ],
      ...(coverageThresholds ? { thresholds: coverageThresholds } : {}),
    },
  },
});
