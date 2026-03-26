import { describe, expect, it, vi } from "vitest";

import { prepareCoinGeckoPage } from "../../src/capture/prepare-coingecko";

describe("prepareCoinGeckoPage", () => {
  it("selects the TradingView live chart on CoinGecko coin pages", async () => {
    const click = vi.fn(async () => undefined);
    const waitFor = vi.fn(async () => undefined);
    const tvButton = { click, waitFor };
    const page = {
      locator: vi.fn((selector: string) => {
        if (selector === "#live-chart-tradingview") {
          return tvButton;
        }

        return { waitFor };
      }),
      waitForTimeout: vi.fn(async () => undefined)
    };

    await prepareCoinGeckoPage(page as never, "https://www.coingecko.com/en/coins/bitcoin");

    expect(page.locator).toHaveBeenNthCalledWith(1, "#live-chart-tradingview");
    expect(waitFor).toHaveBeenCalledWith({
      state: "visible",
      timeout: 15000
    });
    expect(click).toHaveBeenCalledTimes(1);
    expect(page.locator).toHaveBeenNthCalledWith(
      2,
      "[data-coin-chart-v2-target='tvLiveChartContainer']"
    );
    expect(page.waitForTimeout).toHaveBeenCalledWith(3000);
  });

  it("does nothing for non-CoinGecko URLs", async () => {
    const page = {
      locator: vi.fn(),
      waitForTimeout: vi.fn(async () => undefined)
    };

    await prepareCoinGeckoPage(page as never, "https://coinmarketcap.com/currencies/bitcoin/");

    expect(page.locator).not.toHaveBeenCalled();
    expect(page.waitForTimeout).not.toHaveBeenCalled();
  });
});
