import { describe, expect, it } from "vitest";

import { buildCropRegion, decideCaptureMode } from "../../src/capture/capture-region";

describe("capture region", () => {
  it("uses element capture when a selector is found", () => {
    const mode = decideCaptureMode({
      strategy: "element_or_crop",
      primarySelectorFound: true
    });

    expect(mode).toBe("element");
  });

  it("falls back to crop when element capture is unavailable", () => {
    const mode = decideCaptureMode({
      strategy: "element_or_crop",
      primarySelectorFound: false
    });

    expect(mode).toBe("crop");
  });

  it("builds a crop rectangle relative to the anchor box", () => {
    const crop = buildCropRegion(
      { x: 100, y: 200, width: 1200, height: 900 },
      { anchorSelector: "main", x: 80, y: 320, width: 1180, height: 620 }
    );

    expect(crop).toEqual({
      x: 180,
      y: 520,
      width: 1180,
      height: 620
    });
  });
});
