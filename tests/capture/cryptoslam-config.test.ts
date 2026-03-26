import { describe, expect, it } from "vitest";

import { loadPlatformConfig } from "../../src/config/loaders";

describe("cryptoslam platform config", () => {
  it("defines a blockchain summary capture for blockchain pages", async () => {
    const config = await loadPlatformConfig("cryptoslam");

    expect(config.platformKey).toBe("cryptoslam");
    expect(config.matchRules).toHaveLength(1);
    expect(config.captures.map((entry) => entry.captureKey)).toEqual([
      "blockchain_summary"
    ]);
    expect(config.captures[0]?.strategy).toBe("element_or_crop");
  });
});
