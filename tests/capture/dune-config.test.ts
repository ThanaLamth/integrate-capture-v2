import { describe, expect, it } from "vitest";

import { loadPlatformConfig } from "../../src/config/loaders";

describe("dune platform config", () => {
  it("defines a collection overview capture for collection pages", async () => {
    const config = await loadPlatformConfig("dune");

    expect(config.platformKey).toBe("dune");
    expect(config.matchRules).toHaveLength(1);
    expect(config.captures.map((entry) => entry.captureKey)).toEqual([
      "collection_overview_card"
    ]);
    expect(config.captures[0]?.strategy).toBe("element_or_crop");
  });
});
