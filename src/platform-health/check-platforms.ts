import { loadPlatformConfig, loadPlatformHealthTargets, writePlatformHealthStatus } from "../config/loaders";
import type { PlatformHealthEntry, PlatformHealthStatus } from "../config/schema";
import { toPlaywrightSelector } from "../capture/execute-capture";
import { prepareCoinMarketCapPage } from "../capture/prepare-coinmarketcap";
import { prepareCoinGeckoPage } from "../capture/prepare-coingecko";
import { prepareCoinMetricsPage } from "../capture/prepare-coinmetrics";
import { prepareGenericPage } from "../capture/prepare-generic-page";
import { prepareSantimentPage } from "../capture/prepare-santiment";
import { prepareTradingEconomicsPage } from "../capture/prepare-tradingeconomics";
import { prepareYahooFinancePage } from "../capture/prepare-yahoo-finance";
import { findUsefulDataSelector, isBroadCaptureSelector } from "../capture/validate-page-content";

export interface PlatformProbeResult {
  ok: boolean;
  statusCode?: number;
  finalUrl?: string;
  title?: string;
  bodySnippet?: string;
  error?: string;
}

export type PlatformProbe = (url: string) => Promise<PlatformProbeResult>;
export type PlatformSelectorChecker = (platformKey: string, sampleUrl: string) => Promise<CaptureCheck[]>;

export interface PlatformHealthCheckResult {
  outputPath: string;
  status: PlatformHealthStatus;
}

interface CaptureCheck {
  captureKey: string;
  pageType: string;
  status: "ready" | "missing_selector" | "missing_anchor" | "error";
  selector?: string;
  detail?: string;
}

function extractTitle(html: string): string | undefined {
  const match = html.match(/<title[^>]*>(.*?)<\/title>/is);
  return match?.[1]?.replace(/\s+/g, " ").trim();
}

function toSnippet(html: string): string {
  return html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 400);
}

function isAccessBlockText(haystack: string): boolean {
  return (
    haystack.includes("just a moment") ||
    haystack.includes("verifying you are human") ||
    haystack.includes("captcha") ||
    haystack.includes("access denied") ||
    haystack.includes("your request originates from an undeclared automated tool")
  );
}

function userAgentForUrl(url: string): string {
  if (/sec\.gov/i.test(url)) {
    return "coincu thana@coincu.com";
  }

  return "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36";
}

