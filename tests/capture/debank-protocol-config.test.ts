import { describe, expect, it } from "vitest";

import { loadPlatformConfig } from "../../src/config/loaders";

describe("debank protocol config", () => {
  it("defines a protocol summary capture", async () => {
    const config = await loadPlatformConfig("debank");

    expect(config.captures.map((entry) => entry.captureKey)).toContain("protocol_summary");
    expect(
      config.captures.find((entry) => entry.captureKey === "protocol_summary")?.selectors
    ).toContain("div.ProtocolsHeader_header__NIHdw");
  });
});
