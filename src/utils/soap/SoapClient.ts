import { request as baseRequest, type TestInfo } from '@playwright/test';
import { logger, parseSoapResponse } from '@utils';

export interface SoapOptions {
  url?: string;
  headers?: Record<string, string>;
  soapAction?: string;
  body?: string;
  responsePath?: string; // JSON path to extract result
  log?: boolean;
}

export class SoapClient {
  private requestContext;
  private soapOptions: SoapOptions;
  private testInfo: TestInfo;
  private log: boolean;

  constructor(soapOptions: SoapOptions, testInfo: TestInfo) {
    this.requestContext = baseRequest.newContext();
    this.soapOptions = soapOptions;
    this.testInfo = testInfo;
    this.log = soapOptions.log || false;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async call<T = any>(
    soapOptions?: SoapOptions,
  ): Promise<{
    status: number;
    rawBody: string;
    parsed?: T;
  }> {
    const reqContext = await this.requestContext;
    const url = soapOptions?.url || this.soapOptions.url;
    if (!url) {
      throw new Error('A valid URL must be provided for the SOAP request.');
    }

    const headers = soapOptions?.headers ?? this.soapOptions.headers;
    const data = soapOptions?.body ?? this.soapOptions.body;

    const response = await reqContext.post(url, {
      headers: headers,
      data: data,
    });
    const responseText = await response.text();

    const result = {
      status: response.status(),
      rawBody: responseText,
      parsed:
        response.status() < 500
          ? parseSoapResponse<T>(
              responseText,
              soapOptions?.responsePath ??
                this.soapOptions.responsePath ??
                (() => {
                  throw new Error('A valid responsePath must be provided.');
                })(),
            )
          : undefined,
    };
    logger.info(`SOAP Call Result: ${JSON.stringify(result, null, 2)}`);
    return result;
  }

  async dispose() {
    const reqContext = await this.requestContext;
    await reqContext
      .dispose()
      .then(() => {
        if (this.log === true) {
          logger.info(`SOAP request context disposed for test: ${this.testInfo.title}`);
        }
      })
      .catch((error) => {
        logger.error(
          `Failed to dispose SOAP request context for test: ${this.testInfo.title}`,
          error,
        );
      });
  }
}
