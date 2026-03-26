import path from "node:path";
import { describe, expect, it, vi } from "vitest";

import { runCli } from "../../src/cli/index";

describe("direct capture CLI mode", () => {
  it("executes direct capture when platform/url/capture/output are provided", async () => {
    const captureExecutor = vi.fn().mockResolvedValue({
      outputPath: "C:\\captures\\bitcoin.png",
      selectorUsed: "div.chart",
      mode: "element"
    });

    await runCli({
      platformKey: "coingecko",
      url: "https://www.coingecko.com/en/coins/bitcoin",
      captureKey: "price_chart",
      outputPath: "C:\\captures\\bitcoin.png",
      captureExecutor
    });

    expect(captureExecutor).toHaveBeenCalledOnce();
    expect(captureExecutor).toHaveBeenCalledWith({
      platformKey: "coingecko",
      url: "https://www.coingecko.com/en/coins/bitcoin",
      captureKey: "price_chart",
      outputPath: path.resolve("C:\\captures\\bitcoin.png"),
      headless: undefined
    });
  });
});
