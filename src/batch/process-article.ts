import path from "node:path";
import { mkdir } from "node:fs/promises";

import { extractAssetsFromArticle } from "../article/extract-assets";
import { insertCaptureBlock } from "../article/insert-captures";
import { readDraftArticle } from "../article/read-draft";
import { writeMarkdownArticle } from "../article/write-markdown";
import { loadAssetMap, loadSitePriority } from "../config/loaders";
import { executeCapture, type CaptureExecutionResult } from "../capture/execute-capture";
import { buildCaptureBaseName } from "../output/file-names";
import { appendRunLog } from "../output/write-log";
import { writeMetadataFile } from "../output/write-metadata";
import { resolveTargetsForAsset, type ResolvedTarget } from "../router/resolve-targets";
import type { AssetMatch } from "../shared/types";

export interface ProcessArticleInput {
  articlePath: string;
  siteId: string;
  dryRun: boolean;
  timestamp?: string;
  outputRoot?: string;
  headless?: boolean;
  captureExecutor?: (request: {
    platformKey: string;
    url: string;
    captureKey: string;
    outputPath: string;
    headless?: boolean;
  }) => Promise<CaptureExecutionResult>;
}

export interface ProcessArticleResult {
  matches: AssetMatch[];
  targets: ResolvedTarget[];
  markdown: string;
  imagePaths: string[];
  metadataPaths: string[];
  articlePath?: string;
}

function buildInitialMarkdown(title: string, body: string): string {
  return [`# ${title}`, "", body].join("\n");
}

function currentTimestamp(): string {
  const now = new Date();
  return now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

export async function processArticle(
  input: ProcessArticleInput
): Promise<ProcessArticleResult> {
  const article = await readDraftArticle(input.articlePath);
  const assetMap = await loadAssetMap();
  const sitePriority = await loadSitePriority();
  const matches = extractAssetsFromArticle(article, assetMap);
  const targets: ResolvedTarget[] = [];
  let markdown = buildInitialMarkdown(article.title, article.markdownBody);
  const timestamp = input.timestamp ?? currentTimestamp();
  const outputRoot = input.outputRoot ?? path.join(process.cwd(), "output");
  const imagePaths: string[] = [];
  const metadataPaths: string[] = [];
  const imageDir = path.join(outputRoot, "images");
  const metadataDir = path.join(outputRoot, "metadata");
  const articleDir = path.join(outputRoot, "articles");
  const logDir = path.join(outputRoot, "logs");
  const captureExecutor = input.captureExecutor ?? executeCapture;

  for (const match of matches) {
    const target = await resolveTargetsForAsset({
      siteId: input.siteId,
      assetKey: match.assetKey,
      assetMap,
      sitePriority
    });

    if (!target) {
      continue;
    }

    targets.push(target);

    const baseName = buildCaptureBaseName({
      siteId: input.siteId,
      assetSlug: match.assetKey,
      platformKey: target.platformKey,
      captureKey: "price_chart",
      timestamp
    });
    const imagePath = path.join(imageDir, `${baseName}.png`);
    let captureResult: CaptureExecutionResult | null = null;

    if (!input.dryRun) {
      await mkdir(imageDir, { recursive: true });
      captureResult = await captureExecutor({
        platformKey: target.platformKey,
        url: target.url,
        captureKey: "price_chart",
        outputPath: imagePath,
        headless: input.headless
      });

      imagePaths.push(captureResult.outputPath);

      const metadataPath = await writeMetadataFile(metadataDir, baseName, {
        siteId: input.siteId,
        assetKey: match.assetKey,
        url: target.url,
        platformKey: target.platformKey,
        captureKey: "price_chart",
        selectorUsed: captureResult.selectorUsed,
        mode: captureResult.mode,
        timestamp,
        success: true
      });
      metadataPaths.push(metadataPath);

      await appendRunLog(
        logDir,
        `${timestamp}\t${input.siteId}\t${match.assetKey}\t${target.platformKey}\t${target.url}\tsuccess`
      );
    }

    markdown = insertCaptureBlock({
      markdown,
      assetKey: match.assetKey,
      platformKey: target.platformKey,
      captureKey: "price_chart",
      imagePath: `../images/${baseName}.png`
    });
  }

  let articlePath: string | undefined;
  if (!input.dryRun) {
    const sourceName = path.basename(input.articlePath, path.extname(input.articlePath));
    articlePath = await writeMarkdownArticle(articleDir, `${sourceName}.md`, markdown);
  }

  return {
    matches,
    targets,
    markdown,
    imagePaths,
    metadataPaths,
    articlePath
  };
}
