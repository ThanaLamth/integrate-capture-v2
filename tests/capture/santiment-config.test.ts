import { describe, expect, it } from "vitest";

import { loadPlatformConfig } from "../../src/config/loaders";

describe("santiment platform config", () => {
  it("defines a social dominance chart capture for Santiment chart pages", async () => {
    const config = await loadPlatformConfig("santiment");

    expect(config.platformKey).toBe("santiment");
    expect(config.matchRules).toHaveLength(1);
    expect(config.captures.map((entry) => entry.captureKey)).toEqual([
      "social_dominance_chart"
    ]);
    expect(config.captures[0]?.selectors[0]).toBe("div.widget.column.svelte-veo1tu");
  });
});
