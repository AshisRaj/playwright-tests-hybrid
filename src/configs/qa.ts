import defaultConfig from './default';
import { FrameworkConfig } from './types';

const qaConfig: Partial<FrameworkConfig> = {
  envName: 'qa',
  baseURL: process.env.BASE_URL || 'https://qa.example.com',
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  reporter: (process.env.REPORTER as any) || defaultConfig.reporter,
  reportDir: defaultConfig.reportDir,
  timeout: 120000,
  expectTimeout: 15000,
  actionTimeout: 15000,
};

export default qaConfig;
