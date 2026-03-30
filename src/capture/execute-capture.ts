import { mkdir } from "node:fs/promises";
import path from "node:path";

import type { Locator, Page } from "playwright";

import { loadPlatformConfig } from "../config/loaders";
import { buildCropRegion, decideCaptureMode, selectCaptureDefinition } from "./capture-region";
import { validateCropRegion } from "./crop-image";
import { launchBrowserSession } from "./browser";
import { prepareCoinGeckoPage } from "./prepare-coingecko";
import { prepareCoinMetricsPage } from "./prepare-coinmetrics";
import { prepareCoinMarketCapPage } from "./prepare-coinmarketcap";
import { prepareGenericPage } from "./prepare-generic-page";
import { prepareSantimentPage } from "./prepare-santiment";
import { prepareTradingEconomicsPage } from "./prepare-tradingeconomics";
import { prepareYahooFinancePage } from "./prepare-yahoo-finance";
import { extractPageContext, type CapturePageContext } from "./extract-page-context";
import { ensureUsefulCapturePage, isBroadCaptureSelector } from "./validate-page-content";

export interface CaptureExecutionRequest {
  platformKey: string;
  url: string;
  captureKey: string;
  outputPath: string;
  headless?: boolean;
  profileDir?: string;
}

export interface CaptureExecutionResult {
  outputPath: string;
  selectorUsed: string;
  mode: "element" | "crop";
  pageContext: CapturePageContext;
}

function userAgentForPlatform(platformKey: string): string | undefined {
  if (platformKey === "sec-edgar") {
    return "coincu thana@coincu.com";
  }

  return undefined;
}

async function firstMatchingLocator(page: Page, selectors: string[]): Promise<{
  selector: string;
  locator: Locator;
} | null> {
  for (const selector of selectors) {
    const locator = page.locator(toPlaywrightSelector(selector)).first();
    if ((await locator.count()) > 0) {
      return { selector, locator };
    }
  }

  return null;
}

export function toPlaywrightSelector(selector: string): string {
  const trimmed = selector.trim();
  if (trimmed.startsWith("/")) {
    return `xpath=${trimmed}`;
  }

  return trimmed;
}

export function resolveHeadlessMode(platformKey: string, requestedHeadless?: boolean): boolean {
  if (requestedHeadless !== undefined) {
    return requestedHeadless;
  }

  if (
    platformKey === "coingecko" ||
    platformKey === "defillama" ||
    platformKey === "cryptoquant" ||
    platformKey === "glassnode"
  ) {
    return false;
  }

  return true;
}

export async function executeCapture(
  request: CaptureExecutionRequest
): Promise<CaptureExecutionResult> {
  const config = await loadPlatformConfig(request.platformKey);
  const pageType =
    config.matchRules.find((rule) =>
      rule.urlPatterns.some((pattern) => new RegExp(pattern, "i").test(request.url))
    )?.pageType ?? config.matchRules[0]?.pageType;

  if (!pageType) {
    throw new Error(`No page type matched for ${request.platformKey} and URL ${request.url}`);
  }

  const capture = selectCaptureDefinition(config, pageType, request.captureKey);
  await mkdir(path.dirname(request.outputPath), { recursive: true });

  const session = await launchBrowserSession({
    headless: resolveHeadlessMode(request.platformKey, request.headless),
    profileDir: request.profileDir,
    userAgent: userAgentForPlatform(request.platformKey)
  });

  try {
    const page = session.page;
    await page.setViewportSize({
      width: config.viewports.default.width,
      height: config.viewports.default.height
    });

    await page.goto(request.url, {
      waitUntil: "domcontentloaded",
      timeout: 60000
    });
    await prepareGenericPage(page);
    await prepareCoinMarketCapPage(page, request.url);
    await prepareCoinGeckoPage(page, request.url);
    await prepareCoinMetricsPage(page, request.url);
    await prepareSantimentPage(page, request.url);
    await prepareTradingEconomicsPage(page, request.url);
    await prepareYahooFinancePage(page, request.url);
    await prepareGenericPage(page);

    for (const selector of config.waitConditions.requiredSelectors) {
      try {
        await page.locator(toPlaywrightSelector(selector)).first().waitFor({
          state: "visible",
          timeout: config.waitConditions.networkIdleMs
        });
        break;
      } catch {
        // Continue to the next selector.
      }
    }

    await page.waitForTimeout(config.waitConditions.extraDelayMs);

    const usefulDataSelector = await ensureUsefulCapturePage(page, request.platformKey);
    const pageContext = await extractPageContext(page);
    let primaryMatch = await firstMatchingLocator(page, capture.selectors);
    if (
      primaryMatch &&
      isBroadCaptureSelector(primaryMatch.selector) &&
      !isBroadCaptureSelector(usefulDataSelector)
    ) {
      primaryMatch = await firstMatchingLocator(page, [usefulDataSelector]);
    }
    const mode = decideCaptureMode({
      strategy: capture.strategy,
      primarySelectorFound: Boolean(primaryMatch)
    });

    if (mode === "element" && !primaryMatch) {
      throw new Error(
        `Primary selector not found for ${request.platformKey}:${request.captureKey}`
      );
    }

    if (mode === "element" && primaryMatch) {
      if (capture.scrollIntoView) {
        await primaryMatch.locator.scrollIntoViewIfNeeded();
      }

      await primaryMatch.locator.screenshot({
        path: request.outputPath
      });

      return {
        outputPath: request.outputPath,
        selectorUsed: primaryMatch.selector,
        mode,
        pageContext
      };
    }

    if (!capture.cropRules) {
      throw new Error(`Crop fallback requires cropRules for ${request.platformKey}:${request.captureKey}`);
    }

    let anchorMatch =
      (await firstMatchingLocator(page, [capture.cropRules.anchorSelector])) ??
      (await firstMatchingLocator(page, capture.fallbackSelectors));

    if (
      anchorMatch &&
      isBroadCaptureSelector(anchorMatch.selector) &&
      !isBroadCaptureSelector(usefulDataSelector)
    ) {
      anchorMatch = await firstMatchingLocator(page, [usefulDataSelector]);
    }

    if (!anchorMatch) {
      throw new Error(`No anchor selector found for crop fallback on ${request.platformKey}`);
    }

    if (capture.scrollIntoView) {
      await anchorMatch.locator.scrollIntoViewIfNeeded();
    }

    const anchorBox = await anchorMatch.locator.boundingBox();
    if (!anchorBox) {
      throw new Error(`Anchor bounding box was unavailable for ${request.platformKey}`);
    }

    const clip = validateCropRegion(buildCropRegion(anchorBox, capture.cropRules));
    await page.screenshot({
      path: request.outputPath,
      clip
    });

    return {
      outputPath: request.outputPath,
      selectorUsed: anchorMatch.selector,
      mode,
      pageContext
    };
  } finally {
    await session.close();
  }
}
