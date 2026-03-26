import { describe, expect, it } from "vitest";

import {
  loadAssetMap,
  loadPlatformConfig,
  loadSitePriority
} from "../../src/config/loaders";

describe("config schema", () => {
  it("loads a valid CoinMarketCap platform config", async () => {
    const config = await loadPlatformConfig("coinmarketcap");

    expect(config.platformKey).toBe("coinmarketcap");
    expect(config.captures[0]?.captureKey).toBe("price_chart");
  });

  it("loads asset and site priority configs", async () => {
    const assetMap = await loadAssetMap();
    const sitePriority = await loadSitePriority();

    expect(assetMap.bitcoin.aliases).toContain("btc");
    expect(sitePriority.bitcoininfonews[0]).toBe("blockchair");
  });

  it("rejects malformed platform config objects", async () => {
    const { platformConfigSchema } = await import("../../src/config/schema");

    expect(() =>
      platformConfigSchema.parse({
        siteName: "Broken Config"
      })
    ).toThrowError();
  });
});
