import type { Locator, Page } from "playwright";

const DATA_INDICATOR_SELECTORS = [
  ".highcharts-container",
  ".echarts-for-react",
  ".tradingview-widget-container",
  "[class*='chart']",
  "[class*='Chart']",
  "[class*='graph']",
  "[class*='Graph']",
  "[class*='table']",
  "[class*='Table']",
  "[role='table']",
  "table",
  "canvas",
  "svg"
];

const BROAD_SELECTORS = new Set(["body", "main", "article", "html"]);

function isLikelyIcon(selector: string, className: string | null, width: number, height: number): boolean {
  if (selector !== "svg") {
    return false;
  }

  if (width < 180 || height < 120) {
    return true;
  }

  return /MuiSvgIcon|icon/i.test(className ?? "");
}

async function getUsefulIndicator(selector: string, locator: Locator): Promise<boolean> {
  const handle = await locator.elementHandle();
  if (!handle) {
    return false;
  }

  const details = await handle.evaluate((node) => {
    const element = node as HTMLElement;
    const rect = element.getBoundingClientRect();
    const className = element.getAttribute("class");
    const rowCount =
      element.tagName.toLowerCase() === "table"
        ? element.querySelectorAll("tr").length
        : 0;

    return {
      width: rect.width,
      height: rect.height,
      className,
      rowCount
    };
  });

  if (isLikelyIcon(selector, details.className, details.width, details.height)) {
    return false;
  }

  if (selector === "table" || selector === "[role='table']") {
    return details.rowCount >= 3 && details.width >= 240;
  }

  return details.width >= 260 && details.height >= 160;
}

export function isBroadCaptureSelector(selector: string): boolean {
  return BROAD_SELECTORS.has(selector.trim().toLowerCase());
}

export async function findUsefulDataSelector(page: Page): Promise<string | null> {
  for (const selector of DATA_INDICATOR_SELECTORS) {
    const count = Math.min(await page.locator(selector).count().catch(() => 0), 8);
    for (let index = 0; index < count; index += 1) {
      const locator = page.locator(selector).nth(index);
      if (await getUsefulIndicator(selector, locator).catch(() => false)) {
        return selector;
      }
    }
  }

  return null;
}

export async function ensureUsefulCapturePage(page: Page, platformKey: string): Promise<string> {
  const selector = await findUsefulDataSelector(page);
  if (!selector) {
    throw new Error(`No chart or meaningful data block detected on ${platformKey} page`);
  }

  return selector;
}
