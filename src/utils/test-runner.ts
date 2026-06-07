/* eslint-disable @typescript-eslint/no-explicit-any */
import { logger, MONOCART_REPORT_DIR, PROJECT_ROOT } from '@utils';
import { execSync } from 'child_process';
import { Command } from 'commander';

import fs from 'fs';

import path, { join } from 'path';
const NPX = process.platform === 'win32' ? 'npx.cmd' : 'npx';

const DEFAULT_REPORTER = 'monocart';

// Graceful cancel on Ctrl+C / kill
process.on('SIGINT', () => {
  logger.info('\n^C  Aborted by user.');
  process.exit(0);
});
process.on('SIGTERM', () => {
  logger.info('\n⏹  Terminated.');
  process.exit(0);
});

const program = new Command()
  .name('pw-runner')
  .description('Custom Playwright test runner with report open')
  .option('--env <name>', 'Override Environment switch (qa|uat|stage|dev)', 'dev')
  .option('--reporter <name>', 'Override reporter (monocart|allure|html)', DEFAULT_REPORTER)
  .option('--project <name>', 'Run a specific project (e.g., chromium)', 'chromium')
  .option('--grep <re>', 'Grep by RegExp', '@regression')
  .option('--ui', 'Run Playwright UI mode', false)
  .option('--headed', 'Headed mode', false)
  .option('--workers <n>', 'Number of workers', '1')
  .option('--config <path>', 'Custom config path', join(PROJECT_ROOT, 'playwright.config.ts'))
  .option('--trace <mode>', 'Trace mode (on|off|retain-on-failure|on-first-retry)', 'off')
  .allowUnknownOption(true);

program.parse(process.argv);
const opts = program.opts();

const pwArgs = [`cross-env ENV=${opts.env}`, 'playwright', 'test', '--config', opts.config];
if (opts.project) pwArgs.push('--project', opts.project);
if (opts.grep) pwArgs.push('--grep', opts.grep);
if (opts.ui) pwArgs.push('--ui');
if (opts.headed) pwArgs.push('--headed');
if (opts.workers) pwArgs.push('--workers', String(opts.workers));
if (opts.trace) pwArgs.push('--trace', opts.trace);

// Utility to run shell commands synchronously with nice logs
function run(command: string, env: Record<string, string> = {}) {
  try {
    logger.info(`💻 Running: ${command}`);
    execSync(command, {
      cwd: PROJECT_ROOT,
      stdio: 'inherit',
      env: { ...process.env, ...env },
    });
  } catch (err: any) {
    // Normalize common Ctrl+C signatures across OSes
    const isCtrlC =
      err?.signal === 'SIGINT' ||
      err?.status === 130 || // POSIX: 128 + SIGINT(2)
      err?.status === 2 || // Some shells map SIGINT -> 2
      err?.status === 3221225786; // Windows: 0xC000013A

    if (isCtrlC) {
      logger.info('\n^C  Aborted by user.');
      process.exit(0);
    }

    logger.error(`❌ Command failed: ${command}`);
    // Preserve failing exit for real errors, but don't throw noisy stack
    process.exitCode = typeof err?.status === 'number' ? err.status : 1;
  }
}

// --- 1️⃣ Run Playwright tests ---
const cmd = `${NPX} ${pwArgs.join(' ')}`;
run(cmd);

// --- 2️⃣ Open report based on reporter ---
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const reporter = String(opts.reporter || DEFAULT_REPORTER).toLowerCase();

const reportFile = path.join(MONOCART_REPORT_DIR, 'index.html');
if (fs.existsSync(reportFile)) {
  logger.info(`📊 Opening Monocart report: ${reportFile}`);
  run(`${NPX} monocart show-report "${reportFile}"`);
} else {
  logger.warn('No Monocart report found!');
}
