/* eslint-disable @typescript-eslint/no-explicit-any */
import { defineConfig, devices, ReporterDescription } from '@playwright/test';
import { MetadataBuilder, PROJECT_ROOT } from '@utils';
import fs from 'fs';

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
    project: process.env.PROJECT_NAME || 'playwright-tests-hybrid',
    preset: 'hybrid',
    ci: 'github',
    reporter: 'monocart',
    language: 'ts',
    env: process.env.ENV || 'dev',
  })
  .build();

/**
 * Inline reporter selection (generator-controlled)
 * - monocart: adds onEnd email hook and trend file
 * - allure:   basic allure-playwright reporter
 * - html:     built-in HTML
 * - list:     simple console reporter
 */

// Define the MonocartSummary interface
interface MonocartSummary {
  name: string;
  dateH: string;
  durationH: string;
  cwd: string;
  outputFile: string;
  outputDir: string;
  system: {
    arch: string;
    platform: string;
    release: string;
    type: string;
    version: string;
    hostname: string;
    node: string;
    playwright: string;
    testDir: string;
    outputFile: string;
    outputDir: string;
  };
  htmlPath: string;
  jsonPath: string;
  summaryTable: any;
}

const reporter: ReporterDescription[] = [
  [
    `${PROJECT_ROOT}/src/utils/custom-reporter.ts`,
    {
      reportMetaData,
    },
  ],
  [
    'monocart-reporter',
    {
      name: process.env.PROJECT_NAME || 'Unified-Test-Automation-Playwright',
      outputFile: path.join(PROJECT_ROOT, 'artifacts', 'reports', 'monocart-report', 'index.html'),
      tags: {
        smoke: {
          style: {
            background: '#6F9913',
          },
          description: 'This is Smoke Test',
        },
        regression: {
          style: {
            background: '#c00',
          },
          description: 'This is Regression Test',
        },
      },
      copyAttachments: false,
      clean: true,
      trend: path.join(PROJECT_ROOT, 'artifacts', 'reports', 'monocart-report', 'index.json'),
      // async hook after report data generated
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      onEnd: async (reportData: any, helper: any) => {
        const monocartReportSummary: MonocartSummary = {
          name: reportData.name,
          dateH: reportData.dateH,
          durationH: reportData.durationH,
          cwd: reportData.cwd,
          outputFile: reportData.outputFile,
          outputDir: reportData.outputDir,
          system: {
            arch: reportData.system.arch,
            platform: reportData.system.platform,
            release: reportData.system.release,
            type: reportData.system.type,
            version: reportData.system.version,
            hostname: reportData.system.hostname,
            node: reportData.system.node,
            playwright: reportData.system.playwright,
            testDir: reportData.system.testDir,
            outputFile: reportData.system.outputFile,
            outputDir: reportData.system.outputDir,
          },
          htmlPath: reportData.htmlPath,
          jsonPath: reportData.jsonPath,
          summaryTable: reportData.summaryTable,
        };

        const globalReportPath = path.join(
          PROJECT_ROOT,
          'artifacts',
          'reports',
          'monocart-report',
          'monocart-report-data.json',
        );

        // save reportData => global JSON
        fs.writeFileSync(globalReportPath, JSON.stringify(monocartReportSummary, null, 2));
      },
      // example categories (edit to suit your project)
      categories: [
        {
          name: 'UI Tests',
          condition: (info: any) => /[\\/]tests[\\/].*ui/i.test(info.file || ''),
        },
        {
          name: 'API Tests',
          condition: (info: any) => /[\\/]tests[\\/].*api/i.test(info.file || ''),
        },
      ],
      theme: 'dark',
      // ✅ Add this charts config block
      charts: {
        categories: {
          type: 'donut',
          tooltip: {
            show: true,
            formatter: (params: any) => {
              // 'params' contains details about the segment hovered
              return `
              <b>${params.name}</b><br/>
              Count: ${params.value}<br/>
              Percentage: ${params.percent}%
            `;
            },
          },
        },
      },
      timestamp: true,
      // zip: { outputFile: path.join(PROJECT_ROOT, "artifacts", "reports", "monocart-report", "monocart-report.zip"), clean: true }
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
