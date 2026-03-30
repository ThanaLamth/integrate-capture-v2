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
    expect(readme).toContain("--profile-dir");
    expect(readme).toContain("--warmup");
    expect(readme).toContain("--recommend-title");
    expect(readme).toContain("--recommend-url");
    expect(readme).toContain("--check-platform-health");
    expect(readme).toContain("--plan-draft");
    expect(readme).toContain("--onboard-platform");
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
      "C:\\captures\\bitcoin.png",
      "--profile-dir",
      ".profiles/coingecko"
    ]);

    expect(parsed).toEqual({
      dryRun: false,
      platformKey: "coingecko",
      url: "https://www.coingecko.com/en/coins/bitcoin",
      captureKey: "price_chart",
      outputPath: "C:\\captures\\bitcoin.png",
      profileDir: ".profiles/coingecko"
    });
  });

  it("parses the recommendation command shape", () => {
    const parsed = parseCliArgs([
      "--recommend-title",
      "Gold Falls as Real Yields Rise",
      "--recommend-url",
      "https://coincu.com/markets/gold-falls-as-real-yields-rise-dollar-strengthens/"
    ]);

    expect(parsed).toEqual({
      dryRun: false,
      recommendTitle: "Gold Falls as Real Yields Rise",
      recommendUrl: "https://coincu.com/markets/gold-falls-as-real-yields-rise-dollar-strengthens/"
    });
  });

  it("parses the health-check command shape", () => {
    const parsed = parseCliArgs([
      "--check-platform-health",
      "--health-platform",
      "coingecko"
    ]);

    expect(parsed).toEqual({
      dryRun: false,
      checkPlatformHealth: true,
      healthPlatformKeys: ["coingecko"]
    });
  });

  it("parses the draft-planning command shape", () => {
    const parsed = parseCliArgs([
      "--plan-draft",
      "--article",
      "draft article.txt",
      "--site",
      "bitcoininfonews"
    ]);

    expect(parsed).toEqual({
      dryRun: false,
      planDraft: true,
      articlePath: "draft article.txt",
      siteId: "bitcoininfonews"
    });
  });

  it("parses the onboarding command shape", () => {
    const parsed = parseCliArgs([
      "--onboard-platform",
      "etherscan",
      "--onboard-sample-url",
      "https://etherscan.io/address/0x0000000000000000000000000000000000000000",
      "--onboard-evidence",
      "onchain_transfer"
    ]);

    expect(parsed).toEqual({
      dryRun: false,
      onboardPlatform: "etherscan",
      onboardSampleUrl: "https://etherscan.io/address/0x0000000000000000000000000000000000000000",
      onboardEvidence: ["onchain_transfer"]
    });
  });
});
