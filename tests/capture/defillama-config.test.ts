import { describe, expect, it } from "vitest";

import { loadPlatformConfig } from "../../src/config/loaders";

describe("defillama platform config", () => {
  it("defines explicit chain and protocol TVL chart captures", async () => {
    const config = await loadPlatformConfig("defillama");

    expect(config.platformKey).toBe("defillama");
    expect(config.matchRules).toHaveLength(2);
    expect(config.captures.map((entry) => entry.captureKey)).toEqual([
      "chain_tvl_chart",
      "protocol_tvl_chart"
    ]);
    expect(
      config.captures.find((entry) => entry.captureKey === "chain_tvl_chart")?.selectors
    ).toContain("div.relative.flex.min-h-\\[360px\\].flex-col");
    expect(
      config.captures.find((entry) => entry.captureKey === "protocol_tvl_chart")?.selectors
    ).toContain("div.relative.flex.min-h-\\[360px\\].flex-col");
  });
});