export async function defaultProbe(url: string): Promise<PlatformProbeResult> {
  try {
    const response = await fetch(url, {
      redirect: "follow",
      headers: {
        "user-agent": userAgentForUrl(url)
      }
    });
    const html = await response.text();

    return {
      ok: response.ok,
      statusCode: response.status,
      finalUrl: response.url,
      title: extractTitle(html),
      bodySnippet: toSnippet(html)
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

export function classifyProbeResult(sampleUrl: string, result: PlatformProbeResult): PlatformHealthEntry {
  const haystack = `${result.title ?? ""}\n${result.bodySnippet ?? ""}`.toLowerCase();
  const checkedAt = new Date().toISOString();

  if (result.error) {
    return {
      status: "broken",
      checkedAt,
      detail: result.error,
      sampleUrl
    };
  }

  if (isAccessBlockText(haystack)) {
    return {
      status: "blocked",
      checkedAt,
      detail: `Probe matched anti-bot or access-block text (HTTP ${result.statusCode ?? 0})`,
      sampleUrl,
      finalUrl: result.finalUrl,
      title: result.title
    };
  }

  if (!result.ok) {
    return {
      status: "broken",
      checkedAt,
      detail: `HTTP ${result.statusCode ?? 0}`,
      sampleUrl,
      finalUrl: result.finalUrl,
      title: result.title
    };
  }

  return {
    status: "healthy",
    checkedAt,
    detail: `HTTP ${result.statusCode ?? 200}`,
    sampleUrl,
    finalUrl: result.finalUrl,
    title: result.title
  };
}

async function prepareKnownPage(page: import("playwright").Page, url: string): Promise<void> {
  await prepareGenericPage(page).catch(() => undefined);
  await prepareCoinMarketCapPage(page, url).catch(() => undefined);
  await prepareCoinGeckoPage(page, url).catch(() => undefined);
  await prepareCoinMetricsPage(page, url).catch(() => undefined);
  await prepareSantimentPage(page, url).catch(() => undefined);
  await prepareTradingEconomicsPage(page, url).catch(() => undefined);
  await prepareYahooFinancePage(page, url).catch(() => undefined);
  await prepareGenericPage(page).catch(() => undefined);
}

async function runCaptureChecks(platformKey: string, sampleUrl: string): Promise<CaptureCheck[]> {
  const config = await loadPlatformConfig(platformKey);
  const matchedRule = config.matchRules.find((rule) =>
    rule.urlPatterns.some((pattern) => new RegExp(pattern, "i").test(sampleUrl))
  );

  if (!matchedRule) {
    return [];
  }

  const playwright = await import("playwright");
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({
      viewport: {
        width: config.viewports.default.width,
        height: config.viewports.default.height
      },
      deviceScaleFactor: config.viewports.default.deviceScaleFactor,
      userAgent: userAgentForUrl(sampleUrl)
    });
    const page = await context.newPage();
    await page.goto(sampleUrl, {
      waitUntil: "domcontentloaded",
      timeout: 45000
    });
    await prepareKnownPage(page, sampleUrl);
    await page.waitForTimeout(Math.min(config.waitConditions.extraDelayMs, 4000));
    const usefulDataSelector = await findUsefulDataSelector(page);

    const title = (await page.title()).toLowerCase();
    const bodyText = (await page.locator("body").innerText().catch(() => "")).toLowerCase();
    if (isAccessBlockText(`${title}\n${bodyText}`)) {
      return config.captures
        .filter((capture) => capture.pageType === matchedRule.pageType)
        .map((capture) => ({
          captureKey: capture.captureKey,
          pageType: capture.pageType,
          status: "error" as const,
          detail: "Browser landed on an access-block page"
        }));
    }

    const relevantCaptures = config.captures.filter((capture) => capture.pageType === matchedRule.pageType);
    const results: CaptureCheck[] = [];

    for (const capture of relevantCaptures) {
      try {
        let foundSelector: string | undefined;

        for (const selector of capture.selectors) {
          const locator = page.locator(toPlaywrightSelector(selector)).first();
          if ((await locator.count()) > 0) {
            foundSelector = selector;
            break;
          }
        }

        if (foundSelector) {
          if (
            isBroadCaptureSelector(foundSelector) &&
            !usefulDataSelector
          ) {
            results.push({
              captureKey: capture.captureKey,
              pageType: capture.pageType,
              status: "missing_selector",
              detail: "Page loaded but no chart or meaningful data block was detected"
            });
            continue;
          }

          if (
            isBroadCaptureSelector(foundSelector) &&
            usefulDataSelector &&
            !isBroadCaptureSelector(usefulDataSelector)
          ) {
            foundSelector = usefulDataSelector;
          }

          results.push({
            captureKey: capture.captureKey,
            pageType: capture.pageType,
            status: "ready",
            selector: foundSelector
          });
          continue;
        }

        if (capture.cropRules) {
          const locator = page.locator(toPlaywrightSelector(capture.cropRules.anchorSelector)).first();
          if ((await locator.count()) > 0) {
            const selector =
              isBroadCaptureSelector(capture.cropRules.anchorSelector) &&
              usefulDataSelector &&
              !isBroadCaptureSelector(usefulDataSelector)
                ? usefulDataSelector
                : capture.cropRules.anchorSelector;
            results.push({
              captureKey: capture.captureKey,
              pageType: capture.pageType,
              status: "ready",
              selector,
              detail: "Crop anchor found"
            });
          } else {
            results.push({
              captureKey: capture.captureKey,
              pageType: capture.pageType,
              status: "missing_anchor",
              detail: capture.cropRules.anchorSelector
            });
          }
          continue;
        }

        results.push({
          captureKey: capture.captureKey,
          pageType: capture.pageType,
          status: "missing_selector",
          detail: capture.selectors.join(" | ")
        });
      } catch (error) {
        results.push({
          captureKey: capture.captureKey,
          pageType: capture.pageType,
          status: "error",
          detail: error instanceof Error ? error.message : String(error)
        });
      }
    }

    await context.close();
    return results;
  } finally {
    await browser.close();
  }
}

export async function checkPlatformHealth(
  platformKeys?: string[],
  probe: PlatformProbe = defaultProbe,
  selectorChecker: PlatformSelectorChecker = runCaptureChecks
): Promise<PlatformHealthCheckResult> {
  const targets = await loadPlatformHealthTargets();
  const selectedTargets = platformKeys && platformKeys.length > 0
    ? targets.targets.filter((target) => platformKeys.includes(target.platformKey))
    : targets.targets;

  const platforms = Object.fromEntries(
    await Promise.all(
      selectedTargets.map(async (target) => {
        const probeResult = await probe(target.sampleUrl);
        const entry = classifyProbeResult(target.sampleUrl, probeResult);

        if (entry.status === "healthy") {
          entry.captureChecks = await selectorChecker(target.platformKey, target.sampleUrl).catch(
            (error) => [
              {
                captureKey: "all",
                pageType: "unknown",
                status: "error" as const,
                detail: error instanceof Error ? error.message : String(error)
              }
            ]
          );
        }

        return [target.platformKey, entry];
      })
    )
  );

  const status: PlatformHealthStatus = { platforms };
  const outputPath = await writePlatformHealthStatus(status);

  return {
    outputPath,
    status
  };
}
