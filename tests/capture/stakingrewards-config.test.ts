import { describe, expect, it } from "vitest";

import { loadPlatformConfig } from "../../src/config/loaders";

describe("stakingrewards platform config", () => {
  it("defines a provider summary card capture for provider pages", async () => {
    const config = await loadPlatformConfig("stakingrewards");

    expect(config.platformKey).toBe("stakingrewards");
    expect(config.matchRules).toHaveLength(1);
    expect(config.captures.map((entry) => entry.captureKey)).toEqual([
      "provider_summary_card"
    ]);
    expect(config.captures[0]?.strategy).toBe("element_or_crop");
  });
});
