import { describe, expect, it, vi } from "vitest";

import { prepareCoinMarketCapPage } from "../../src/capture/prepare-coinmarketcap";

describe("prepareCoinMarketCapPage", () => {
  it("selects the TradingView tab on CoinMarketCap currency pages", async () => {
    const waitForFunction = vi.fn(async () => undefined);
    const evaluate = vi.fn(async () => undefined);
    const page = {
      waitForFunction,
      evaluate,
      waitForTimeout: vi.fn(async () => undefined)
    };

    await prepareCoinMarketCapPage(
      page as never,
      "https://coinmarketcap.com/currencies/bitcoin/"
    );

    expect(waitForFunction).toHaveBeenCalledWith(
      expect.any(Function),
      undefined,
      {
        timeout: 15000
      }
    );
    expect(evaluate).toHaveBeenCalledWith(expect.any(Function));
    expect(page.waitForTimeout).toHaveBeenCalledWith(6000);
  });

  it("throws if the page-side click path fails", async () => {
    const page = {
      waitForFunction: vi.fn(async () => undefined),
      evaluate: vi.fn(async () => {
        throw new Error("Visible TradingView tab not found on CoinMarketCap page");
      }),
      waitForTimeout: vi.fn(async () => undefined)
    };

    await expect(
      prepareCoinMarketCapPage(
        page as never,
        "https://coinmarketcap.com/currencies/bitcoin/"
      )
    ).rejects.toThrow("Visible TradingView tab not found on CoinMarketCap page");

    expect(page.waitForTimeout).not.toHaveBeenCalled();
  });

  it("does nothing for non-CoinMarketCap URLs", async () => {
    const page = {
      waitForFunction: vi.fn(),
      evaluate: vi.fn(),
      waitForTimeout: vi.fn(async () => undefined)
    };

    await prepareCoinMarketCapPage(page as never, "https://www.coingecko.com/en/coins/bitcoin");

    expect(page.waitForFunction).not.toHaveBeenCalled();
    expect(page.evaluate).not.toHaveBeenCalled();
    expect(page.waitForTimeout).not.toHaveBeenCalled();
  });
});
