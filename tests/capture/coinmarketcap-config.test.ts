import { describe, expect, it } from "vitest";

import { loadPlatformConfig } from "../../src/config/loaders";
import { selectCaptureDefinition } from "../../src/capture/capture-region";

describe("coinmarketcap capture config", () => {
  it("selects the configured price chart capture for a coin detail page", async () => {
    const config = await loadPlatformConfig("coinmarketcap");

    const capture = selectCaptureDefinition(config, "coin_detail", "price_chart");

    expect(capture.captureKey).toBe("price_chart");
    expect(capture.strategy).toBe("element_or_crop");
    expect(capture.selectors[0]).toBe(
      "#section-coin-chart > div > div > div > div.sc-802a3cad-1.iFjImj > div"
    );
    expect(capture.selectors[1]).toBe("/html/body/div[1]/div[2]/div/div[2]/div/div/div[3]");
    expect(capture.cropRules?.anchorSelector).toBe("main");
    expect(capture.cropRules?.x).toBe(80);
    expect(capture.cropRules?.y).toBe(320);
    expect(capture.cropRules?.width).toBe(1180);
    expect(capture.cropRules?.height).toBe(620);
  });
});
