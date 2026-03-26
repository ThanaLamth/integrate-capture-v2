import path from "node:path";

import { processArticle } from "../batch/process-article";

export interface CliOptions {
  articlePath?: string;
  siteId?: string;
  dryRun?: boolean;
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
    }
  }

  return options;
}

export async function runCli(options: CliOptions = {}): Promise<void> {
  if (!options.articlePath || !options.siteId) {
    return;
  }

  await processArticle({
    articlePath: path.resolve(options.articlePath),
    siteId: options.siteId,
    dryRun: options.dryRun ?? false
  });
}
