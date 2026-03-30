import { readFile } from "node:fs/promises";
import path from "node:path";

import { planDraftWorkflow } from "../batch/plan-draft";
import { processArticle } from "../batch/process-article";
import { executeCapture, type CaptureExecutionResult } from "../capture/execute-capture";
import { warmPersistentSession } from "../capture/browser";
import { checkPlatformHealth } from "../platform-health/check-platforms";
import { onboardPlatform } from "../platform-health/onboard-platform";
import { recommendPlatformsForArticle } from "../router/recommend-platforms";
import type { EvidenceType } from "../config/schema";

export interface CliOptions {
  articlePath?: string;
  siteId?: string;
  dryRun?: boolean;
  planDraft?: boolean;
  checkPlatformHealth?: boolean;
  healthPlatformKeys?: string[];
  onboardPlatform?: string;
  onboardSampleUrl?: string;
  onboardSiteName?: string;
  onboardCategory?: string;
  onboardEvidence?: EvidenceType[];
  recommendTitle?: string;
  recommendUrl?: string;
  recommendBodyFile?: string;
  platformKey?: string;
  url?: string;
  captureKey?: string;
  outputPath?: string;
  headless?: boolean;
  profileDir?: string;
  warmup?: boolean;
  captureExecutor?: (request: {
    platformKey: string;
    url: string;
    captureKey: string;
    outputPath: string;
    headless?: boolean;
    profileDir?: string;
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

    if (arg === "--onboard-platform") {
      options.onboardPlatform = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg === "--onboard-sample-url") {
      options.onboardSampleUrl = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg === "--onboard-site-name") {
      options.onboardSiteName = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg === "--onboard-category") {
      options.onboardCategory = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg === "--onboard-evidence") {
      options.onboardEvidence ??= [];
      options.onboardEvidence.push(argv[index + 1] as EvidenceType);
      index += 1;
      continue;
    }

    if (arg === "--plan-draft") {
      options.planDraft = true;
      continue;
    }

    if (arg === "--check-platform-health") {
      options.checkPlatformHealth = true;
      continue;
    }

    if (arg === "--health-platform") {
      options.healthPlatformKeys ??= [];
      options.healthPlatformKeys.push(argv[index + 1]);
      index += 1;
      continue;
    }

    if (arg === "--recommend-title") {
      options.recommendTitle = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg === "--recommend-url") {
      options.recommendUrl = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg === "--recommend-body-file") {
      options.recommendBodyFile = argv[index + 1];
      index += 1;
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
      continue;
    }

    if (arg === "--profile-dir") {
      options.profileDir = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg === "--warmup") {
      options.warmup = true;
    }
  }

  return options;
}

export async function runCli(options: CliOptions = {}): Promise<void> {
  if (options.onboardPlatform && options.onboardSampleUrl) {
    const result = await onboardPlatform({
      platformKey: options.onboardPlatform,
      sampleUrl: options.onboardSampleUrl,
      siteName: options.onboardSiteName,
      category: options.onboardCategory,
      supportsEvidence: options.onboardEvidence
    });
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (options.planDraft && options.articlePath) {
    const plan = await planDraftWorkflow({
      articlePath: path.resolve(options.articlePath),
      siteId: options.siteId
    });
    console.log(JSON.stringify(plan, null, 2));
    return;
  }

  if (options.checkPlatformHealth) {
    const result = await checkPlatformHealth(options.healthPlatformKeys);
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (options.recommendTitle || options.recommendUrl || options.recommendBodyFile) {
    const body = options.recommendBodyFile
      ? await readFile(path.resolve(options.recommendBodyFile), "utf8")
      : undefined;
    const recommendation = await recommendPlatformsForArticle({
      title: options.recommendTitle ?? "",
      url: options.recommendUrl,
      body
    });

    console.log(JSON.stringify(recommendation, null, 2));
    return;
  }

  if (options.warmup && options.url && options.profileDir) {
    await warmPersistentSession(options.url, {
      profileDir: path.resolve(options.profileDir)
    });
    return;
  }

  if (options.platformKey && options.url && options.captureKey && options.outputPath) {
    const captureExecutor = options.captureExecutor ?? executeCapture;

    await captureExecutor({
      platformKey: options.platformKey,
      url: options.url,
      captureKey: options.captureKey,
      outputPath: path.resolve(options.outputPath),
      headless: options.headless,
      profileDir: options.profileDir ? path.resolve(options.profileDir) : undefined
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
