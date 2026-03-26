import { describe, expect, it } from "vitest";

import { loadPlatformConfig } from "../../src/config/loaders";

describe("dappradar platform config", () => {
  it("defines a content card capture for dapp pages", async () => {
    const config = await loadPlatformConfig("dappradar");

    expect(config.platformKey).toBe("dappradar");
    expect(config.matchRules).toHaveLength(1);
    expect(config.captures.map((entry) => entry.captureKey)).toEqual([
      "dapp_content_card"
    ]);
    expect(config.captures[0]?.selectors[0]).toBe("div.ContentCard");
  });
});
