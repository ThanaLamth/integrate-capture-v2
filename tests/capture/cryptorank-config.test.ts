import { describe, expect, it } from "vitest";

import { loadPlatformConfig } from "../../src/config/loaders";

describe("cryptorank platform config", () => {
  it("defines a major token unlock capture for token unlock analytics pages", async () => {
    const config = await loadPlatformConfig("cryptorank");

    expect(config.platformKey).toBe("cryptorank");
    expect(config.matchRules).toHaveLength(1);
    expect(config.captures.map((entry) => entry.captureKey)).toEqual([
      "major_token_unlocks"
    ]);
    expect(config.captures[0]?.selectors[0]).toBe("div#major-token-unlocks");
  });
});
