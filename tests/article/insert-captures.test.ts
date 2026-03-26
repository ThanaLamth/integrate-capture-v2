import { describe, expect, it } from "vitest";

import { insertCaptureBlock } from "../../src/article/insert-captures";

describe("markdown capture insertion", () => {
  it("inserts a capture block after the first paragraph mentioning the asset", () => {
    const markdown = [
      "# Example",
      "",
      "Bitcoin steadies near key support.",
      "",
      "Another paragraph."
    ].join("\n");

    const result = insertCaptureBlock({
      markdown,
      assetKey: "bitcoin",
      platformKey: "coinmarketcap",
      captureKey: "price_chart",
      imagePath: "../images/bitcoin.png"
    });

    expect(result).toContain(
      "Bitcoin steadies near key support.\n\n<!-- capture:bitcoin:coinmarketcap:price_chart -->"
    );
  });

  it("falls back to a Market Snapshot section when no asset paragraph exists", () => {
    const markdown = ["# Example", "", "Macro conditions remain mixed."].join("\n");

    const result = insertCaptureBlock({
      markdown,
      assetKey: "bitcoin",
      platformKey: "coinmarketcap",
      captureKey: "price_chart",
      imagePath: "../images/bitcoin.png"
    });

    expect(result).toContain("## Market Snapshot");
    expect(result).toContain("![bitcoin price_chart](../images/bitcoin.png)");
  });
});
