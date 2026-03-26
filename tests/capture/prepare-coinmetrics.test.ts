import { describe, expect, it, vi } from "vitest";

import { prepareCoinMetricsPage } from "../../src/capture/prepare-coinmetrics";

describe("prepareCoinMetricsPage", () => {
  it("normalizes the CoinMetrics crypto-data page before capture", async () => {
    const waitForFunction = vi.fn(async () => undefined);
    const evaluate = vi.fn(async () => undefined);
    const page = {
      waitForFunction,
      evaluate,
      waitForTimeout: vi.fn(async () => undefined)
    };

    await prepareCoinMetricsPage(
      page as never,
      "https://charts.coinmetrics.io/crypto-data"
    );

    expect(waitForFunction).toHaveBeenNthCalledWith(
      1,
      expect.any(Function),
      undefined,
      {
        timeout: 15000
      }
    );
    expect(evaluate).toHaveBeenCalledWith(expect.any(Function));
    expect(waitForFunction).toHaveBeenNthCalledWith(
      2,
      expect.any(Function),
      undefined,
      {
        timeout: 15000
      }
    );
    expect(page.waitForTimeout).toHaveBeenCalledWith(2500);
  });

  it("does nothing for non-CoinMetrics URLs", async () => {
    const page = {
      waitForFunction: vi.fn(),
      evaluate: vi.fn(),
      waitForTimeout: vi.fn(async () => undefined)
    };

    await prepareCoinMetricsPage(page as never, "https://www.coingecko.com/en/coins/bitcoin");

    expect(page.waitForFunction).not.toHaveBeenCalled();
    expect(page.evaluate).not.toHaveBeenCalled();
    expect(page.waitForTimeout).not.toHaveBeenCalled();
  });
});
