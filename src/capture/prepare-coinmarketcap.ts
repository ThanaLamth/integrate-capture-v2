import type { Page } from "playwright";

const COINMARKETCAP_CURRENCY_URL = /^https:\/\/coinmarketcap\.com\/currencies\/[a-z0-9-]+\/?$/i;

export async function prepareCoinMarketCapPage(page: Page, url: string): Promise<void> {
  if (!COINMARKETCAP_CURRENCY_URL.test(url)) {
    return;
  }

  await page.waitForFunction(
    () =>
      Array.from(document.querySelectorAll("li")).some((node) => {
        const element = node as HTMLElement;
        return (
          element.innerText.trim() === "TradingView" &&
          element.offsetWidth > 0 &&
          element.offsetHeight > 0
        );
      }),
    undefined,
    {
      timeout: 15000
    }
  );

  await page.evaluate(() => {
    const tradingViewTab = Array.from(document.querySelectorAll("li")).find((node) => {
      const element = node as HTMLElement;
      return (
        element.innerText.trim() === "TradingView" &&
        element.offsetWidth > 0 &&
        element.offsetHeight > 0
      );
    }) as HTMLElement | undefined;

    if (!tradingViewTab) {
      throw new Error("Visible TradingView tab not found on CoinMarketCap page");
    }

    tradingViewTab.click();
  });
  await page.waitForTimeout(6000);
}
