import type { Page } from "playwright";

const COINGECKO_COIN_URL = /^https:\/\/www\.coingecko\.com\/en\/coins\/[a-z0-9-]+\/?$/i;

export async function prepareCoinGeckoPage(page: Page, url: string): Promise<void> {
  if (!COINGECKO_COIN_URL.test(url)) {
    return;
  }

  const tradingViewButton = page.locator("#live-chart-tradingview");
  await tradingViewButton.waitFor({
    state: "visible",
    timeout: 15000
  });
  await tradingViewButton.click();

  const chartContainer = page.locator("[data-coin-chart-v2-target='tvLiveChartContainer']");
  await chartContainer.waitFor({
    state: "visible",
    timeout: 15000
  });

  await page.waitForTimeout(3000);
}
