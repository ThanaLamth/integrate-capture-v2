import path from "node:path";

import { processArticle } from "../batch/process-article";
import { executeCapture, type CaptureExecutionResult } from "../capture/execute-capture";

export interface CliOptions {
  articlePath?: string;
  siteId?: string;
  dryRun?: boolean;
  platformKey?: string;
  url?: string;
  captureKey?: string;
  outputPath?: string;
  headless?: boolean;
  captureExecutor?: (request: {
    platformKey: string;
    url: string;
    captureKey: string;
    outputPath: string;
    headless?: boolean;
  }) => Promise<CaptureExecutionResult>;
}

export function parseCliArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    dryRun: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--article") {
      options.articlePath = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg === "--site") {
      options.siteId = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }

    if (arg === "--platform") {
      options.platformKey = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg === "--url") {
      options.url = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg === "--capture") {
      options.captureKey = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg === "--output") {
      options.outputPath = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg === "--headed") {
      options.headless = false;
    }
  }

  return options;
}

export async function runCli(options: CliOptions = {}): Promise<void> {
  if (options.platformKey && options.url && options.captureKey && options.outputPath) {
    const captureExecutor = options.captureExecutor ?? executeCapture;

    await captureExecutor({
      platformKey: options.platformKey,
      url: options.url,
      captureKey: options.captureKey,
      outputPath: path.resolve(options.outputPath),
      headless: options.headless
    });
    return;
  }

  if (!options.articlePath || !options.siteId) {
    return;
  }

  await processArticle({
    articlePath: path.resolve(options.articlePath),
    siteId: options.siteId,
    dryRun: options.dryRun ?? false
  });
}
