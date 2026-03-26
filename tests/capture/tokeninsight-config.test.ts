import { describe, expect, it } from "vitest";

import { loadPlatformConfig } from "../../src/config/loaders";

describe("tokeninsight platform config", () => {
  it("defines an exchange price chart capture for exchange pages", async () => {
    const config = await loadPlatformConfig("tokeninsight");

    expect(config.platformKey).toBe("tokeninsight");
    expect(config.matchRules).toHaveLength(1);
    expect(config.captures.map((entry) => entry.captureKey)).toEqual([
      "exchange_price_chart"
    ]);
    expect(config.captures[0]?.strategy).toBe("element_or_crop");
  });
});
