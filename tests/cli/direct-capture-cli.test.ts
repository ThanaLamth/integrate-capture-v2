import path from "node:path";
import { describe, expect, it, vi } from "vitest";

import { runCli } from "../../src/cli/index";

describe("direct capture CLI mode", () => {
  it("executes direct capture when platform/url/capture/output are provided", async () => {
    const captureExecutor = vi.fn().mockResolvedValue({
      outputPath: "C:\\captures\\bitcoin.png",
      selectorUsed: "div.chart",
      mode: "element",
      pageContext: {
        pageTitle: "Bitcoin price chart",
        summary: "Bitcoin price chart: BTC held near resistance",
        dataPoints: ["BTC held near resistance"]
      }
    });

    await runCli({
      platformKey: "coingecko",
      url: "https://www.coingecko.com/en/coins/bitcoin",
      captureKey: "price_chart",
      outputPath: "C:\\captures\\bitcoin.png",
      profileDir: ".profiles/coingecko",
      captureExecutor
    });

    expect(captureExecutor).toHaveBeenCalledOnce();
    expect(captureExecutor).toHaveBeenCalledWith({
      platformKey: "coingecko",
      url: "https://www.coingecko.com/en/coins/bitcoin",
      captureKey: "price_chart",
      outputPath: path.resolve("C:\\captures\\bitcoin.png"),
      headless: undefined,
      profileDir: path.resolve(".profiles/coingecko")
    });
  });
});
