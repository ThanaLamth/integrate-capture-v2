import { describe, expect, it } from "vitest";

import { loadPlatformConfig } from "../../src/config/loaders";

describe("messari platform config", () => {
  it("defines a project snapshot chart capture for project pages", async () => {
    const config = await loadPlatformConfig("messari");

    expect(config.platformKey).toBe("messari");
    expect(config.matchRules).toHaveLength(1);
    expect(config.captures.map((entry) => entry.captureKey)).toEqual([
      "project_snapshot_chart"
    ]);
    expect(config.captures[0]?.strategy).toBe("element_or_crop");
  });
});
