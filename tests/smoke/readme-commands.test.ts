import { readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { parseCliArgs } from "../../src/cli/index";

describe("README commands", () => {
  it("documents the supported CLI flags", async () => {
    const readme = await readFile(path.join(process.cwd(), "README.md"), "utf8");

    expect(readme).toContain("--article");
    expect(readme).toContain("--site");
    expect(readme).toContain("--dry-run");
    expect(readme).toContain("--platform");
    expect(readme).toContain("--url");
    expect(readme).toContain("--capture");
    expect(readme).toContain("--output");
  });

  it("parses the documented dry-run command shape", () => {
    const parsed = parseCliArgs([
      "--article",
      "draft article.txt",
      "--site",
      "bitcoininfonews",
      "--dry-run"
    ]);

    expect(parsed).toEqual({
      articlePath: "draft article.txt",
      siteId: "bitcoininfonews",
      dryRun: true
    });
  });

  it("defaults to live mode when --dry-run is omitted", () => {
    const parsed = parseCliArgs([
      "--article",
      "draft article.txt",
      "--site",
      "bitcoininfonews"
    ]);

    expect(parsed).toEqual({
      articlePath: "draft article.txt",
      siteId: "bitcoininfonews",
      dryRun: false
    });
  });

  it("parses the documented direct capture command shape", () => {
    const parsed = parseCliArgs([
      "--platform",
      "coingecko",
      "--url",
      "https://www.coingecko.com/en/coins/bitcoin",
      "--capture",
      "price_chart",
      "--output",
      "C:\\captures\\bitcoin.png"
    ]);

    expect(parsed).toEqual({
      dryRun: false,
      platformKey: "coingecko",
      url: "https://www.coingecko.com/en/coins/bitcoin",
      captureKey: "price_chart",
      outputPath: "C:\\captures\\bitcoin.png"
    });
  });
});
