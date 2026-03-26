import { describe, expect, it } from "vitest";

import { loadPlatformConfig } from "../../src/config/loaders";

describe("arkm platform config", () => {
  it("defines an entity overview capture for explorer entity pages", async () => {
    const config = await loadPlatformConfig("arkm");

    expect(config.platformKey).toBe("arkm");
    expect(config.matchRules).toHaveLength(1);
    expect(config.captures.map((entry) => entry.captureKey)).toEqual([
      "entity_overview"
    ]);
    expect(config.captures[0]?.strategy).toBe("crop");
    expect(config.captures[0]?.fallbackSelectors).toEqual(["body"]);
  });
});
