import { describe, expect, it } from "vitest";

import { loadPlatformConfig } from "../../src/config/loaders";

describe("debank platform config", () => {
  it("defines a wallet portfolio summary capture", async () => {
    const config = await loadPlatformConfig("debank");

    expect(config.platformKey).toBe("debank");
    expect(config.matchRules).toHaveLength(2);
    expect(config.captures.map((entry) => entry.captureKey)).toContain(
      "wallet_portfolio_summary"
    );
    expect(config.captures[0]?.selectors).toContain("div.AssetsOnChain_totalChain__43Xsd");
  });
});
