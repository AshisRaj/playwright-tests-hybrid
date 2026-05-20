/* eslint-disable @typescript-eslint/no-explicit-any */
import { defineConfig, devices, ReporterDescription } from '@playwright/test';
import { MetadataBuilder, PROJECT_ROOT } from '@utils';
import path from 'path';
import getConfig from './src/configs';

// Load typed config (reads .env.<env> when present). Default: dev
const cfg = getConfig();

/**
 * Shared metadata available for reporters
 */

const reportMetaData = new MetadataBuilder()
  .addBase({
    // injected by generator
    project: process.env.PROJECT_NAME || 'Playwright E2E Framework',
    preset: 'hybrid',
    ci: 'github',
    reporter: cfg.reporter,
    language: 'ts',
    env: cfg.envName,
  })
  .build();

/**
 * Inline reporter selection (generator-controlled)
 * - monocart: adds onEnd email hook and trend file
 * - allure:   basic allure-playwright reporter
 * - html:     built-in HTML
 * - list:     simple console reporter
 */

const reporter: ReporterDescription[] = [
  [
    './src/reporters/custom-reporter.ts',
    {
      reportMetaData,
    },
  ],
  [
    'allure-playwright',
    {
      // tweak as needed
      detail: true,
      resultsDir: path.join(PROJECT_ROOT, 'artifacts', 'reports', 'allure-results'),
      suiteTitle: true,
      open: 'never',
      environmentInfo: {
        ...reportMetaData,
      },
    },
  ] as [string, any],
];

export default defineConfig({
  // -------------------------------
  // GLOBAL TEST TIMEOUTS
  // -------------------------------
  // CI (Stable App) timeout: 60_000,
  // CI (Flaky App / Slow Environments) timeout: 120_000,
  // Local Development
  timeout: cfg.timeout, // default: 30s per test

  // CI (Stable App) expect: { timeout: 7_000 },
  // CI (Flaky App / Slow Environments) expect: { timeout: 10_000 },
  // Local Development
  expect: {
    timeout: cfg.expectTimeout, // default: 5s for expect() checks
  },
  // Global hooks
  // Global Setup to run before all tests
  globalSetup: './src/utils/global-setup',
  // Global Teardown to run after all tests
  globalTeardown: './src/utils/global-teardown',

  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  // Provide top-level metadata for Playwright
  metadata: reportMetaData,

  // Reporters (selected above)
  reporter,

  // Shared options
  use: {
    baseURL: cfg.baseURL,
    trace: 'off',
    video: 'off',
    screenshot: 'only-on-failure',
  },

  // Where Playwright writes its artifacts for each test
  outputDir: cfg.reportDir || path.join(PROJECT_ROOT, 'artifacts', 'reports'),

  // Browsers
  projects: [
    ...cfg.projects.map((p) => ({
      name: p.name,
      use: {
        ...(p.device ? devices[p.device as keyof typeof devices] : devices['Desktop Chrome']),
        // -------------------------------
        // ACTION TIMEOUTS
        // -------------------------------
        // CI (Stable App) actionTimeout: 15_000,
        // CI (Flaky App / Slow Environments) actionTimeout: 20_000,
        // Local Development
        actionTimeout: p.actionTimeout ?? cfg.actionTimeout ?? 0,
        navigationTimeout: p.navigationTimeout ?? cfg.navigationTimeout ?? 0,
      },
      metadata: reportMetaData,
    })),
    // { name: 'firefox', use: { ...devices['Desktop Firefox'] }, metadata: reportMetaData },
    // { name: 'webkit', use: { ...devices['Desktop Safari'] }, metadata: reportMetaData },
    // { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] }, metadata: reportMetaData },
    // { name: 'Mobile Safari', use: { ...devices['iPhone 12'] }, metadata: reportMetaData },
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    //   metadata: reportMetaData,
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    //   metadata: reportMetaData,
    // },
  ],

  // Dev server example:
  // webServer: {
  //   command: "npm run start",
  //   url: "http://127.0.0.1:3000",
  //   reuseExistingServer: !process.env.CI
  // }
});
