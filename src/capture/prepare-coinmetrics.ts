import type { Page } from "playwright";

const COINMETRICS_URL_PATTERN = /^https:\/\/charts\.coinmetrics\.io\/crypto-data\/?$/i;

export async function prepareCoinMetricsPage(page: Page, url: string): Promise<void> {
  if (!COINMETRICS_URL_PATTERN.test(url)) {
    return;
  }

  await page.waitForFunction(
    () => Boolean(document.querySelector("[data-test='open-CryptoDataAsset-modal']")),
    undefined,
    { timeout: 15000 }
  );

  await page.evaluate(() => {
    document.querySelector("#usercentrics-cmp-ui")?.remove();

    const clickIfPresent = (selector: string): void => {
      const element = document.querySelector<HTMLElement>(selector);
      element?.click();
    };

    clickIfPresent("[data-test='close-loadChart-modal']");
    clickIfPresent("[data-test='close-RHSAxis-modal']");
  });

  await page.waitForFunction(
    () =>
      Boolean(document.querySelector("[data-test='toggle-BTC.PriceUSD-button']")) ||
      Boolean(document.querySelector("div[class*='GridPanel-chartContainer']")),
    undefined,
    { timeout: 15000 }
  );

  await page.waitForTimeout(2500);
}
